import type { VercelRequest, VercelResponse } from "vercel";
import { createClient } from "@supabase/supabase-js";
import { neon } from "@neondatabase/serverless";

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
    const supabaseUrl = process.env.SUPABASE_URL || "";
    const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || "";
    const dbUrl = process.env.NEON_DATABASE_URL || "";
    const appPublicUrl = process.env.APP_PUBLIC_URL || "https://app.lovable.app";

    if (!supabaseUrl || !supabaseAnonKey) {
      return res.status(500).json({ error: "SUPABASE_URL et SUPABASE_ANON_KEY requis" });
    }
    if (!dbUrl) {
      return res.status(500).json({ error: "NEON_DATABASE_URL requis" });
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: String(req.headers.authorization || "") } },
    });
    const { data: userData } = await supabase.auth.getUser();
    const user = userData?.user;
    if (!user) return res.status(401).json({ error: "Non autorisé" });

    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    const productId = body?.productId;
    if (!productId) return res.status(400).json({ error: "ID produit requis" });

    const sql = neon(dbUrl);

    const existingLink = await sql<{
      id: string;
      code: string;
      product_id: string;
    }[]>`select id, code, product_id from referral_links where user_id = ${user.id} and product_id = ${productId} limit 1`;

    if (existingLink.length > 0) {
      const code = existingLink[0].code;
      const referralUrl = `${appPublicUrl.replace(/\/$/, "")}/r/${code}?utm_source=ambassador&utm_medium=referral&utm_campaign=${productId}`;
      return res.status(200).json({ code, url: referralUrl, shortUrl: referralUrl });
    }

    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    const generateCode = () => Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
    let code = generateCode();
    for (let attempts = 0; attempts < 10; attempts++) {
      const exists = await sql`select id from referral_links where code = ${code} limit 1`;
      if (exists.length === 0) break;
      code = generateCode();
    }

    const inserted = await sql`insert into referral_links (user_id, product_id, code, clicks, conversions, total_commission) values (${user.id}, ${productId}, ${code}, 0, 0, 0) returning id`;
    if (inserted.length === 0) return res.status(500).json({ error: "Erreur création lien" });

    const referralUrl = `${appPublicUrl.replace(/\/$/, "")}/r/${code}?utm_source=ambassador&utm_medium=referral&utm_campaign=${productId}`;
    return res.status(200).json({ code, url: referralUrl, shortUrl: referralUrl });
  } catch (e: any) {
    const msg = typeof e?.message === "string" ? e.message : "Erreur inconnue";
    return res.status(400).json({ error: msg });
  }
}