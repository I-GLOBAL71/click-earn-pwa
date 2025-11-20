import type { VercelRequest, VercelResponse } from "vercel";

const allowHeaders = "authorization, x-client-info, apikey, content-type";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Headers", allowHeaders);
    return res.status(204).end();
  }

  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", allowHeaders);

  try {
    const { productName, productDescription, language = "fr" } = typeof req.body === "string" ? JSON.parse(req.body) : req.body || {};
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) return res.status(500).json({ error: "LOVABLE_API_KEY non configurée" });

    const systemPrompt = language === "fr"
      ? "Tu es un expert en rédaction de contenus pour le e-commerce. Tu dois réécrire le titre et la description du produit de manière attractive, professionnelle et optimisée pour le SEO. Utilise un ton engageant qui donne envie d'acheter. Pour le titre, garde-le concis (maximum 80 caractères). Pour la description, mets en avant les bénéfices et caractéristiques clés."
      : "You are an expert in writing content for e-commerce. You must rewrite both the product title and description in an attractive, professional way optimized for SEO. Use an engaging tone that makes people want to buy. For the title, keep it concise (maximum 80 characters). For the description, highlight key benefits and features.";

    const userPrompt = language === "fr"
      ? `Titre actuel: ${productName}\n\nDescription actuelle: ${productDescription}\n\nRéécris le titre (maximum 80 caractères) et la description de manière plus attractive et professionnelle en français. Réponds au format JSON avec les clés "title" et "description".`
      : `Current title: ${productName}\n\nCurrent description: ${productDescription}\n\nRewrite the title (maximum 80 characters) and description in a more attractive and professional way in English. Respond in JSON format with "title" and "description" keys.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) return res.status(429).json({ error: "Trop de requêtes, veuillez réessayer plus tard." });
      if (response.status === 402) return res.status(402).json({ error: "Crédits insuffisants. Veuillez ajouter des crédits à Lovable AI." });
      const errorText = await response.text();
      return res.status(500).json({ error: `Erreur IA: ${errorText}` });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) return res.status(500).json({ error: "Aucun contenu généré" });
    const parsed = JSON.parse(content);
    const { title: rewrittenTitle, description: rewrittenDescription } = parsed || {};
    if (!rewrittenTitle || !rewrittenDescription) return res.status(500).json({ error: "Format de réponse invalide" });

    return res.status(200).json({ rewrittenTitle, rewrittenDescription });
  } catch (e: any) {
    const msg = typeof e?.message === "string" ? e.message : "Erreur inconnue";
    return res.status(500).json({ error: msg });
  }
}