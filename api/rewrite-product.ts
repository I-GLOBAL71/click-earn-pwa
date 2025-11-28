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

function normalize(s: string) {
  return cleanText(s).toLowerCase().replace(/[^a-z0-9àâäéèêëîïôöùûüç\s]/gi, "").replace(/\s+/g, " ").trim();
}

function tokens(s: string) {
  return normalize(s).split(/\s+/).filter(Boolean);
}

function jaccard(a: string, b: string) {
  const ta = new Set(tokens(a));
  const tb = new Set(tokens(b));
  if (ta.size === 0 && tb.size === 0) return 1;
  let inter = 0;
  for (const t of ta) if (tb.has(t)) inter++;
  const union = ta.size + tb.size - inter;
  return union === 0 ? 0 : inter / union;
}

function sanitizeName(name: string) {
  const base = cleanText(name)
    .replace(/-\s*buy[^-]*$/i, "")
    .replace(/on\s+alibaba\.?com/ig, "")
    .replace(/wholesale|latest|simple\b/ig, "")
    .replace(/\bproduct\b/ig, "")
    .replace(/\s+/g, " ")
    .trim();
  const head = (base.split(/\s*-\s*/)[0] || base).toLowerCase();
  const stop = new Set(["fashion","jewelry","designs","latest","simple","women","girl","buy","wholesale","product","alibaba","jewelri"]);
  const prefer = new Set(["ring","rings","bague","gold","or","18k","dubai"]);
  const toks = tokens(head);
  const selected: string[] = [];
  for (const t of toks) {
    if (prefer.has(t) || (!stop.has(t) && selected.length < 6)) selected.push(t);
  }
  const dedup = Array.from(new Set(selected));
  const out = capitalizeWords(dedup.join(" ")) || capitalizeWords(tokens(head).slice(0, 5).join(" "));
  return out.length > 60 ? out.slice(0, 58) + "…" : out;
}

function shortBenefit(s: string) {
  const txt = cleanText(s);
  const words = txt.split(/\s+/).slice(0, 8).join(" ");
  const cut = words.length > 60 ? words.slice(0, 60) + "…" : words;
  return cut.replace(/[.;,:\-–—]+$/g, "");
}

function extractFeatureCandidates(desc: string) {
  const raw = String(desc || "");
  const lines = raw.split(/\n+/).map((l) => l.trim()).filter(Boolean);
  const sentences = raw.split(/[.!?;\n]+/).map((s) => s.trim()).filter((s) => s.length >= 6);
  const adjectives = new Set(["rapide","compact","robuste","puissant","premium","ergonomique","durable","garantie","polyvalent","intelligent","économique","efficace","fiable","performant","confortable"]);
  const banned = /(alibaba|aliexpress|buy|wholesale|product|latest)/i;
  const sectionHeaders = /(points\s+forts|accroche|spécifications\s+essentielles)/i;

  type Cand = { t: string; score: number };
  const map = new Map<string, Cand>();

  const push = (text: string, bonus: number) => {
    const n = normalize(text);
    if (!n || n.length < 5) return;
    const prev = map.get(n);
    const baseLen = cleanText(text).length;
    let s = bonus;
    if (baseLen >= 20 && baseLen <= 120) s += 0.5;
    const hasAdj = Array.from(adjectives).some((a) => n.includes(a));
    if (hasAdj) s += 0.5;
    const val = { t: cleanText(text), score: (prev?.score || 0) + s };
    map.set(n, val);
  };

  for (const l of lines) {
    if (banned.test(l) || sectionHeaders.test(l)) continue;
    if (/^[-*•]/.test(l)) push(l.replace(/^[-*•]\s*/, ""), 2);
    else if (/^[^:]{2,}\s*:\s*[^:]{2,}$/.test(l)) push(l.replace(/\s*:\s*/g, ": "), 1.5);
  }

  for (const s of sentences) { if (!banned.test(s) && !sectionHeaders.test(s)) push(s, 1); }

  return Array.from(map.values())
    .sort((a, b) => b.score - a.score)
    .map((c) => (c.t.length > 130 ? c.t.slice(0, 130) + "…" : c.t));
}

