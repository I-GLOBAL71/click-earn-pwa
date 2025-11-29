CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC(10,2) NOT NULL,
  image_url TEXT,
  category TEXT NOT NULL,
  commission_type TEXT NOT NULL CHECK (commission_type IN ('percentage','fixed')),
  commission_value NUMERIC(10,2) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  stock_quantity INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.referral_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  code TEXT NOT NULL UNIQUE,
  clicks INTEGER DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  total_commission NUMERIC(10,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE (user_id, product_id)
);

CREATE TABLE IF NOT EXISTS public.click_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referral_link_id UUID NOT NULL REFERENCES public.referral_links(id) ON DELETE CASCADE,
  ip_address TEXT,
  user_agent TEXT,
  country TEXT,
  is_suspicious BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.commission_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  value NUMERIC NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

INSERT INTO public.commission_settings (key, value, description)
VALUES
  ('click_commission', 0.1, 'Montant de commission par clic (en FCFA)'),
  ('min_payout_amount', 5000, 'Montant minimum de retrait (en FCFA)')
ON CONFLICT (key) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.commissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  order_id UUID,
  referral_link_id UUID,
  amount NUMERIC(10,2) NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('click','sale','personal_purchase')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','paid','rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category);
CREATE INDEX IF NOT EXISTS idx_products_active ON public.products(is_active);
CREATE INDEX IF NOT EXISTS idx_referral_links_user_id ON public.referral_links(user_id);
CREATE INDEX IF NOT EXISTS idx_referral_links_code ON public.referral_links(code);
CREATE INDEX IF NOT EXISTS idx_click_tracking_referral_link_id ON public.click_tracking(referral_link_id);
CREATE INDEX IF NOT EXISTS idx_click_tracking_created_at ON public.click_tracking(created_at);
CREATE INDEX IF NOT EXISTS idx_commissions_user_id ON public.commissions(user_id);
CREATE INDEX IF NOT EXISTS idx_commissions_status ON public.commissions(status);

CREATE TABLE IF NOT EXISTS public.user_roles (
  user_id TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin','ambassador','user')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  PRIMARY KEY (user_id, role)
);

CREATE INDEX IF NOT EXISTS idx_user_roles_role ON public.user_roles(role);

CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  total_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  discount_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at);

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS update_products_updated_at ON public.products;
CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_commission_settings_updated_at ON public.commission_settings;
CREATE TRIGGER update_commission_settings_updated_at
  BEFORE UPDATE ON public.commission_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
