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
    res.setHeader("Access-Control-Allow-Headers", allowHeaders);
    return res.status(204).end();
  }

  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", allowHeaders);

  try {
    const dbUrl = process.env.NEON_DATABASE_URL || "";
    if (!dbUrl) return res.status(500).json({ error: "NEON_DATABASE_URL requis" });
    const sql = neon(dbUrl);

    if (req.method === "GET") {
      await ensureAdmin(req);
      const rows = await sql<any[]>`select key, value, updated_at from commission_settings where key in ('click_commission','min_payout_amount')`;
      return res.status(200).json(rows);
    }

    if (req.method === "PATCH" || req.method === "POST") {
      await ensureAdmin(req);
      const body = typeof req.body === "string" ? JSON.parse(req.body) : (req.body || {});
      const updates: { key: string; value: number }[] = Array.isArray(body?.updates) ? body.updates : [];
      if (updates.length === 0) return res.status(400).json({ error: "Aucune mise à jour" });
      for (const u of updates) {
        await sql`update commission_settings set value = ${Number(u.value)}, updated_at = ${new Date().toISOString()} where key = ${u.key}`;
      }
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: "Méthode non autorisée" });
  } catch (e: any) {
    const msg = typeof e?.message === "string" ? e.message : "Erreur inconnue";
    return res.status(400).json({ error: msg });
  }
}
