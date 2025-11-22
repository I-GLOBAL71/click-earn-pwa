import type { VercelRequest, VercelResponse } from "vercel";
import { neon } from "@neondatabase/serverless";
import admin from "firebase-admin";

const allowHeaders = "authorization, x-client-info, apikey, content-type";

async function ensureAdmin(req: VercelRequest) {
  if (!admin.apps.length) {
    const sa = process.env.FIREBASE_SERVICE_ACCOUNT_JSON ? JSON.parse(String(process.env.FIREBASE_SERVICE_ACCOUNT_JSON)) : undefined;
    if (sa) admin.initializeApp({ credential: admin.credential.cert(sa as any) });
    else admin.initializeApp();
  }
  const authHeader = String(req.headers.authorization || "");
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
  if (!token) throw new Error("Non autorisé");
  const decoded = await admin.auth().verifyIdToken(token);
  const email = String(decoded.email || "").toLowerCase();
  if (email === "fabricewilliam73@gmail.com") return decoded.uid;
  const dbUrl = process.env.NEON_DATABASE_URL || "";
  if (!dbUrl) throw new Error("NEON_DATABASE_URL requis");
  const sql = neon(dbUrl);
  const rows = await sql<{ role: string }[]>`select role from user_roles where user_id = ${decoded.uid} and role = 'admin' limit 1`;
  if (rows.length === 0) throw new Error("Non autorisé");
  return decoded.uid;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Headers", allowHeaders + ", Authorization, Content-Type");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    return res.status(204).end();
  }

  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", allowHeaders + ", Authorization, Content-Type");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");

  try {
    const dbUrl = process.env.NEON_DATABASE_URL || "";
    if (!dbUrl) return res.status(500).json({ error: "NEON_DATABASE_URL requis" });
    const sql = neon(dbUrl);

    const method = req.method || "GET";
    if (method === "GET") {
      await ensureAdmin(req);
      const rows = await sql<any[]>`select id, name, description, category, price, commission_type, commission_value, image_url, stock_quantity, is_active, created_at from products order by created_at desc`;
      return res.status(200).json(rows);
    }

    if (method === "POST") {
      await ensureAdmin(req);
      const body = typeof req.body === "string" ? JSON.parse(req.body) : (req.body || {});
      const {
        name,
        description,
        price,
        image_url,
        category,
        commission_type,
        commission_value,
        stock_quantity,
        is_active = true,
      } = body;
      if (!name || !category || !price || !commission_type || commission_value === undefined) {
        return res.status(400).json({ error: "Champs requis manquants" });
      }
      const inserted = await sql`insert into products (name, description, price, image_url, category, commission_type, commission_value, stock_quantity, is_active) values (${name}, ${description || null}, ${Number(price)}, ${image_url || null}, ${category}, ${commission_type}, ${Number(commission_value)}, ${stock_quantity ? Number(stock_quantity) : 0}, ${Boolean(is_active)}) returning id`;
      return res.status(200).json({ id: inserted[0]?.id });
    }

    if (method === "PUT") {
      await ensureAdmin(req);
      const body = typeof req.body === "string" ? JSON.parse(req.body) : (req.body || {});
      const { id, ...updates } = body || {};
      if (!id) return res.status(400).json({ error: "ID requis" });
      const fields: string[] = [];
      const values: any[] = [];
      const allowed = ["name","description","price","image_url","category","commission_type","commission_value","stock_quantity","is_active"] as const;
      allowed.forEach((key) => {
        if (updates[key] !== undefined) {
          fields.push(`${key} = $${fields.length + 1}`);
          values.push(key === "price" || key === "commission_value" || key === "stock_quantity" ? Number(updates[key]) : updates[key]);
        }
      });
      if (fields.length === 0) return res.status(400).json({ error: "Aucune mise à jour" });
      const query = `update products set ${fields.join(", ")} where id = $${fields.length + 1}`;
      const exec = neon(dbUrl);
      // @ts-ignore
      await exec(query, [...values, id]);
      return res.status(200).json({ success: true });
    }

    if (method === "DELETE") {
      await ensureAdmin(req);
      const body = typeof req.body === "string" ? JSON.parse(req.body) : (req.body || {});
      const { id } = body || {};
      if (!id) return res.status(400).json({ error: "ID requis" });
      await sql`delete from products where id = ${id}`;
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: "Méthode non autorisée" });
  } catch (e: any) {
    const msg = typeof e?.message === "string" ? e.message : "Erreur inconnue";
    return res.status(400).json({ error: msg });
  }
}