function composeTitle(name: string, features: string[], lang: string) {
  const core = sanitizeName(name);
  const top = features[0] ? shortBenefit(features[0]) : "Performance et Fiabilité";
  if (lang === "fr") return `${core} – ${top}`;
  return `${core} – ${top}`;
}

function improveDescription(name: string, desc: string, lang: string) {
  const feats = extractFeatureCandidates(desc).filter((f) => jaccard(f, name) < 0.6);
  const topFeats = feats.slice(0, 7);
  const ensureFeats = topFeats.length ? topFeats : [
    "Qualité de fabrication fiable",
    "Conçu pour durer au quotidien",
    "Excellente valeur pour votre budget",
    "Facile à utiliser et à installer",
    "Service et support disponibles"
  ];
  const bullets = ensureFeats.map((f) => `• ${f}`).join("\n");

  const max = 900;
  const base = cleanText(desc);
  const short = base.length > max ? base.slice(0, max) + "…" : base;
  const parts = short.split(/[.;\n]+/).map((p) => p.trim()).filter(Boolean);
  const bannedSpecs = /(alibaba|aliexpress|buy|wholesale|product|latest)/i;
  const headerSpecs = /(points\s+forts|accroche|spécifications\s+essentielles)/i;
  const specsMap = new Map<string, string>();
  for (const p of parts) {
    if (p.length < 6) continue;
    if (ensureFeats.includes(p)) continue;
    if (bannedSpecs.test(p)) continue;
    if (headerSpecs.test(p)) continue;
    const key = normalize(p);
    if (!specsMap.has(key)) specsMap.set(key, cleanText(p));
    if (specsMap.size >= 5) break;
  }
  const specsArr = Array.from(specsMap.values());
  const specs = (specsArr.length ? specsArr : ensureFeats.slice(0, 3)).map((s) => `• ${s}`).join("\n");

  const hook = lang === "fr" ? "Faites la différence au quotidien." : "Make a difference daily.";
  const sectionBullets = lang === "fr" ? "Points forts:" : "Key strengths:";
  const sectionHook = lang === "fr" ? "Accroche:" : "Hook:";
  const sectionSpecs = lang === "fr" ? "Spécifications essentielles:" : "Essential specs:";

  return `${sectionBullets}\n${bullets}\n\n${sectionHook} ${hook}\n\n${sectionSpecs}\n${specs}`;
}

function safeJson(text: string) {
  const t = String(text || "").trim();
  try {
    return JSON.parse(t);
  } catch (_) { void 0; }
  const start = t.indexOf("{");
  const end = t.lastIndexOf("}");
  if (start >= 0 && end > start) {
    const sub = t.slice(start, end + 1);
    try {
      return JSON.parse(sub);
    } catch (_) { void 0; }
  }
  return null;
}

function pickString(obj: Record<string, unknown>, keys: string[]): string {
  for (const k of keys) {
    const v = obj && typeof obj[k] === 'string' ? (obj[k] as string) : '';
    if (v && v.trim()) return v.trim();
  }
  return '';
}

