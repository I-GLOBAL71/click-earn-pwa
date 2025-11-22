import type { VercelRequest, VercelResponse } from "vercel";
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
    const dbUrl = process.env.NEON_DATABASE_URL || "";
    if (dbUrl) {
      const sql = neon(dbUrl);
      const rows = await sql<{
        id: string;
        name: string;
        description: string | null;
        category: string | null;
        price: number;
        commission_type: string;
        commission_value: number;
        image_url: string | null;
        stock_quantity: number | null;
      }[]>`select id, name, description, category, price, commission_type, commission_value, image_url, stock_quantity from products where is_active = true order by created_at desc`;
      return res.status(200).json(rows);
    }

    return res.status(200).json([]);
  } catch (e: any) {
    const msg = typeof e?.message === "string" ? e.message : "Erreur inconnue";
    return res.status(400).json({ error: msg });
  }
}