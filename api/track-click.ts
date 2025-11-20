import type { VercelRequest, VercelResponse } from "vercel";
import { neon } from "@neondatabase/serverless";

const allowHeaders = "authorization, x-client-info, apikey, content-type, x-forwarded-for, x-real-ip";

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

    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    const code = body?.code;
    if (!code) return res.status(400).json({ error: "Code de recommandation requis" });

    const linkRows = await sql<{
      id: string;
      user_id: string;
      product_id: string;
      clicks: number;
    }[]>`select id, user_id, product_id, clicks from referral_links where code = ${code} limit 1`;
    if (linkRows.length === 0) return res.status(400).json({ error: "Lien de recommandation invalide" });
    const referralLink = linkRows[0];

    const userAgent = String(req.headers["user-agent"] || "");
    const forwarded = String(req.headers["x-forwarded-for"] || "");
    const ip = forwarded ? forwarded.split(",")[0] : String(req.headers["x-real-ip"] || "unknown");

    let isSuspicious = false;
    const suspiciousReasons: string[] = [];

    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    const recent = await sql`select id from click_tracking where referral_link_id = ${referralLink.id} and ip_address = ${ip} and created_at >= ${fiveMinutesAgo}`;
    if (recent.length > 0) {
      isSuspicious = true;
      suspiciousReasons.push("Clics répétés depuis la même IP");
    }

    const botPatterns = /bot|crawler|spider|scraper|curl|wget|python|java|okhttp/i;
    if (botPatterns.test(userAgent.toLowerCase())) {
      isSuspicious = true;
      suspiciousReasons.push("User-agent suspect (bot)");
    }
    if (!userAgent || userAgent.length < 20) {
      isSuspicious = true;
      suspiciousReasons.push("User-agent invalide");
    }

    await sql`insert into click_tracking (referral_link_id, ip_address, user_agent, is_suspicious, country) values (${referralLink.id}, ${ip}, ${userAgent}, ${isSuspicious}, ${null})`;

    if (!isSuspicious) {
      await sql`update referral_links set clicks = ${Number(referralLink.clicks || 0) + 1} where id = ${referralLink.id}`;
      const setting = await sql<{ value: number }[]>`select value from commission_settings where key = 'click_commission' limit 1`;
      if (setting.length > 0 && Number(setting[0].value) > 0) {
        await sql`insert into commissions (user_id, referral_link_id, type, amount, status) values (${referralLink.user_id}, ${referralLink.id}, ${"click"}, ${Number(setting[0].value)}, ${"pending"})`;
      }
    }

    return res.status(200).json({ success: true, suspicious: isSuspicious, reasons: suspiciousReasons, product_id: referralLink.product_id });
  } catch (e: any) {
    const msg = typeof e?.message === "string" ? e.message : "Erreur inconnue";
    return res.status(400).json({ error: msg });
  }
}