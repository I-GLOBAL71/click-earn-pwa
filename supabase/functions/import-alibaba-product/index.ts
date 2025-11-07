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
    const { url } = await req.json();
    
    if (!url) {
      throw new Error("URL manquante");
    }

    console.log("Extraction des données Alibaba depuis:", url);

    // Fetch the Alibaba page
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status}`);
    }

    const html = await response.text();

    // Extract product data using regex patterns
    const extractData = {
      title: "",
      description: "",
      price: "",
      mainImage: "",
      images: [] as string[],
    };

    // Extract title
    const titleMatch = html.match(/<h1[^>]*class="[^"]*product-title[^"]*"[^>]*>([^<]+)<\/h1>/i) ||
                       html.match(/<title>([^<]+)<\/title>/i);
    if (titleMatch) {
      extractData.title = titleMatch[1].trim().replace(/&quot;/g, '"').replace(/&amp;/g, '&');
    }

    // Extract description
    const descMatch = html.match(/<div[^>]*class="[^"]*description[^"]*"[^>]*>([^<]+)<\/div>/i) ||
                      html.match(/<meta[^>]*name="description"[^>]*content="([^"]+)"/i);
    if (descMatch) {
      extractData.description = descMatch[1].trim().replace(/&quot;/g, '"').replace(/&amp;/g, '&');
    }

    // Extract price
    const priceMatch = html.match(/price["\s:]+([0-9.,]+)/i) ||
                       html.match(/\$\s*([0-9.,]+)/i);
    if (priceMatch) {
      const priceStr = priceMatch[1].replace(/,/g, '');
      const priceUSD = parseFloat(priceStr);
      // Convert USD to FCFA (approximate rate: 1 USD = 600 FCFA)
      extractData.price = Math.round(priceUSD * 600).toString();
    }

    // Extract images - STRICT filtering for product images only
    const imageRegex = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi;
    const images = new Set<string>();
    let match;
    
    // Comprehensive keywords to exclude (logos, icons, UI elements, banners)
    const excludeKeywords = [
      'logo', 'icon', 'flag', 'badge', 'payment', 'visa', 'mastercard',
      'paypal', 'amex', 'discover', 'alipay', 'wechat', 'google', 'apple',
      'banner', 'header', 'footer', 'button', 'arrow', 'star', 'check',
      'avatar', 'profile', 'common', 'imgextra', 'tps-', '-tps-',
      'O1CN01', // Alibaba system images
    ];
    
    while ((match = imageRegex.exec(html)) !== null) {
      const imgUrl = match[1];
      const urlLower = imgUrl.toLowerCase();
      
      // ONLY accept images from /kf/ path with specific structure
      // Product images on Alibaba are typically at sc01-04.alicdn.com/kf/[hash].[jpg|png]
      const isKfImage = imgUrl.includes('/kf/') && 
                        (imgUrl.includes('sc01.alicdn') ||
                         imgUrl.includes('sc02.alicdn') ||
                         imgUrl.includes('sc03.alicdn') ||
                         imgUrl.includes('sc04.alicdn'));
      
      if (!isKfImage) continue;
      
      // Exclude if contains any exclude keywords
      const shouldExclude = excludeKeywords.some(keyword => 
        urlLower.includes(keyword.toLowerCase())
      );
      
      if (shouldExclude) continue;
      
      // Exclude images with dimension suffixes (thumbnails/icons)
      const hasDimensionSuffix = /_\d+x\d+\./i.test(imgUrl) || 
                                 /\.\w+_\d+x\d+\./i.test(imgUrl);
      
      if (hasDimensionSuffix) continue;
      
      // Only accept .jpg, .jpeg, .png images
      const hasValidExtension = /\.(jpg|jpeg|png)($|\?)/i.test(imgUrl);
      
      if (!hasValidExtension) continue;
      
      // Extract clean URL (remove query parameters if present)
      const cleanUrl = imgUrl.split('?')[0];
      
      images.add(cleanUrl);
    }

    // Also try to find images in JSON-LD or data attributes
    const jsonLdMatch = html.match(/<script[^>]*type="application\/ld\+json"[^>]*>([^<]+)<\/script>/i);
    if (jsonLdMatch) {
      try {
        const jsonData = JSON.parse(jsonLdMatch[1]);
        if (jsonData.image) {
          if (Array.isArray(jsonData.image)) {
            jsonData.image.forEach((img: string) => images.add(img));
          } else {
            images.add(jsonData.image);
          }
        }
      } catch (e) {
        console.error("Erreur parsing JSON-LD:", e);
      }
    }

    const imageArray = Array.from(images);
    if (imageArray.length > 0) {
      extractData.mainImage = imageArray[0];
      extractData.images = imageArray;
    }

    console.log("Données extraites:", extractData);

    // If no data was extracted, provide a helpful error
    if (!extractData.title && !extractData.description) {
      return new Response(
        JSON.stringify({ 
          error: "Impossible d'extraire les données. Veuillez vérifier l'URL ou essayer une autre page produit Alibaba."
        }), 
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      );
    }

    return new Response(JSON.stringify(extractData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error("Erreur import Alibaba:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Erreur inconnue lors de l'extraction"
      }), 
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});