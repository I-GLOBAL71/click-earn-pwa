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
    res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
    return res.status(204).end();
  }

  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", allowHeaders + ", Authorization, Content-Type");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");

  try {
    await ensureAdmin(req);
    const dbUrl = process.env.NEON_DATABASE_URL || "";
    if (!dbUrl) return res.status(500).json({ error: "NEON_DATABASE_URL requis" });
    const sql = neon(dbUrl);

    const [{ count: totalAmbassadors }] = await sql`select count(*)::int as count from user_roles where role = 'ambassador'`;
    const [{ count: totalProducts }] = await sql`select count(*)::int as count from products`;
    const [{ total_revenue }] = await sql`select coalesce(sum(amount), 0) as total_revenue from commissions where status = 'approved'`;
    const [{ pending_payouts }] = await sql`select coalesce(sum(amount), 0) as pending_payouts from payouts where status = 'pending'`;
    const [{ count: totalOrders }] = await sql`select count(*)::int as count from orders`;
    const [{ total_clicks }] = await sql`select coalesce(sum(clicks), 0) as total_clicks from referral_links`;

    return res.status(200).json({
      totalAmbassadors: totalAmbassadors || 0,
      totalProducts: totalProducts || 0,
      totalRevenue: Number(total_revenue || 0),
      pendingPayouts: Number(pending_payouts || 0),
      totalOrders: totalOrders || 0,
      totalClicks: Number(total_clicks || 0),
    });
  } catch (e: any) {
    const msg = typeof e?.message === "string" ? e.message : "Erreur inconnue";
    return res.status(400).json({ error: msg });
  }
}
