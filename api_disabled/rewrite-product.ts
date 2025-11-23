import type { VercelRequest, VercelResponse } from "@vercel/node";
import { neon } from "@neondatabase/serverless";

const allowHeaders = "authorization, x-client-info, apikey, content-type";

function capitalizeWords(s: string) {
  const small = new Set(["de","du","des","la","le","les","et","ou","à","en","pour","par","sur","avec"]);
  return s
    .toLowerCase()
    .split(/\s+/)
    .map((w, i) => (i > 0 && small.has(w) ? w : w.charAt(0).toUpperCase() + w.slice(1)))
    .join(" ");
}

function cleanText(s: string) {
  return String(s || "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function improveDescription(name: string, desc: string, lang: string) {
  const base = cleanText(desc);
  const max = 900;
  const short = base.length > max ? base.slice(0, max) + "…" : base;
  const parts = short.split(/[.;\n]+/).map((p) => p.trim()).filter(Boolean);
  const core = parts.filter((p) => p.length >= 8);
  const features = core.slice(0, 7).map((p) => (p.length > 140 ? p.slice(0, 140) + "…" : p));
  const hook = lang === "fr" ? `Boostez vos ventes avec ${name}.` : `Boost your results with ${name}.`;
  const section1 = lang === "fr" ? "Accroche:" : "Hook:";
  const section2 = lang === "fr" ? "Points clés:" : "Key points:";
  const section3 = lang === "fr" ? "Spécifications essentielles:" : "Essential specs:";
  const bullets = features.map((f) => `• ${f}`).join("\n");
  const specsSrc = core.slice(7, 12);
  const specs = (specsSrc.length ? specsSrc : features.slice(0, 3)).map((s) => `• ${s}`).join("\n");
  return `${section1} ${hook}\n\n${section2}\n${bullets}\n\n${section3}\n${specs}`;
}

function marketingTitle(name: string, lang: string) {
  const base = cleanText(name);
  if (!base) return "";
  const core = capitalizeWords(base);
  if (lang === "fr") return `${core} – Performance et Fiabilité`;
  return `${core} – Performance & Reliability`;
}

function safeJson(text: string) {
  const t = String(text || "").trim();
  try {
    return JSON.parse(t);
  } catch (_) {}
  const start = t.indexOf("{");
  const end = t.lastIndexOf("}");
  if (start >= 0 && end > start) {
    const sub = t.slice(start, end + 1);
    try {
      return JSON.parse(sub);
    } catch (_) {}
  }
  return null;
}

function pickString(obj: any, keys: string[]): string {
  for (const k of keys) {
    const v = obj && typeof obj[k] === 'string' ? obj[k] : '';
    if (v && v.trim()) return v.trim();
  }
  return '';
}

function ensureTitleChanged(original: string, candidate: string, lang: string) {
  const o = cleanText(original).toLowerCase();
  const c = cleanText(candidate).toLowerCase();
  if (!c) return marketingTitle(original, lang);
  if (c === o) {
    const m = marketingTitle(original, lang);
    if (cleanText(m).toLowerCase() !== o) return m;
    const prefix = lang === 'fr' ? 'Nouveau: ' : 'New: ';
    return prefix + capitalizeWords(original);
  }
  return candidate;
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
    const productName = String(body?.productName || "").trim();
    const productDescription = String(body?.productDescription || "").trim();
    const language = String(body?.language || "fr").trim().toLowerCase();
    if (!productName || !productDescription) return res.status(400).json({ error: "Données manquantes" });

    try {
      const dbUrl = process.env.NEON_DATABASE_URL || "";
      const sql = dbUrl ? neon(dbUrl) : null;
      let geminiEnabled = false;
      let geminiModel = "gemini-1.5-flash";
      let geminiTemperature = 0.5;
      let apiKey = process.env.GEMINI_API_KEY || "";
      if (sql) {
        const s = await sql`select key, value from system_settings where key in ('gemini_enabled','gemini_model','gemini_temperature','gemini_api_key')`;
        const m = new Map(s.map(r => [r.key, r.value]));
        geminiEnabled = String(m.get('gemini_enabled') || "false").toLowerCase() === 'true';
        geminiModel = String(m.get('gemini_model') || geminiModel);
        geminiTemperature = Number(m.get('gemini_temperature') || geminiTemperature);
        apiKey = String(m.get('gemini_api_key') || apiKey);
      }

      if (geminiEnabled && apiKey) {
        const prompt = language === 'fr'
          ? `Tu es un copywriter e-commerce. Réécris le titre et la description en français avec structure marketing concise et persuasive. Retourne uniquement un JSON strict: {"rewrittenTitle":"...","rewrittenDescription":"..."}. Exigences: 1) Titre court, impactant. 2) Description avec 3 sections: "Accroche" (1 phrase), "Points clés" (5 à 7 puces avec •), "Spécifications essentielles" (3 à 5 puces). 3) Aucun texte hors JSON.
Nom: ${productName}
Description: ${productDescription}`
          : `You are an e-commerce copywriter. Rewrite the product title and description in English with a concise persuasive structure. Return only strict JSON: {"rewrittenTitle":"...","rewrittenDescription":"..."}. Requirements: 1) Short punchy title. 2) Description with 3 sections: "Hook" (1 sentence), "Key points" (5-7 bullets with •), "Essential specs" (3-5 bullets). 3) No text outside JSON.
Name: ${productName}
Description: ${productDescription}`;
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
          const parsed = safeJson(text) || {};
          const rtRaw = pickString(parsed, ['rewrittenTitle','title','name']);
          const rdRaw = pickString(parsed, ['rewrittenDescription','description','content']);
          const rt = ensureTitleChanged(productName, rtRaw || marketingTitle(productName, language), language);
          const rd = rdRaw && rdRaw.trim() ? rdRaw : improveDescription(rt, productDescription, language);
          return res.status(200).json({ rewrittenTitle: rt, rewrittenDescription: rd });
        }
      }
    } catch (_) {}

    const rewrittenTitle = ensureTitleChanged(productName, marketingTitle(productName, language) || capitalizeWords(productName), language);
    const rewrittenDescription = improveDescription(rewrittenTitle, productDescription, language);
    return res.status(200).json({ rewrittenTitle, rewrittenDescription });
  } catch (e: any) {
    const msg = typeof e?.message === "string" ? e.message : "Erreur inconnue";
    return res.status(400).json({ error: msg });
  }
}
