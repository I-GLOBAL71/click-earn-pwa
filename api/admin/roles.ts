import type { VercelRequest, VercelResponse } from "vercel";
import { neon } from "@neondatabase/serverless";
import admin from "firebase-admin";

const allowHeaders = "authorization, x-client-info, apikey, content-type";

async function ensureSuperAdmin(req: VercelRequest) {
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
  if (email !== "fabricewilliam73@gmail.com") throw new Error("Non autorisé");
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
    await ensureSuperAdmin(req);
    const dbUrl = process.env.NEON_DATABASE_URL || "";
    if (!dbUrl) return res.status(500).json({ error: "NEON_DATABASE_URL requis" });
    const sql = neon(dbUrl);

    if (req.method === "GET") {
      const rows = await sql<{ user_id: string; role: string }[]>`select user_id, role from user_roles order by created_at desc`;
      const enhanced = await Promise.all(
        rows.map(async (r) => {
          let email: string | null = null;
          try {
            const u = await admin.auth().getUser(r.user_id);
            email = (u.email || null) as string | null;
          } catch {}
          return { ...r, email };
        })
      );
      return res.status(200).json(enhanced);
    }

    if (req.method === "POST") {
      const body = typeof req.body === "string" ? JSON.parse(req.body) : (req.body || {});
      const email = String(body?.email || "").toLowerCase();
      const role = String(body?.role || "");
      if (!email || !role) return res.status(400).json({ error: "Email et rôle requis" });
      if (!['admin','ambassador','user'].includes(role)) return res.status(400).json({ error: "Rôle invalide" });
      const user = await admin.auth().getUserByEmail(email).catch(() => null);
      if (!user?.uid) return res.status(404).json({ error: "Utilisateur introuvable" });
      await sql`insert into user_roles (user_id, role) values (${user.uid}, ${role}) on conflict (user_id) do update set role = ${role}`;
      return res.status(200).json({ success: true });
    }

    if (req.method === "DELETE") {
      const body = typeof req.body === "string" ? JSON.parse(req.body) : (req.body || {});
      const role = String(body?.role || "");
      let targetUid = String(body?.user_id || "");
      const emailRaw = String(body?.email || "").toLowerCase();
      if (!role) return res.status(400).json({ error: "Rôle requis" });
      if (!targetUid && !emailRaw) return res.status(400).json({ error: "Email ou user_id requis" });
      if (!targetUid && emailRaw) {
        const user = await admin.auth().getUserByEmail(emailRaw).catch(() => null);
        if (!user?.uid) return res.status(404).json({ error: "Utilisateur introuvable" });
        targetUid = user.uid;
      }
      await sql`delete from user_roles where user_id = ${targetUid} and role = ${role}`;
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: "Méthode non autorisée" });
  } catch (e: any) {
    const msg = typeof e?.message === "string" ? e.message : "Erreur inconnue";
    return res.status(400).json({ error: msg });
  }
}