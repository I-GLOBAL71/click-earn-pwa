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
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    const url = body?.url;
    if (!url) return res.status(400).json({ error: "URL manquante" });

    const response = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" } });
    if (!response.ok) return res.status(response.status).json({ error: `Erreur HTTP: ${response.status}` });
    const html = await response.text();

    const extractData: { title: string; description: string; price: string; mainImage: string; images: string[] } = {
      title: "",
      description: "",
      price: "",
      mainImage: "",
      images: [],
    };

    const titleMatch = html.match(/<h1[^>]*class="[^"]*product-title[^"]*"[^>]*>([^<]+)<\/h1>/i) || html.match(/<title>([^<]+)<\/title>/i);
    if (titleMatch) extractData.title = titleMatch[1].trim().replace(/&quot;/g, '"').replace(/&amp;/g, '&');

    const descMatch = html.match(/<div[^>]*class="[^"]*description[^"]*"[^>]*>([^<]+)<\/div>/i) || html.match(/<meta[^>]*name="description"[^>]*content="([^"]+)"/i);
    if (descMatch) extractData.description = descMatch[1].trim().replace(/&quot;/g, '"').replace(/&amp;/g, '&');

    const priceMatch = html.match(/price["\s:]+([0-9.,]+)/i) || html.match(/\$\s*([0-9.,]+)/i);
    if (priceMatch) {
      const priceStr = priceMatch[1].replace(/,/g, "");
      const priceUSD = parseFloat(priceStr);
      extractData.price = Math.round(priceUSD * 600).toString();
    }

    const images = new Set<string>();
    const jsonDataPatterns = [
      /window\.__INITIAL_DATA__\s*=\s*({.*?});/s,
      /"imageModule"\s*:\s*({.*?})/s,
      /"imageList"\s*:\s*(\[.*?\])/s,
      /"productImage"\s*:\s*({.*?})/s,
    ];
    for (const pattern of jsonDataPatterns) {
      const match = html.match(pattern);
      if (match) {
        try {
          const jsonData = JSON.parse(match[1]);
          const extractImagesFromObj = (obj: any) => {
            if (!obj) return;
            if (typeof obj === "string" && obj.includes("alicdn.com") && /\.(jpg|jpeg|png)/.test(obj)) images.add(obj.split('?')[0]);
            else if (Array.isArray(obj)) obj.forEach(extractImagesFromObj);
            else if (typeof obj === "object") Object.values(obj).forEach(extractImagesFromObj);
          };
          extractImagesFromObj(jsonData);
        } catch {}
      }
    }
    if (images.size === 0) {
      const imageRegex = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi;
      let match: RegExpExecArray | null;
      while ((match = imageRegex.exec(html)) !== null) {
        const imgUrl = match[1];
        if (!imgUrl.includes("alicdn.com")) continue;
        if (!/\.(jpg|jpeg|png)($|\?)/i.test(imgUrl)) continue;
        if (/_\d+x\d+\./i.test(imgUrl)) continue;
        const excludePatterns = ["logo", "icon", "banner", "button", "payment", "O1CN01"];
        if (excludePatterns.some((p) => imgUrl.toLowerCase().includes(p))) continue;
        images.add(imgUrl.split('?')[0]);
      }
    }

    const jsonLdMatch = html.match(/<script[^>]*type="application\/ld\+json"[^>]*>([^<]+)<\/script>/i);
    if (jsonLdMatch) {
      try {
        const jsonData = JSON.parse(jsonLdMatch[1]);
        const img = jsonData.image;
        if (Array.isArray(img)) img.forEach((u: string) => images.add(String(u).split('?')[0]));
        else if (img) images.add(String(img).split('?')[0]);
      } catch {}
    }

    const imageArray = Array.from(images);
    if (imageArray.length > 0) {
      extractData.mainImage = imageArray[0];
      extractData.images = imageArray;
    }

    if (!extractData.title && !extractData.description) return res.status(400).json({ error: "Impossible d'extraire les données" });
    return res.status(200).json(extractData);
  } catch (e: any) {
    const msg = typeof e?.message === "string" ? e.message : "Erreur inconnue";
    return res.status(500).json({ error: msg });
  }
}