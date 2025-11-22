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
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS");
    return res.status(204).end();
  }

  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", allowHeaders + ", Authorization, Content-Type");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS");

  try {
    const dbUrl = process.env.NEON_DATABASE_URL || "";
    if (!dbUrl) return res.status(500).json({ error: "NEON_DATABASE_URL requis" });
    const sql = neon(dbUrl);

    if (req.method === "GET") {
      await ensureAdmin(req);
      const rows = await sql<{ user_id: string; role: string }[]>`select user_id, role from user_roles order by user_id`;
      const out: { user_id: string; role: string; email?: string | null }[] = [];
      for (const r of rows) {
        let email: string | null = null;
        try {
          const u = await admin.auth().getUser(r.user_id);
          email = String(u.email || "");
        } catch (_) {}
        out.push({ user_id: r.user_id, role: r.role, email });
      }
      return res.status(200).json(out);
    }

    if (req.method === "POST") {
      await ensureAdmin(req);
      const body = typeof req.body === "string" ? JSON.parse(req.body) : (req.body || {});
      const email = String(body?.email || "").trim().toLowerCase();
      const role = String(body?.role || "").trim().toLowerCase();
      if (!email || !role) return res.status(400).json({ error: "Email et rôle requis" });

      const adminAuth = admin.auth();
      const userRecord = await adminAuth.getUserByEmail(email).catch(() => null);
      if (!userRecord) return res.status(400).json({ error: "Utilisateur inconnu" });
      const uid = userRecord.uid;
      const allowed = new Set(["admin","ambassador","user"]);
      if (!allowed.has(role)) return res.status(400).json({ error: "Rôle invalide" });

      await sql`insert into user_roles (user_id, role) values (${uid}, ${role}) on conflict (user_id, role) do nothing`;
      return res.status(200).json({ success: true });
    }

    if (req.method === "DELETE") {
      await ensureAdmin(req);
      const body = typeof req.body === "string" ? JSON.parse(req.body) : (req.body || {});
      const email = String(body?.email || "").trim().toLowerCase();
      const role = String(body?.role || "").trim().toLowerCase();
      if (!role || (!email && !body?.user_id)) return res.status(400).json({ error: "Rôle et utilisateur requis" });
      let uid = String(body?.user_id || "");
      if (!uid && email) {
        const userRecord = await admin.auth().getUserByEmail(email).catch(() => null);
        if (!userRecord) return res.status(400).json({ error: "Utilisateur inconnu" });
        uid = userRecord.uid;
      }
      await sql`delete from user_roles where user_id = ${uid} and role = ${role}`;
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: "Méthode non autorisée" });
  } catch (e: any) {
    const msg = typeof e?.message === "string" ? e.message : "Erreur inconnue";
    return res.status(400).json({ error: msg });
  }
}