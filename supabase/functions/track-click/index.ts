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
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { code } = await req.json();
    if (!code) {
      throw new Error('Code de recommandation requis');
    }

    console.log(`Tracking click pour code: ${code}`);

    // Récupérer le lien de recommandation
    const { data: referralLink, error: linkError } = await supabaseClient
      .from('referral_links')
      .select('*')
      .eq('code', code)
      .single();

    if (linkError || !referralLink) {
      console.error('Lien non trouvé:', linkError);
      throw new Error('Lien de recommandation invalide');
    }

    // Extraire les informations du client
    const userAgent = req.headers.get('user-agent') || '';
    const forwarded = req.headers.get('x-forwarded-for');
    const ipAddress = forwarded ? forwarded.split(',')[0] : req.headers.get('x-real-ip') || 'unknown';

    console.log(`IP: ${ipAddress}, User-Agent: ${userAgent}`);

    // Détection anti-fraude basique
    let isSuspicious = false;
    const suspiciousReasons = [];

    // Vérifier si l'IP a déjà cliqué récemment (dans les 5 dernières minutes)
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    const { data: recentClicks } = await supabaseClient
      .from('click_tracking')
      .select('id')
      .eq('referral_link_id', referralLink.id)
      .eq('ip_address', ipAddress)
      .gte('created_at', fiveMinutesAgo);

    if (recentClicks && recentClicks.length > 0) {
      isSuspicious = true;
      suspiciousReasons.push('Clics répétés depuis la même IP');
      console.log('⚠️ Clics répétés détectés');
    }

    // Vérifier les bots basiques
    const botPatterns = /bot|crawler|spider|scraper|curl|wget|python|java|okhttp/i;
    if (botPatterns.test(userAgent.toLowerCase())) {
      isSuspicious = true;
      suspiciousReasons.push('User-agent suspect (bot)');
      console.log('⚠️ Bot détecté');
    }

    // Vérifier user-agent vide ou trop court
    if (!userAgent || userAgent.length < 20) {
      isSuspicious = true;
      suspiciousReasons.push('User-agent invalide');
      console.log('⚠️ User-agent invalide');
    }

    console.log(`Suspicion: ${isSuspicious}, Raisons: ${suspiciousReasons.join(', ')}`);

    // Enregistrer le clic
    const { error: trackError } = await supabaseClient
      .from('click_tracking')
      .insert({
        referral_link_id: referralLink.id,
        ip_address: ipAddress,
        user_agent: userAgent,
        is_suspicious: isSuspicious,
        country: null
      });

    if (trackError) {
      console.error('Erreur tracking:', trackError);
      throw trackError;
    }

    // Incrémenter le compteur de clics seulement si non suspicieux
    if (!isSuspicious) {
      const { error: updateError } = await supabaseClient
        .from('referral_links')
        .update({ 
          clicks: (referralLink.clicks || 0) + 1 
        })
        .eq('id', referralLink.id);

      if (updateError) {
        console.error('Erreur update clicks:', updateError);
      }

      // Créer une commission pour le clic si configuré
      const { data: clickCommissionSetting } = await supabaseClient
        .from('commission_settings')
        .select('value')
        .eq('key', 'click_commission')
        .single();

      if (clickCommissionSetting && clickCommissionSetting.value > 0) {
        const { error: commissionError } = await supabaseClient
          .from('commissions')
          .insert({
            user_id: referralLink.user_id,
            referral_link_id: referralLink.id,
            type: 'click',
            amount: clickCommissionSetting.value,
            status: 'pending'
          });

        if (commissionError) {
          console.error('Erreur création commission clic:', commissionError);
        } else {
          console.log(`✅ Commission clic créée: ${clickCommissionSetting.value} FCFA`);
        }
      }
    }

    console.log('✅ Clic enregistré avec succès');

    return new Response(
      JSON.stringify({ 
        success: true, 
        suspicious: isSuspicious,
        reasons: suspiciousReasons,
        product_id: referralLink.product_id 
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