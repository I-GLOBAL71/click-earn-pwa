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
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PATCH, OPTIONS");
    return res.status(204).end();
  }

  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", allowHeaders + ", Authorization, Content-Type");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PATCH, OPTIONS");

  try {
    const dbUrl = process.env.NEON_DATABASE_URL || "";
    if (!dbUrl) return res.status(500).json({ error: "NEON_DATABASE_URL requis" });
    const sql = neon(dbUrl);
    await sql`create table if not exists system_settings (key text primary key, value text, updated_at timestamp default now())`;

    if (req.method === "GET") {
      await ensureAdmin(req);
      const rows = await sql`select key, value from system_settings where key in ('gemini_enabled','gemini_model','gemini_temperature','gemini_api_key')`;
      const map = new Map(rows.map(r => [r.key, r.value || ""]));
      const maskedKey = String(map.get('gemini_api_key') || "");
      const mask = maskedKey ? `${maskedKey.slice(0, 4)}...${maskedKey.slice(-4)}` : "";
      return res.status(200).json({
        gemini_enabled: map.get('gemini_enabled') || "false",
        gemini_model: map.get('gemini_model') || "gemini-1.5-flash",
        gemini_temperature: map.get('gemini_temperature') || "0.2",
        gemini_api_key_masked: mask,
      });
    }

    if (req.method === "PATCH" || req.method === "POST") {
      await ensureAdmin(req);
      const body = typeof req.body === "string" ? JSON.parse(req.body) : (req.body || {});
      const updates: Record<string, string | undefined> = body || {};
      const allowed = new Set(['gemini_enabled','gemini_model','gemini_temperature','gemini_api_key']);
      const entries = Object.entries(updates).filter(([k,v]) => allowed.has(k) && v !== undefined);
      if (entries.length === 0) return res.status(400).json({ error: "Aucune mise à jour" });
      for (const [k, v] of entries) {
        await sql`insert into system_settings (key, value, updated_at) values (${k}, ${String(v)}, ${new Date().toISOString()}) on conflict (key) do update set value = excluded.value, updated_at = excluded.updated_at`;
      }
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: "Méthode non autorisée" });
  } catch (e: any) {
    const msg = typeof e?.message === "string" ? e.message : "Erreur inconnue";
    return res.status(400).json({ error: msg });
  }
}
