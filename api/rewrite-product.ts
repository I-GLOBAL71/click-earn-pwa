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
  const n = normalize(name + " " + features.join(" "));
  const has = (w: string) => n.includes(w);
  let type = "Produit";
  if (has("bague") || has("ring") || has("rings")) type = "Bague";
  else if (has("collier") || has("necklace")) type = "Collier";
  else if (has("bracelet")) type = "Bracelet";
  else if (has("earring") || has("boucles") || has("earrings")) type = "Boucles d'oreilles";
  let material = "";
  if ((has("18k") || has("18 k")) && (has("or") || has("gold"))) material = "Or 18K";
  else if (has("or") || has("gold")) material = "Or";
  else if (has("plaqu") || has("plated") || has("laminated")) material = "Plaqué Or";
  else if (has("argent") || has("silver")) material = "Argent";
  let gem = "";
  if (has("zircon") || has("cubic")) gem = "Zircon";
  else if (has("perle") || has("pearl")) gem = "Perle";
  let style = "";
  if (has("dubai")) style = "Style Dubai";
  else if (has("minimal") || has("minimalist")) style = "Style minimaliste";
  else if (has("classique") || has("classic")) style = "Style classique";
  const attrs = [material, gem, style].filter(Boolean).join(" ").trim();
  const base = type !== "Produit" ? `${type} ${attrs ? attrs + " " : ""}${core}` : `${core}`;
  const top = features[0] ? shortBenefit(features[0]) : (lang === "fr" ? "Élégance au quotidien" : "Daily elegance");
  const out = `${capitalizeWords(base)} – ${top}`.replace(/\s+/g, " ").trim();
  return out.length > 80 ? out.slice(0, 78) + "…" : out;
}

