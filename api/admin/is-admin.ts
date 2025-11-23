import type { VercelRequest, VercelResponse } from "@vercel/node";
import { neon } from "@neondatabase/serverless";
import admin from "firebase-admin";

const allowHeaders = "authorization, x-client-info, apikey, content-type";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Headers", allowHeaders);
    return res.status(204).end();
  }

  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", allowHeaders);

  try {
    if (!admin.apps.length) {
      const sa = process.env.FIREBASE_SERVICE_ACCOUNT_JSON ? JSON.parse(String(process.env.FIREBASE_SERVICE_ACCOUNT_JSON)) : undefined;
      if (sa) admin.initializeApp({ credential: admin.credential.cert(sa as any) });
      else admin.initializeApp();
    }
    const authHeader = String(req.headers.authorization || "");
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
    if (!token) return res.status(200).json({ isAdmin: false });
    const decoded = await admin.auth().verifyIdToken(token);
    const email = String(decoded.email || "").toLowerCase();
    if (email === "fabricewilliam73@gmail.com") return res.status(200).json({ isAdmin: true, role: "super_admin" });
    const dbUrl = process.env.NEON_DATABASE_URL || "";
    if (!dbUrl) return res.status(200).json({ isAdmin: false });
    const sql = neon(dbUrl);
    const rows = await sql`select role from user_roles where user_id = ${decoded.uid} and role = 'admin' limit 1`;
    const isAdmin = rows.length > 0;
    return res.status(200).json({ isAdmin, role: isAdmin ? "admin" : "user" });
  } catch (_) {
    return res.status(200).json({ isAdmin: false });
  }
}
