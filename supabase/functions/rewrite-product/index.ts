import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { productName, productDescription, language = 'fr' } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const systemPrompt = language === 'fr' 
      ? "Tu es un expert en rédaction de contenus pour le e-commerce. Tu dois réécrire le titre et la description du produit de manière attractive, professionnelle et optimisée pour le SEO. Utilise un ton engageant qui donne envie d'acheter. Pour le titre, garde-le concis (maximum 80 caractères). Pour la description, mets en avant les bénéfices et caractéristiques clés."
      : "You are an expert in writing content for e-commerce. You must rewrite both the product title and description in an attractive, professional way optimized for SEO. Use an engaging tone that makes people want to buy. For the title, keep it concise (maximum 80 characters). For the description, highlight key benefits and features.";

    const userPrompt = language === 'fr'
      ? `Titre actuel: ${productName}\n\nDescription actuelle: ${productDescription}\n\nRéécris le titre (maximum 80 caractères) et la description de manière plus attractive et professionnelle en français. Réponds au format JSON avec les clés "title" et "description".`
      : `Current title: ${productName}\n\nCurrent description: ${productDescription}\n\nRewrite the title (maximum 80 characters) and description in a more attractive and professional way in English. Respond in JSON format with "title" and "description" keys.`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        response_format: { type: "json_object" }
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Trop de requêtes, veuillez réessayer plus tard.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Crédits insuffisants. Veuillez ajouter des crédits à votre espace de travail Lovable AI.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      throw new Error('Erreur lors de la réécriture');
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('Aucun contenu généré');
    }

    const parsedContent = JSON.parse(content);
    const { title: rewrittenTitle, description: rewrittenDescription } = parsedContent;

    if (!rewrittenTitle || !rewrittenDescription) {
      throw new Error('Format de réponse invalide');
    }

    return new Response(
      JSON.stringify({ rewrittenTitle, rewrittenDescription }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in rewrite-product function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});