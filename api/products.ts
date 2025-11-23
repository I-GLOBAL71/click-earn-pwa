import type { VercelRequest, VercelResponse } from "@vercel/node";
import { neon } from "@neondatabase/serverless";

const allowHeaders = "authorization, x-client-info, apikey, content-type";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Headers", allowHeaders + ", Authorization, Content-Type");
    res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
    return res.status(204).end();
  }

  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", allowHeaders + ", Authorization, Content-Type");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");

  try {
    const dbUrl = process.env.NEON_DATABASE_URL || "";
    if (dbUrl) {
      const sql = neon(dbUrl);
      const id = String((req.query?.id as string) || "").trim();

      if (id) {
        await sql`create table if not exists product_images (id uuid primary key default gen_random_uuid(), product_id uuid references products(id) on delete cascade, url text not null, is_main boolean default false)`;
        const rows = await sql`select id, name, description, category, price, commission_type, commission_value, image_url, stock_quantity from products where id = ${id} and is_active = true limit 1`;
        if (rows.length === 0) return res.status(404).json({ error: "Produit introuvable" });
        const imgs = await sql`select url, is_main from product_images where product_id = ${id} order by is_main desc, id asc`;
        const images = imgs.map(i => i.url);
        const product = { ...rows[0], images };
        return res.status(200).json(product);
      }

      const rows = await sql`select id, name, description, category, price, commission_type, commission_value, image_url, stock_quantity from products where is_active = true order by created_at desc`;
      return res.status(200).json(rows);
    }

    return res.status(500).json({ error: "NEON_DATABASE_URL requis" });
  } catch (e: any) {
    const msg = typeof e?.message === "string" ? e.message : "Erreur inconnue";
    return res.status(400).json({ error: msg });
  }
}
