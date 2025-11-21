import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
      throw new Error('Non autorisé');
    }

    const { productId } = await req.json();
    if (!productId) {
      throw new Error('ID produit requis');
    }

    console.log(`Génération de lien de recommandation pour user: ${user.id}, produit: ${productId}`);

    // Vérifier si un lien existe déjà pour ce produit
    const { data: existingLink } = await supabaseClient
      .from('referral_links')
      .select('*')
      .eq('user_id', user.id)
      .eq('product_id', productId)
      .single();

    if (existingLink) {
      console.log(`Lien existant trouvé: ${existingLink.code}`);
      
      const publicBase = (Deno.env.get('APP_PUBLIC_URL') || 'http://localhost:3000').replace(/\/$/, '');
      const referralUrl = `${publicBase}/r/${existingLink.code}?utm_source=ambassador&utm_medium=referral&utm_campaign=${productId}`;
      
      return new Response(
        JSON.stringify({ 
          code: existingLink.code,
          url: referralUrl,
          shortUrl: referralUrl
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Générer un code unique
    const generateCode = () => {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      let code = '';
      for (let i = 0; i < 8; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return code;
    };

    let code = generateCode();
    let attempts = 0;
    
    // Vérifier l'unicité du code
    while (attempts < 10) {
      const { data: existing } = await supabaseClient
        .from('referral_links')
        .select('id')
        .eq('code', code)
        .single();
      
      if (!existing) break;
      code = generateCode();
      attempts++;
    }

    console.log(`Code unique généré: ${code}`);

    // Créer le lien de recommandation
    const { data: newLink, error } = await supabaseClient
      .from('referral_links')
      .insert({
        user_id: user.id,
        product_id: productId,
        code: code,
        clicks: 0,
        conversions: 0,
        total_commission: 0
      })
      .select()
      .single();

    if (error) {
      console.error('Erreur création lien:', error);
      throw error;
    }

    console.log(`Lien créé avec succès: ${newLink.id}`);

    const publicBase = (Deno.env.get('APP_PUBLIC_URL') || 'http://localhost:3000').replace(/\/$/, '');
    const referralUrl = `${publicBase}/r/${code}?utm_source=ambassador&utm_medium=referral&utm_campaign=${productId}`;

    return new Response(
      JSON.stringify({ 
        code: code,
        url: referralUrl,
        shortUrl: referralUrl
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Erreur:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});