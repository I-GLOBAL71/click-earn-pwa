import type { VercelRequest, VercelResponse } from "@vercel/node";
import { neon } from "@neondatabase/serverless";

const allowHeaders = "authorization, x-client-info, apikey, content-type";

function textBetween(html: string, regex: RegExp) {
  const m = html.match(regex);
  return m && m[1] ? m[1] : "";
}

function sanitizeText(s: string) {
  return String(s || "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function extractImages(html: string) {
  const ok = (u: string) => /\.(jpg|jpeg|png|webp)(\?|$)/i.test(u) && /(alicdn|alibaba|aliexpress|ae01)/i.test(u) && !/(sprite|logo|icon|gif)/i.test(u);
  const urls = new Set<string>();
  const og = textBetween(html, /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i);
  if (og && ok(og)) urls.add(og);
  const arrayProps = ["imagePathList","images","imageUrls","previewImages","thumbs","imageList"];
  for (const prop of arrayProps) {
    const re = new RegExp(`${prop}\\s*:\\s*\\[([^\\]]+)\\]`, 'i');
    const m = html.match(re);
    if (m && m[1]) {
      const segment = m[1];
      const q = segment.match(/"(https?:[^"\s]+)"/gi) || [];
      for (const s of q) {
        const u = s.replace(/^["']|["']$/g, "");
        if (ok(u)) urls.add(u);
      }
    }
  }
  const ldMatches = html.match(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi) || [];
  for (const blk of ldMatches) {
    const m = blk.match(/<script[^>]*>([\s\S]*?)<\/script>/i);
    const json = m && m[1] ? m[1].trim() : "";
    if (json) {
      try {
        const obj = JSON.parse(json);
        const imgs = Array.isArray(obj) ? obj : [obj];
        for (const it of imgs) {
          const iv = it?.image;
          if (typeof iv === 'string') { if (ok(iv)) urls.add(iv); }
          else if (Array.isArray(iv)) { for (const u of iv) if (typeof u === 'string' && ok(u)) urls.add(u); }
        }
      } catch (_) {}
    }
  }
  const imgRe = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi;
  let m: RegExpExecArray | null;
  while ((m = imgRe.exec(html))) {
    const u = m[1];
    if (u && /^https?:\/\//i.test(u) && ok(u)) urls.add(u);
  }
  const anyUrls = Array.from(new Set((html.match(/https?:\/\/[^\s'"<>]+/gi) || [])));
  for (const u of anyUrls) { if (ok(u)) urls.add(u); }
  return Array.from(urls).slice(0, 8);
}

function extractPrice(html: string) {
  const candidates = [
    /"minPrice"\s*:\s*"?([0-9]+(?:\.[0-9]+)?)/i,
    /"maxPrice"\s*:\s*"?([0-9]+(?:\.[0-9]+)?)/i,
    /"price"\s*[:=]\s*"?([0-9]+(?:\.[0-9]+)?)/i,
    /data-price\s*=\s*"([0-9]+(?:\.[0-9]+)?)"/i,
    /\$\s*([0-9]+(?:\.[0-9]+)?)/,
  ];
  for (const r of candidates) {
    const p = textBetween(html, r);
    if (p) return p;
  }
  return "";
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Headers", allowHeaders + ", Authorization, Content-Type");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    return res.status(204).end();
  }

  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", allowHeaders + ", Authorization, Content-Type");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");

  try {
    if (req.method !== "POST") return res.status(405).json({ error: "Méthode non autorisée" });
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    const url = String(body?.url || "").trim();
    if (!url) return res.status(400).json({ error: "URL requise" });
    const isAlibaba = /alibaba\.com|aliexpress\.com/i.test(url);
    if (!isAlibaba) return res.status(400).json({ error: "URL non supportée" });

    const resp = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
    });
    if (!resp.ok) return res.status(400).json({ error: "Échec de récupération de la page" });
    const html = await resp.text();

    const title = sanitizeText(
      textBetween(html, /<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i) ||
        textBetween(html, /"name"\s*:\s*"([^"]+)"/i) ||
        textBetween(html, /<title[^>]*>([^<]+)<\/title>/i)
    );
    const description = sanitizeText(
      textBetween(html, /<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i) ||
        textBetween(html, /"description"\s*:\s*"([^"]+)"/i)
    );
    const images = extractImages(html);
    const mainImage = images[0] || textBetween(html, /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i);
    const price = extractPrice(html);

    try {
      const dbUrl = process.env.NEON_DATABASE_URL || "";
      const sql = dbUrl ? neon(dbUrl) : null;
      let geminiEnabled = false;
      let geminiModel = "gemini-1.5-flash";
      let geminiTemperature = 0.2;
      let apiKey = process.env.GEMINI_API_KEY || "";
      if (sql) {
        const s = await sql<{ key: string; value: string }[]>`select key, value from system_settings where key in ('gemini_enabled','gemini_model','gemini_temperature','gemini_api_key')`;
        const m = new Map(s.map(r => [r.key, r.value]));
        geminiEnabled = String(m.get('gemini_enabled') || "false").toLowerCase() === 'true';
        geminiModel = String(m.get('gemini_model') || geminiModel);
        geminiTemperature = Number(m.get('gemini_temperature') || geminiTemperature);
        apiKey = String(m.get('gemini_api_key') || apiKey);
      }

      if (geminiEnabled && apiKey) {
        const prompt = `Tu es un extracteur de données produit. À partir des métadonnées suivantes et de l'URL, retourne un JSON strict avec les clés: title, description, price (chaîne), mainImage (URL), images (liste d'URL). Ne retourne que du JSON.
URL: ${url}
Title: ${title}
Description: ${description}
MainImage: ${mainImage}
Images: ${images.slice(0, 20).join(', ')}
Prix détecté: ${price}`;
        const respAi = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(geminiModel)}:generateContent?key=${encodeURIComponent(apiKey)}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ role: 'user', parts: [{ text: prompt }]}],
            generationConfig: { temperature: geminiTemperature, maxOutputTokens: 1024 },
          })
        });
        if (respAi.ok) {
          const out = await respAi.json();
          const text = String(out?.candidates?.[0]?.content?.parts?.[0]?.text || "").trim();
          try {
            const parsed = JSON.parse(text);
            const merged = {
              title: parsed.title || title,
              description: parsed.description || description,
              price: parsed.price || price,
              mainImage: parsed.mainImage || (Array.isArray(parsed.images) && parsed.images.length ? parsed.images[0] : mainImage),
              images: Array.isArray(parsed.images) && parsed.images.length ? parsed.images.slice(0, 8) : images,
            };
            return res.status(200).json(merged);
          } catch (_) {
          }
        }
      }
    } catch (_) {}

    return res.status(200).json({ title, description, price, mainImage, images });
  } catch (e: any) {
    const msg = typeof e?.message === "string" ? e.message : "Erreur inconnue";
    return res.status(400).json({ error: msg });
  }
}
