import type { VercelRequest, VercelResponse } from "@vercel/node";
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
  const rows = await sql`select role from user_roles where user_id = ${decoded.uid} and role = 'admin' limit 1`;
  if (rows.length === 0) throw new Error("Non autorisé");
  return decoded.uid;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Headers", allowHeaders + ", Authorization, Content-Type");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE, OPTIONS");
    return res.status(204).end();
  }

  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", allowHeaders + ", Authorization, Content-Type");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE, OPTIONS");

  try {
    const dbUrl = process.env.NEON_DATABASE_URL || "";
    if (!dbUrl) return res.status(500).json({ error: "NEON_DATABASE_URL requis" });
    const sql = neon(dbUrl);

    await ensureAdmin(req);

    await sql`create table if not exists category_commissions (
      category text primary key,
      commission_type text not null check (commission_type in ('percentage','fixed')),
      commission_value numeric(10,2) not null,
      updated_at timestamp with time zone default now()
    )`;

    const method = req.method || "GET";
    if (method === "GET") {
      const rows = await sql`select category, commission_type, commission_value, updated_at from category_commissions order by category`;
      return res.status(200).json(rows);
    }

    if (method === "POST" || method === "PATCH") {
      const body = typeof req.body === "string" ? JSON.parse(req.body) : (req.body || {});
      const category = String(body?.category || "").trim();
      const commission_type = String(body?.commission_type || "").trim();
      const commission_value = Number(body?.commission_value || 0);
      if (!category || !commission_type || !(commission_type === 'percentage' || commission_type === 'fixed') || commission_value <= 0) {
        return res.status(400).json({ error: "Champs invalides" });
      }
      await sql`insert into category_commissions (category, commission_type, commission_value, updated_at) values (${category}, ${commission_type}, ${commission_value}, ${new Date().toISOString()}) on conflict (category) do update set commission_type = excluded.commission_type, commission_value = excluded.commission_value, updated_at = excluded.updated_at`;
      return res.status(200).json({ success: true });
    }

    if (method === "DELETE") {
      const body = typeof req.body === "string" ? JSON.parse(req.body) : (req.body || {});
      const category = String(body?.category || "").trim();
      if (!category) return res.status(400).json({ error: "Catégorie requise" });
      await sql`delete from category_commissions where category = ${category}`;
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: "Méthode non autorisée" });
  } catch (e: any) {
    const msg = typeof e?.message === "string" ? e.message : "Erreur inconnue";
    return res.status(400).json({ error: msg });
  }
}
