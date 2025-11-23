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
    res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
    return res.status(204).end();
  }

  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", allowHeaders + ", Authorization, Content-Type");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");

  try {
    const dbUrl = process.env.NEON_DATABASE_URL || "";
    if (!dbUrl) return res.status(500).json({ error: "NEON_DATABASE_URL requis" });
    const sql = neon(dbUrl);
    await ensureAdmin(req);

    await sql`create extension if not exists "pgcrypto"`;
    await sql`create extension if not exists "uuid-ossp"`;
    await sql`create table if not exists orders (
      id uuid primary key default gen_random_uuid(),
      user_id uuid not null,
      product_id uuid not null references products(id) on delete cascade,
      quantity integer not null check (quantity > 0),
      unit_price numeric(10,2) not null,
      commission_type text not null check (commission_type in ('percentage','fixed')),
      commission_value numeric(10,2) not null,
      discount_amount numeric(10,2) not null,
      total_amount numeric(10,2) not null,
      status text not null default 'confirmed' check (status in ('confirmed','cancelled','refunded')),
      invoice jsonb,
      created_at timestamp with time zone default now()
    )`;

    const rows = await sql<any[]>`select o.id, o.user_id, o.product_id, p.name as product_name, o.quantity, o.unit_price, o.discount_amount, o.total_amount, o.status, o.invoice, o.created_at from orders o left join products p on p.id = o.product_id order by o.created_at desc`;
    return res.status(200).json(rows);
  } catch (e: any) {
    const msg = typeof e?.message === "string" ? e.message : "Erreur inconnue";
    return res.status(400).json({ error: msg });
  }
}