function ensureTitleChanged(original: string, candidate: string, lang: string, features: string[]) {
  const o = cleanText(original).toLowerCase();
  const c = cleanText(candidate).toLowerCase();
  if (!c) return composeTitle(original, features, lang);
  if (c === o || jaccard(original, candidate) > 0.8) {
    const m = composeTitle(original, features, lang);
    if (cleanText(m).toLowerCase() !== o) return m;
    const prefix = lang === 'fr' ? 'Nouveau: ' : 'New: ';
    const s = sanitizeName(original);
    return prefix + s;
  }
  return candidate;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const origin = String(req.headers.origin || "*");
  const allowed = new Set(["http://localhost:3000","https://click-earn-pwa.vercel.app"]);
  const corsOrigin = allowed.has(origin) ? origin : "*";
  res.setHeader("Vary", "Origin");
  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Origin", corsOrigin);
    res.setHeader("Access-Control-Allow-Headers", allowHeaders + ", Authorization, Content-Type");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Max-Age", "86400");
    return res.status(204).end();
  }

  res.setHeader("Access-Control-Allow-Origin", corsOrigin);
  res.setHeader("Access-Control-Allow-Headers", allowHeaders + ", Authorization, Content-Type");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");

  try {
    if (req.method !== "POST") return res.status(405).json({ error: "Méthode non autorisée" });
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    const productName = String(body?.productName || "").trim();
    const productDescription = String(body?.productDescription || "").trim();
    const language = String(body?.language || "fr").trim().toLowerCase();
    if (!productName || !productDescription) return res.status(400).json({ error: "Données manquantes" });

    const featuresPreview = extractFeatureCandidates(productDescription).slice(0, 7);

    try {
      const dbUrl = process.env.NEON_DATABASE_URL || "";
      const sql = dbUrl ? neon(dbUrl) : null;
      let geminiEnabled = false;
      let geminiModel = "gemini-1.5-flash";
      let geminiTemperature = 0.5;
      let apiKey = process.env.GEMINI_API_KEY || "";
      if (sql) {
        const s = await sql<{ key: string; value: string }[]>`select key, value from system_settings where key in ('gemini_enabled','gemini_model','gemini_temperature','gemini_api_key')`;
        const m = new Map(s.map((r) => [r.key, r.value]));
        geminiEnabled = String(m.get('gemini_enabled') || "false").toLowerCase() === 'true';
        geminiModel = String(m.get('gemini_model') || geminiModel);
        geminiTemperature = Number(m.get('gemini_temperature') || geminiTemperature);
        apiKey = String(m.get('gemini_api_key') || apiKey);
      }

      if (geminiEnabled && apiKey) {
        const prompt = language === 'fr'
          ? `Tu es un copywriter e-commerce. Objectif: produire un titre très accrocheur et une description structurée qui convainc les sceptiques. Retourne uniquement un JSON strict {"rewrittenTitle":"...","rewrittenDescription":"..."}. Exigences: 1) Le titre doit contenir une promesse forte ou bénéfice en très peu de mots. 2) La description commence par une section "Points forts" avec 5 à 7 puces (caractère •). 3) Ajoute ensuite une courte "Accroche" (1 phrase) et une section "Spécifications essentielles" avec 3 à 5 puces. 4) Évite toute mention technique inutile, écris naturel et orienté bénéfices. Données: Nom=${productName} Description=${productDescription}`
          : `You are an e-commerce copywriter. Goal: produce a highly catchy title and a structured description that converts skeptics. Return strict JSON only {"rewrittenTitle":"...","rewrittenDescription":"..."}. Requirements: 1) Title contains a strong promise or benefit in few words. 2) Description starts with a "Key strengths" section with 5–7 bullets (•). 3) Then add a short "Hook" (1 sentence) and an "Essential specs" section with 3–5 bullets. 4) Avoid unnecessary technical terms, write naturally and benefit-driven. Data: Name=${productName} Description=${productDescription}`;
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
          const rt = ensureTitleChanged(productName, rtRaw || composeTitle(productName, featuresPreview, language), language, featuresPreview);
          const rd = improveDescription(rt, rdRaw || productDescription, language);
          return res.status(200).json({ rewrittenTitle: rt, rewrittenDescription: rd });
        }
      }
    } catch (_) { void 0; }

    const feats = extractFeatureCandidates(productDescription).slice(0, 7);
    const rewrittenTitle = ensureTitleChanged(productName, composeTitle(productName, feats, language) || capitalizeWords(productName), language, feats);
    const rewrittenDescription = improveDescription(rewrittenTitle, productDescription, language);
    return res.status(200).json({ rewrittenTitle, rewrittenDescription });
  } catch (e) {
    const msg = typeof e?.message === "string" ? e.message : "Erreur inconnue";
    return res.status(400).json({ error: msg });
  }
}