function improveDescription(name: string, desc: string, lang: string) {
  const n = normalize(name + " " + desc);
  const has = (w: string) => n.includes(w);
  let type = "Produit";
  if (has("bague") || has("ring") || has("rings")) type = "Bague";
  else if (has("collier") || has("necklace")) type = "Collier";
  else if (has("bracelet")) type = "Bracelet";
  else if (has("earring") || has("boucles") || has("earrings")) type = "Boucles d'oreilles";
  let material = "";
  if ((has("18k") || has("18 k")) && (has("or") || has("gold"))) material = "Or 18K";
  else if (has("or") || has("gold")) material = "Or";
  else if (has("plaqu") || has("plated") || has("laminated")) material = "Plaqué Or";
  else if (has("argent") || has("silver")) material = "Argent";
  let gem = "";
  if (has("zircon") || has("cubic")) gem = "Zircon";
  else if (has("perle") || has("pearl")) gem = "Perle";
  let style = "";
  if (has("dubai")) style = "Style Dubai";
  else if (has("minimal") || has("minimalist")) style = "Style minimaliste";
  else if (has("classique") || has("classic")) style = "Style classique";
  const audience = has("women") || has("femme") || has("girl") ? "Femme" : has("men") || has("homme") || has("boy") ? "Homme" : "";
  const attrs = { type, material, gem, style, audience };

  const featsRaw = extractFeatureCandidates(desc).filter((f) => jaccard(f, name) < 0.6);
  const curated: string[] = [];
  if (attrs.material) curated.push(`${attrs.material} pour un éclat durable`);
  if (attrs.gem) curated.push(`${attrs.gem} scintillant`);
  if (attrs.style) curated.push(`${attrs.style} pour un look raffiné`);
  curated.push("Confort au porté, pensé pour le quotidien");
  curated.push("Design soigné, idéal en cadeau");
  const allFeats = Array.from(new Set([...curated, ...featsRaw])).filter((s) => s && s.length >= 6).slice(0, 7);
  const bullets = allFeats.map((f) => `• ${cleanText(f)}`).join("\n");

  const max = 900;
  const base = cleanText(desc);
  const short = base.length > max ? base.slice(0, max) + "…" : base;
  const parts = short.split(/[.;\n]+/).map((p) => p.trim()).filter(Boolean);
  const bannedSpecs = /(alibaba|aliexpress|buy|wholesale|product|latest)/i;
  const headerSpecs = /(points\s+forts|accroche|spécifications\s+essentielles|description)/i;
  const specsMap = new Map<string, string>();
  const specSeeds: string[] = [];
  if (attrs.material) specSeeds.push(`Matériau: ${attrs.material}`);
  if (attrs.gem) specSeeds.push(`Pierre: ${attrs.gem}`);
  if (attrs.style) specSeeds.push(`Style: ${attrs.style}`);
  if (attrs.audience) specSeeds.push(`Public: ${attrs.audience}`);
  for (const s of specSeeds) specsMap.set(normalize(s), s);
  for (const p of parts) {
    if (p.length < 6) continue;
    if (bannedSpecs.test(p)) continue;
    if (headerSpecs.test(p)) continue;
    const key = normalize(p);
    if (!specsMap.has(key)) specsMap.set(key, cleanText(p));
    if (specsMap.size >= 6) break;
  }
  const specsArr = Array.from(specsMap.values());
  const specs = specsArr.map((s) => (s.startsWith("Matériau:") || s.startsWith("Style:") || s.startsWith("Pierre:") || s.startsWith("Public:") ? `• ${s}` : `• ${s}`)).slice(0, 6).join("\n");

  const hook = lang === "fr"
    ? (attrs.material || attrs.gem || attrs.style ? `${attrs.type !== "Produit" ? attrs.type + ": " : ""}Élégance assurée, pensée pour sublimer chaque instant.` : "Faites la différence au quotidien.")
    : (attrs.material || attrs.gem || attrs.style ? "Elegance guaranteed, crafted to elevate every moment." : "Make a difference daily.");

  const who = attrs.audience ? `${attrs.audience}s` : "vous";
  const body = lang === "fr"
    ? `${capitalizeWords(attrs.type !== "Produit" ? attrs.type : "Article")} ${attrs.material ? `en ${attrs.material.toLowerCase()} ` : ""}${attrs.gem ? `avec ${attrs.gem.toLowerCase()} ` : ""}${attrs.style ? `${attrs.style.toLowerCase()} ` : ""}qui apporte une touche d'éclat à vos tenues. Idéal pour le quotidien comme les grandes occasions, il combine confort et finition soignée pour un rendu irréprochable. Offrez-le ou offrez-vous un accessoire qui marque les esprits.`
    : `A refined piece that elevates your look, perfect for daily wear and special occasions. Comfortable and carefully finished for a flawless result.`;

  const sectionBullets = lang === "fr" ? "Points forts:" : "Key strengths:";
  const sectionHook = lang === "fr" ? "Accroche:" : "Hook:";
  const sectionSpecs = lang === "fr" ? "Spécifications essentielles:" : "Essential specs:";
  const sectionDesc = lang === "fr" ? "Description:" : "Description:";

  return `${sectionHook} ${hook}\n\n${sectionDesc}\n${body}\n\n${sectionBullets}\n${bullets}\n\n${sectionSpecs}\n${specs}`.replace(/\s+\n/g, "\n");
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

function applyTemplate(s: string, ctx: Record<string, string>) {
  const text = String(s || "");
  if (!text.trim()) return text;
  const keys = Object.keys(ctx);
  let out = text;
  for (const k of keys) {
    const val = String(ctx[k] || "");
    const re = new RegExp(`\\{\\{\\s*${k}\\s*\\}}|\\{\\s*${k}\\s*\\}`, 'gi');
    out = out.replace(re, val);
  }
  return out;
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
    const titlePrompt = String(body?.titlePrompt || "").trim();
    const descriptionPrompt = String(body?.descriptionPrompt || "").trim();
    if (!productName || !productDescription) return res.status(400).json({ error: "Données manquantes" });

    const featuresPreview = extractFeatureCandidates(productDescription).slice(0, 7);

    try {
      const dbUrl = process.env.NEON_DATABASE_URL || "";
      const sql = dbUrl ? neon(dbUrl) : null;
      let geminiEnabled = false;
      let geminiModel = "gemini-1.5-flash";
      let geminiTemperature = 0.5;
      let apiKey = process.env.GEMINI_API_KEY || "";
      let defaultTitlePrompt = "";
      let defaultDescriptionPrompt = "";
      const seedTitleFr = "À partir de {name} et des signaux {features}, rédiger un titre ultra-accrocheur en ≤12 mots, bénéfice clair, verbe d'action, ton premium accessible, sans jargon ni marque; mettre la promesse et la différenciation.";
      const seedTitleEn = "Using {name} and signals {features}, write a highly catchy title ≤12 words, benefit-first, action verb, premium yet accessible tone, no jargon or brand; highlight promise and differentiation.";
      const seedDescFr = "À partir de {name} et {description}, écrire une description persuasive et claire en {lang}: 1) Accroche 1 phrase; 2) 5–7 puces (•) de bénéfices concrets centrés utilisateur, inspirées de {features} quand pertinent, phrases courtes, sans jargon; 3) Section 'Spécifications essentielles' 3–5 puces factuelles; 4) Ton premium accessible; 5) Éviter toute mention de la source ou termes techniques inutiles.";
      const seedDescEn = "Based on {name} and {description}, write a persuasive, clear description in {lang}: 1) One-sentence hook; 2) 5–7 bullets (•) of concrete user benefits, inspired by {features} when relevant, short sentences, no jargon; 3) 'Essential specs' section with 3–5 factual bullets; 4) Premium yet accessible tone; 5) Avoid source mentions or unnecessary technical terms.";
      if (sql) {
        const s = await sql<{ key: string; value: string }[]>`select key, value from system_settings where key in ('gemini_enabled','gemini_model','gemini_temperature','gemini_api_key','default_title_prompt','default_description_prompt')`;
        const m = new Map(s.map((r) => [r.key, r.value]));
        geminiEnabled = String(m.get('gemini_enabled') || "false").toLowerCase() === 'true';
        geminiModel = String(m.get('gemini_model') || geminiModel);
        geminiTemperature = Number(m.get('gemini_temperature') || geminiTemperature);
        apiKey = String(m.get('gemini_api_key') || apiKey);
        defaultTitlePrompt = String(m.get('default_title_prompt') || "");
        defaultDescriptionPrompt = String(m.get('default_description_prompt') || "");
      }

      if (geminiEnabled && apiKey) {
        const baseFr = `Tu es un copywriter e-commerce. Objectif: produire un titre très accrocheur et une description structurée qui convainc les sceptiques. Retourne uniquement un JSON strict {"rewrittenTitle":"...","rewrittenDescription":"..."}. Exigences: 1) Le titre doit contenir une promesse forte ou bénéfice en très peu de mots. 2) La description commence par une section "Points forts" avec 5 à 7 puces (caractère •). 3) Ajoute ensuite une courte "Accroche" (1 phrase) et une section "Spécifications essentielles" avec 3 à 5 puces. 4) Évite toute mention technique inutile, écris naturel et orienté bénéfices.`;
        const baseEn = `You are an e-commerce copywriter. Goal: produce a highly catchy title and a structured description that converts skeptics. Return strict JSON only {"rewrittenTitle":"...","rewrittenDescription":"..."}. Requirements: 1) Title contains a strong promise or benefit in few words. 2) Description starts with a "Key strengths" section with 5–7 bullets (•). 3) Then add a short "Hook" (1 sentence) and an "Essential specs" section with 3–5 bullets. 4) Avoid unnecessary technical terms, write naturally and benefit-driven.`;
        const effectiveTitlePrompt = (titlePrompt || defaultTitlePrompt || (language === 'fr' ? seedTitleFr : seedTitleEn));
        const effectiveDescPrompt = (descriptionPrompt || defaultDescriptionPrompt || (language === 'fr' ? seedDescFr : seedDescEn));
        const ctx = { name: productName, description: productDescription, lang: language, features: featuresPreview.join(' | ') };
        const effTitle = applyTemplate(effectiveTitlePrompt, ctx);
        const effDesc = applyTemplate(effectiveDescPrompt, ctx);
        const customFr = `${effTitle ? `\nConsignes spécifiques pour le titre: ${effTitle}` : ''}${effDesc ? `\nConsignes spécifiques pour la description: ${effDesc}` : ''}\nLangue de sortie: fr. Évite l'anglais sauf noms propres.`;
        const customEn = `${effTitle ? `\nSpecific title instructions: ${effTitle}` : ''}${effDesc ? `\nSpecific description instructions: ${effDesc}` : ''}\nOutput language: en.`;
        const prompt = (language === 'fr' ? baseFr + customFr : baseEn + customEn) + `\nData: name=${productName} description=${productDescription}`;
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
          return res.status(200).json({ rewrittenTitle: rt, rewrittenDescription: rd, aiUsed: true, source: 'gemini', model: geminiModel, temperature: geminiTemperature });
        }
      }
    } catch (_) { void 0; }

    const feats = extractFeatureCandidates(productDescription).slice(0, 7);
    const rewrittenTitle = ensureTitleChanged(productName, composeTitle(productName, feats, language) || capitalizeWords(productName), language, feats);
    const rewrittenDescription = improveDescription(rewrittenTitle, productDescription, language);
    return res.status(200).json({ rewrittenTitle, rewrittenDescription, aiUsed: false, source: 'heuristic' });
  } catch (e) {
    const msg = typeof e?.message === "string" ? e.message : "Erreur inconnue";
    return res.status(400).json({ error: msg });
  }
}
