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

    // Extract images from structured JSON data (more reliable than HTML parsing)
    const images = new Set<string>();
    
    console.log("=== Début de l'extraction des images ===");
    
    // Method 1: Extract from window.__INITIAL_DATA__ or similar JSON structures
    const jsonDataPatterns = [
      /window\.__INITIAL_DATA__\s*=\s*({.*?});/s,
      /"imageModule"\s*:\s*({.*?})/s,
      /"imageList"\s*:\s*(\[.*?\])/s,
      /"productImage"\s*:\s*({.*?})/s,
    ];
    
    let foundInJson = false;
    for (const pattern of jsonDataPatterns) {
      const match = html.match(pattern);
      if (match) {
        console.log(`✓ Trouvé données JSON avec pattern: ${pattern.source.substring(0, 50)}...`);
        try {
          const jsonStr = match[1];
          const jsonData = JSON.parse(jsonStr);
          
          // Extract image URLs from various possible structures
          const extractImagesFromObj = (obj: any, path = '') => {
            if (!obj) return;
            
            if (typeof obj === 'string' && obj.includes('alicdn.com') && /\.(jpg|jpeg|png)/.test(obj)) {
              console.log(`  → Image trouvée dans JSON (${path}): ${obj}`);
              images.add(obj.split('?')[0]);
              foundInJson = true;
            } else if (Array.isArray(obj)) {
              obj.forEach((item, i) => extractImagesFromObj(item, `${path}[${i}]`));
            } else if (typeof obj === 'object') {
              for (const key in obj) {
                if (key.toLowerCase().includes('image') || key.toLowerCase().includes('url')) {
                  extractImagesFromObj(obj[key], `${path}.${key}`);
                }
              }
            }
          };
          
          extractImagesFromObj(jsonData, 'root');
        } catch (e) {
          const errorMsg = e instanceof Error ? e.message : String(e);
          console.log(`  ✗ Erreur parsing JSON: ${errorMsg}`);
        }
      }
    }
    
    console.log(`\nImages extraites du JSON: ${images.size}`);
    
    // Method 2: Fallback to HTML img tags (only if no JSON images found)
    if (images.size === 0) {
      console.log("\nAucune image trouvée dans JSON, essai extraction HTML...");
      
      const imageRegex = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi;
      let match;
      let totalImagesFound = 0;
      
      while ((match = imageRegex.exec(html)) !== null) {
        const imgUrl = match[1];
        totalImagesFound++;
        
        // Only accept images from s.alicdn.com or sc01-04.alicdn.com
        if (!imgUrl.includes('alicdn.com')) continue;
        
        // Must have valid extension
        if (!/\.(jpg|jpeg|png)($|\?)/i.test(imgUrl)) continue;
        
        // Exclude thumbnails and small images
        if (/_\d+x\d+\./i.test(imgUrl)) continue;
        
        // Exclude UI elements
        const excludePatterns = ['logo', 'icon', 'banner', 'button', 'payment', 'O1CN01'];
        if (excludePatterns.some(p => imgUrl.toLowerCase().includes(p))) continue;
        
        const cleanUrl = imgUrl.split('?')[0];
        console.log(`  → Image HTML acceptée: ${cleanUrl}`);
        images.add(cleanUrl);
      }
      
      console.log(`\nImages extraites du HTML: ${images.size}`);
    }
    
    // Method 3: Also try JSON-LD structured data
    const jsonLdMatch = html.match(/<script[^>]*type="application\/ld\+json"[^>]*>([^<]+)<\/script>/i);
    if (jsonLdMatch) {
      try {
        const jsonData = JSON.parse(jsonLdMatch[1]);
        if (jsonData.image) {
          if (Array.isArray(jsonData.image)) {
            jsonData.image.forEach((img: string) => {
              console.log(`  → Image JSON-LD: ${img}`);
              images.add(img.split('?')[0]);
            });
          } else {
            console.log(`  → Image JSON-LD: ${jsonData.image}`);
            images.add(jsonData.image.split('?')[0]);
          }
        }
      } catch (e) {
        console.error("Erreur parsing JSON-LD:", e);
      }
    }
    
    console.log("\n=== Résumé de l'extraction ===");
    console.log(`Total images acceptées: ${images.size}`);
    console.log(`Liste:`, Array.from(images));

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