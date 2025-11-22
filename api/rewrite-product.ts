import type { VercelRequest, VercelResponse } from "vercel";
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
  const max = 800;
  const short = base.length > max ? base.slice(0, max) + "…" : base;
  const header = lang === "fr" ? "Points forts:" : "Key features:";
  const parts = short.split(/[.;\n]+/).map((p) => p.trim()).filter(Boolean);
  const features = parts.slice(0, 5).map((p) => (p.length > 120 ? p.slice(0, 120) + "…" : p));
  const lead = lang === "fr" ? `Découvrez ${name} conçu pour offrir performance et fiabilité.` : `Discover ${name} designed for performance and reliability.`;
  const bullets = features.map((f) => `• ${f}`).join("\n");
  return `${lead}\n\n${header}\n${bullets}`;
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
        const s = await sql<{ key: string; value: string }[]>`select key, value from system_settings where key in ('gemini_enabled','gemini_model','gemini_temperature','gemini_api_key')`;
        const m = new Map(s.map(r => [r.key, r.value]));
        geminiEnabled = String(m.get('gemini_enabled') || "false").toLowerCase() === 'true';
        geminiModel = String(m.get('gemini_model') || geminiModel);
        geminiTemperature = Number(m.get('gemini_temperature') || geminiTemperature);
        apiKey = String(m.get('gemini_api_key') || apiKey);
      }

      if (geminiEnabled && apiKey) {
        const prompt = language === 'fr'
          ? `Réécris le titre et la description du produit en français, style e-commerce clair, concis, engageant. Garde factuel, pas de promesses exagérées. Retourne un JSON strict {"rewrittenTitle":"...","rewrittenDescription":"..."}.
Nom: ${productName}
Description: ${productDescription}`
          : `Rewrite the product title and description in clear, engaging e-commerce style. Keep factual, avoid exaggerated claims. Return strict JSON {"rewrittenTitle":"...","rewrittenDescription":"..."}.
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
          try {
            const parsed = JSON.parse(text);
            const rewrittenTitle = parsed.rewrittenTitle || capitalizeWords(productName);
            const rewrittenDescription = parsed.rewrittenDescription || improveDescription(rewrittenTitle, productDescription, language);
            return res.status(200).json({ rewrittenTitle, rewrittenDescription });
          } catch (_) {
          }
        }
      }
    } catch (_) {}

    const rewrittenTitle = capitalizeWords(productName);
    const rewrittenDescription = improveDescription(rewrittenTitle, productDescription, language);
    return res.status(200).json({ rewrittenTitle, rewrittenDescription });
  } catch (e: any) {
    const msg = typeof e?.message === "string" ? e.message : "Erreur inconnue";
    return res.status(400).json({ error: msg });
  }
}