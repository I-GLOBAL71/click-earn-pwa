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
    await ensureAdmin(req);
    const dbUrl = process.env.NEON_DATABASE_URL || "";
    if (!dbUrl) return res.status(500).json({ error: "NEON_DATABASE_URL requis" });
    const sql = neon(dbUrl);

    const ambassadorRoleRows = await sql<{ user_id: string }[]>`select user_id from user_roles where role = 'ambassador'`;
    const userIds = ambassadorRoleRows.map(r => r.user_id);
    if (userIds.length === 0) return res.status(200).json([]);

    const profiles = await sql<{ id: string; full_name: string | null; phone: string | null; created_at: string | null }[]>`select id, full_name, phone, created_at from profiles where id in (${userIds})`;

    const commissions = await sql<{ user_id: string; amount: number }[]>`select user_id, amount from commissions where user_id in (${userIds})`;
    const links = await sql<{ user_id: string; clicks: number | null }[]>`select user_id, clicks from referral_links where user_id in (${userIds})`;

    const authUsers = await admin.auth().getUsers(userIds.map(uid => ({ uid })));
    const emailMap = new Map<string, string>();
    authUsers.users.forEach(u => emailMap.set(u.uid, String(u.email || "")));

    const result = profiles.map(p => {
      const userCommissions = commissions.filter(c => c.user_id === p.id);
      const totalCommissions = userCommissions.reduce((sum, c) => sum + Number(c.amount), 0);
      const userLinks = links.filter(l => l.user_id === p.id);
      const totalClicks = userLinks.reduce((sum, l) => sum + Number(l.clicks || 0), 0);
      return {
        id: p.id,
        full_name: p.full_name,
        email: emailMap.get(p.id) || "",
        phone: p.phone,
        created_at: p.created_at || new Date().toISOString(),
        total_commissions: totalCommissions,
        total_clicks: totalClicks,
      };
    });

    return res.status(200).json(result);
  } catch (e: any) {
    const msg = typeof e?.message === "string" ? e.message : "Erreur inconnue";
    return res.status(400).json({ error: msg });
  }
}