import type { VercelRequest, VercelResponse } from "vercel";
import { neon } from "@neondatabase/serverless";
import admin from "firebase-admin";

const allowHeaders = "authorization, x-client-info, apikey, content-type";

async function ensureAuth(req: VercelRequest) {
  if (!admin.apps.length) {
    const sa = process.env.FIREBASE_SERVICE_ACCOUNT_JSON ? JSON.parse(String(process.env.FIREBASE_SERVICE_ACCOUNT_JSON)) : undefined;
    if (sa) admin.initializeApp({ credential: admin.credential.cert(sa as any) });
    else admin.initializeApp();
  }
  const authHeader = String(req.headers.authorization || "");
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
  if (!token) throw new Error("Non autorisé");
  const decoded = await admin.auth().verifyIdToken(token);
  return decoded.uid;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Headers", allowHeaders + ", Authorization, Content-Type");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    return res.status(204).end();
  }

  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", allowHeaders + ", Authorization, Content-Type");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");

  try {
    const dbUrl = process.env.NEON_DATABASE_URL || "";
    if (!dbUrl) return res.status(500).json({ error: "NEON_DATABASE_URL requis" });
    const sql = neon(dbUrl);

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
    await sql`create table if not exists category_commissions (
      category text primary key,
      commission_type text not null check (commission_type in ('percentage','fixed')),
      commission_value numeric(10,2) not null,
      updated_at timestamp with time zone default now()
    )`;

    const method = req.method || "GET";
    if (method === "GET") {
      const uid = await ensureAuth(req);
      const rows = await sql<any[]>`select id, product_id, quantity, unit_price, commission_type, commission_value, discount_amount, total_amount, status, invoice, created_at from orders where user_id = ${uid} order by created_at desc`;
      return res.status(200).json(rows);
    }

    if (method === "POST") {
      const uid = await ensureAuth(req);

      const body = typeof req.body === "string" ? JSON.parse(req.body) : (req.body || {});
      const productId = String(body?.product_id || "").trim();
      const quantity = Number(body?.quantity || 0);
      if (!productId || !quantity || quantity <= 0) return res.status(400).json({ error: "Produit et quantité requis" });

      const roleRows = await sql<{ role: string }[]>`select role from user_roles where user_id = ${uid} and role = 'ambassador' limit 1`;
      if (roleRows.length === 0) return res.status(403).json({ error: "Réservé aux ambassadeurs" });

      const prodRows = await sql<{
        id: string;
        name: string;
        price: number;
        commission_type: string;
        commission_value: number;
        stock_quantity: number | null;
      }[]>`select id, name, price, commission_type, commission_value, stock_quantity from products where id = ${productId} and is_active = true limit 1`;
      if (prodRows.length === 0) return res.status(404).json({ error: "Produit introuvable" });
      const product = prodRows[0];

      const stock = Number(product.stock_quantity || 0);
      if (stock > 0 && quantity > stock) return res.status(400).json({ error: "Stock insuffisant" });

      let cType = String(product.commission_type || "percentage");
      let cValue = Number(product.commission_value || 0);
      if (!cValue || cValue <= 0) {
        const catRows = await sql<{ category: string; commission_type: string; commission_value: number }[]>`select p.category, c.commission_type, c.commission_value from products p left join category_commissions c on p.category = c.category where p.id = ${productId} limit 1`;
        const cat = catRows[0];
        if (cat && Number(cat.commission_value) > 0) {
          cType = cat.commission_type;
          cValue = Number(cat.commission_value);
        }
      }

      const unitPrice = Number(product.price);
      let discountPerUnit = 0;
      if (cType === "percentage") discountPerUnit = Math.max(0, unitPrice * (cValue / 100));
      else discountPerUnit = Math.min(unitPrice, Math.max(0, cValue));
      const discountedUnit = Math.max(0.01, unitPrice - discountPerUnit);
      const discountAmount = Number((discountPerUnit * quantity).toFixed(2));
      const totalAmount = Number((discountedUnit * quantity).toFixed(2));

      if (stock > 0) {
        await sql`update products set stock_quantity = ${stock - quantity} where id = ${productId}`;
      }

      const invoice = {
        product: { id: product.id, name: product.name },
        quantity,
        unit_price: unitPrice,
        commission: { type: cType, value: cValue },
        discount_per_unit: Number(discountPerUnit.toFixed(2)),
        discount_total: discountAmount,
        total_due: totalAmount,
        currency: "FCFA",
      };

      const inserted = await sql<any[]>`insert into orders (user_id, product_id, quantity, unit_price, commission_type, commission_value, discount_amount, total_amount, status, invoice) values (${uid}, ${productId}, ${quantity}, ${unitPrice}, ${cType}, ${cValue}, ${discountAmount}, ${totalAmount}, ${"confirmed"}, ${JSON.stringify(invoice)}) returning id, created_at`;
      try {
        await sql`insert into commissions (user_id, order_id, type, amount, status) values (${uid}, ${inserted[0]?.id}, ${"personal_purchase"}, ${0}, ${"pending"})`;
      } catch (_) {}
      const out = { id: inserted[0]?.id, product_id: productId, quantity, unit_price: unitPrice, commission_type: cType, commission_value: cValue, discount_amount: discountAmount, total_amount: totalAmount, status: "confirmed", invoice, created_at: inserted[0]?.created_at };
      return res.status(200).json(out);
    }

    return res.status(405).json({ error: "Méthode non autorisée" });
  } catch (e: any) {
    const msg = typeof e?.message === "string" ? e.message : "Erreur inconnue";
    return res.status(400).json({ error: msg });
  }
}
