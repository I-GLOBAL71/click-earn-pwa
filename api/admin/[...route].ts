import type { VercelRequest, VercelResponse } from "@vercel/node";
import { neon } from "@neondatabase/serverless";
import admin from "firebase-admin";

const allowHeaders = "authorization, x-client-info, apikey, content-type";

async function ensureAdmin(req: VercelRequest) {
  if (!admin.apps.length) {
    const sa = process.env.FIREBASE_SERVICE_ACCOUNT_JSON ? JSON.parse(String(process.env.FIREBASE_SERVICE_ACCOUNT_JSON)) : undefined;
    if (sa) admin.initializeApp({ credential: admin.credential.cert(sa as admin.ServiceAccount) });
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

function subPath(req: VercelRequest) {
  const url = String(req.url || "");
  const m = url.match(/\/api\/admin\/(.*?)(\?|$)/);
  return (m && m[1] ? m[1] : "").toLowerCase();
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Headers", allowHeaders + ", Authorization, Content-Type");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
    return res.status(204).end();
  }

  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", allowHeaders + ", Authorization, Content-Type");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");

  try {
    const path = subPath(req);
    const method = req.method || "GET";
    const dbUrl = process.env.NEON_DATABASE_URL || "";
    if (!dbUrl) return res.status(500).json({ error: "NEON_DATABASE_URL requis" });
    const sql = neon(dbUrl);

    if (path === "is-admin") {
      if (!admin.apps.length) {
        const sa = process.env.FIREBASE_SERVICE_ACCOUNT_JSON ? JSON.parse(String(process.env.FIREBASE_SERVICE_ACCOUNT_JSON)) : undefined;
        if (sa) admin.initializeApp({ credential: admin.credential.cert(sa as admin.ServiceAccount) });
        else admin.initializeApp();
      }
      const authHeader = String(req.headers.authorization || "");
      const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
      if (!token) return res.status(200).json({ isAdmin: false });
      try {
        const decoded = await admin.auth().verifyIdToken(token);
        const email = String(decoded.email || "").toLowerCase();
        if (email === "fabricewilliam73@gmail.com") return res.status(200).json({ isAdmin: true, role: "super_admin" });
        const rows = await sql<{ role: string }[]>`select role from user_roles where user_id = ${decoded.uid} and role = 'admin' limit 1`;
        const isAdmin = rows.length > 0;
        return res.status(200).json({ isAdmin, role: isAdmin ? "admin" : "user" });
      } catch {
        return res.status(200).json({ isAdmin: false });
      }
    }

    if (path === "roles") {
      await ensureAdmin(req);
      if (method === "GET") {
        const rows = await sql<{ user_id: string; role: string }[]>`select user_id, role from user_roles order by user_id`;
        const out: { user_id: string; role: string; email?: string | null }[] = [];
        for (const r of rows) {
          let email: string | null = null;
          try {
            const u = await admin.auth().getUser(r.user_id);
            email = String(u.email || "");
          } catch { void 0; }
          out.push({ user_id: r.user_id, role: r.role, email });
        }
        return res.status(200).json(out);
      }
      if (method === "POST") {
        const body = typeof req.body === "string" ? JSON.parse(req.body) as Record<string, unknown> : (req.body as Record<string, unknown> || {});
        const email = String(body?.email || "").trim().toLowerCase();
        const role = String(body?.role || "").trim().toLowerCase();
        if (!email || !role) return res.status(400).json({ error: "Email et rôle requis" });
        const userRecord = await admin.auth().getUserByEmail(email).catch(() => null);
        if (!userRecord) return res.status(400).json({ error: "Utilisateur inconnu" });
        const uid = userRecord.uid;
        const allowedRoles = new Set(["admin","ambassador","user"]);
        if (!allowedRoles.has(role)) return res.status(400).json({ error: "Rôle invalide" });
        await sql`insert into user_roles (user_id, role) values (${uid}, ${role}) on conflict (user_id, role) do nothing`;
        return res.status(200).json({ success: true });
      }
      if (method === "DELETE") {
        const body = typeof req.body === "string" ? JSON.parse(req.body) as Record<string, unknown> : (req.body as Record<string, unknown> || {});
        const email = String(body?.email || "").trim().toLowerCase();
        const role = String(body?.role || "").trim().toLowerCase();
        if (!role || (!email && !body?.user_id)) return res.status(400).json({ error: "Rôle et utilisateur requis" });
        let uid = String((body?.user_id as string) || "");
        if (!uid && email) {
          const userRecord = await admin.auth().getUserByEmail(email).catch(() => null);
          if (!userRecord) return res.status(400).json({ error: "Utilisateur inconnu" });
          uid = userRecord.uid;
        }
        await sql`delete from user_roles where user_id = ${uid} and role = ${role}`;
        return res.status(200).json({ success: true });
      }
      return res.status(405).json({ error: "Méthode non autorisée" });
    }

    if (path === "category-commissions") {
      await ensureAdmin(req);
      await sql`create table if not exists category_commissions (
        category text primary key,
        commission_type text not null check (commission_type in ('percentage','fixed')),
        commission_value numeric(10,2) not null,
        updated_at timestamp with time zone default now()
      )`;
      if (method === "GET") {
        const rows = await sql<{ category: string; commission_type: string; commission_value: number; updated_at: string }[]>`select category, commission_type, commission_value, updated_at from category_commissions order by category`;
        return res.status(200).json(rows);
      }
      if (method === "POST" || method === "PATCH") {
        const body = typeof req.body === "string" ? JSON.parse(req.body) as Record<string, unknown> : (req.body as Record<string, unknown> || {});
        const category = String(body?.category || "").trim();
        const commission_type = String(body?.commission_type || "").trim();
        const commission_value = Number(body?.commission_value || 0);
        if (!category || !commission_type || !(commission_type === "percentage" || commission_type === "fixed") || commission_value <= 0) {
          return res.status(400).json({ error: "Champs invalides" });
        }
        await sql`insert into category_commissions (category, commission_type, commission_value, updated_at) values (${category}, ${commission_type}, ${commission_value}, ${new Date().toISOString()}) on conflict (category) do update set commission_type = excluded.commission_type, commission_value = excluded.commission_value, updated_at = excluded.updated_at`;
        return res.status(200).json({ success: true });
      }
      if (method === "DELETE") {
        const body = typeof req.body === "string" ? JSON.parse(req.body) as Record<string, unknown> : (req.body as Record<string, unknown> || {});
        const category = String(body?.category || "").trim();
        if (!category) return res.status(400).json({ error: "Catégorie requise" });
        await sql`delete from category_commissions where category = ${category}`;
        return res.status(200).json({ success: true });
      }
      return res.status(405).json({ error: "Méthode non autorisée" });
    }

    if (path === "system-settings") {
      await ensureAdmin(req);
      await sql`create table if not exists system_settings (key text primary key, value text, updated_at timestamp default now())`;
      if (method === "GET") {
        const rows = await sql<{ key: string; value: string | null }[]>`select key, value from system_settings where key in ('ai_provider','gemini_enabled','gemini_model','gemini_temperature','gemini_api_key','deepseek_api_key','default_title_prompt','default_description_prompt')`;
        const map = new Map(rows.map(r => [r.key, String(r.value || "")]));
        const maskedKey = String(map.get('gemini_api_key') || "");
        const mask = maskedKey ? `${maskedKey.slice(0, 4)}...${maskedKey.slice(-4)}` : "";
        const deepMaskedKey = String(map.get('deepseek_api_key') || "");
        const deepMask = deepMaskedKey ? `${deepMaskedKey.slice(0, 4)}...${deepMaskedKey.slice(-4)}` : "";
        return res.status(200).json({
          ai_provider: map.get('ai_provider') || "gemini",
          gemini_enabled: map.get('gemini_enabled') || "false",
          gemini_model: map.get('gemini_model') || "gemini-1.5-flash",
          gemini_temperature: map.get('gemini_temperature') || "0.2",
          gemini_api_key_masked: mask,
          deepseek_api_key_masked: deepMask,
          default_title_prompt: map.get('default_title_prompt') || "",
          default_description_prompt: map.get('default_description_prompt') || "",
        });
      }
      if (method === "POST" || method === "PATCH") {
        const body = typeof req.body === "string" ? JSON.parse(req.body) as Record<string, unknown> : (req.body as Record<string, unknown> || {});
        const allowed = new Set(['ai_provider','gemini_enabled','gemini_model','gemini_temperature','gemini_api_key','deepseek_api_key','default_title_prompt','default_description_prompt']);
        const entries = Object.entries(body).filter(([k,v]) => allowed.has(k) && v !== undefined);
        if (entries.length === 0) return res.status(400).json({ error: "Aucune mise à jour" });
        for (const [k, v] of entries) {
          await sql`insert into system_settings (key, value, updated_at) values (${k}, ${String(v)}, ${new Date().toISOString()}) on conflict (key) do update set value = excluded.value, updated_at = excluded.updated_at`;
        }
        return res.status(200).json({ success: true });
      }
      return res.status(405).json({ error: "Méthode non autorisée" });
    }

    if (path === "products") {
      await ensureAdmin(req);
      if (method === "GET") {
        const rows = await sql<{ id: string; name: string; description: string | null; category: string; price: number; commission_type: string; commission_value: number; image_url: string | null; stock_quantity: number; is_active: boolean; created_at: string }[]>`select id, name, description, category, price, commission_type, commission_value, image_url, stock_quantity, is_active, created_at from products order by created_at desc`;
        return res.status(200).json(rows);
      }
      if (method === "POST") {
        const body = typeof req.body === "string" ? JSON.parse(req.body) as Record<string, unknown> : (req.body as Record<string, unknown> || {});
        const name = String(body?.name || "");
        const description = String((body?.description as string) || "");
        const price = Number(body?.price || 0);
        const image_url = String((body?.image_url as string) || "");
        const category = String(body?.category || "");
        const commission_type = String(body?.commission_type || "");
        const commission_value = Number(body?.commission_value || 0);
        const stock_quantity = Number(body?.stock_quantity || 0);
        const is_active = Boolean(body?.is_active ?? true);
        const images = Array.isArray((body as Record<string, unknown>)?.images) ? ((body as Record<string, unknown>).images as string[]) : [];
        if (!name || !category || !price || !commission_type || commission_value === undefined) {
          return res.status(400).json({ error: "Champs requis manquants" });
        }
        const inserted = await sql<{ id: string }[]>`insert into products (name, description, price, image_url, category, commission_type, commission_value, stock_quantity, is_active) values (${name}, ${description || null}, ${price}, ${image_url || null}, ${category}, ${commission_type}, ${commission_value}, ${stock_quantity}, ${is_active}) returning id`;
        const newId = inserted[0]?.id;
        if (newId && Array.isArray(images) && images.length) {
          await sql`create table if not exists product_images (id uuid primary key default gen_random_uuid(), product_id uuid references products(id) on delete cascade, url text not null, is_main boolean default false)`;
          const main = String(image_url || "").trim();
          for (let i = 0; i < images.length && i < 12; i++) {
            const url = String(images[i] || "").trim();
            if (url) await sql`insert into product_images (product_id, url, is_main) values (${newId}, ${url}, ${main && url === main})`;
          }
        }
        return res.status(200).json({ id: newId });
      }
      if (method === "PUT") {
        const body = typeof req.body === "string" ? JSON.parse(req.body) as Record<string, unknown> : (req.body as Record<string, unknown> || {});
        const id = String(body?.id || "");
        if (!id) return res.status(400).json({ error: "ID requis" });
        let changes = 0;
        if (body.name !== undefined) { await sql`update products set name = ${String(body.name)} where id = ${id}`; changes++; }
        if (body.description !== undefined) { await sql`update products set description = ${String(body.description)} where id = ${id}`; changes++; }
        if (body.price !== undefined) { await sql`update products set price = ${Number(body.price)} where id = ${id}`; changes++; }
        if (body.image_url !== undefined) { await sql`update products set image_url = ${String(body.image_url)} where id = ${id}`; changes++; }
        if (body.category !== undefined) { await sql`update products set category = ${String(body.category)} where id = ${id}`; changes++; }
        if (body.commission_type !== undefined) { await sql`update products set commission_type = ${String(body.commission_type)} where id = ${id}`; changes++; }
        if (body.commission_value !== undefined) { await sql`update products set commission_value = ${Number(body.commission_value)} where id = ${id}`; changes++; }
        if (body.stock_quantity !== undefined) { await sql`update products set stock_quantity = ${Number(body.stock_quantity)} where id = ${id}`; changes++; }
        if (body.is_active !== undefined) { await sql`update products set is_active = ${Boolean(body.is_active)} where id = ${id}`; changes++; }
        if (changes === 0) return res.status(400).json({ error: "Aucune mise à jour" });
        return res.status(200).json({ success: true });
      }
      if (method === "DELETE") {
        const body = typeof req.body === "string" ? JSON.parse(req.body) as Record<string, unknown> : (req.body as Record<string, unknown> || {});
        const id = String(body?.id || "");
        if (!id) return res.status(400).json({ error: "ID requis" });
        await sql`delete from products where id = ${id}`;
        return res.status(200).json({ success: true });
      }
      return res.status(405).json({ error: "Méthode non autorisée" });
    }

    if (path === "orders") {
      await ensureAdmin(req);
      if (method === "GET") {
        const rows = await sql<{ id: string; product_id: string; product_name: string | null; quantity: number; total_amount: number; discount_amount: number; status: string; created_at: string }[]>`select o.id, o.product_id, p.name as product_name, o.quantity, o.total_amount, o.discount_amount, o.status, o.created_at from orders o left join products p on p.id = o.product_id order by o.created_at desc limit 500`;
        return res.status(200).json(rows);
      }
      return res.status(405).json({ error: "Méthode non autorisée" });
    }

    if (path === "stats") {
      await ensureAdmin(req);
      const totalAmbassadorsRows = await sql<{ c: number }[]>`select count(*)::int as c from user_roles where role = 'ambassador'`;
      const totalProductsRows = await sql<{ c: number }[]>`select count(*)::int as c from products where is_active = true`;
      const totalRevenueRows = await sql<{ s: number }[]>`select coalesce(sum(total_amount),0) as s from orders`;
      const pendingPayoutsRows = await sql<{ s: number }[]>`select coalesce(sum(amount),0) as s from commissions where status = 'pending'`;
      const totalOrdersRows = await sql<{ c: number }[]>`select count(*)::int as c from orders`;
      const totalClicksRows = await sql<{ s: number }[]>`select coalesce(sum(clicks),0) as s from referral_links`;
      const totalAmbassadors = Number(totalAmbassadorsRows?.[0]?.c || 0);
      const totalProducts = Number(totalProductsRows?.[0]?.c || 0);
      const totalRevenue = Number(totalRevenueRows?.[0]?.s || 0);
      const pendingPayouts = Number(pendingPayoutsRows?.[0]?.s || 0);
      const totalOrders = Number(totalOrdersRows?.[0]?.c || 0);
      const totalClicks = Number(totalClicksRows?.[0]?.s || 0);
      return res.status(200).json({ totalAmbassadors, totalProducts, totalRevenue, pendingPayouts, totalOrders, totalClicks });
    }

    return res.status(404).json({ error: "Route inconnue" });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Erreur inconnue";
    return res.status(400).json({ error: msg });
  }
}
