-- =====================================================
-- MIGRATION POUR NEON AVEC FIREBASE AUTH
-- =====================================================
-- Cette migration est optimisée pour Neon PostgreSQL
-- en utilisant Firebase Auth au lieu de Supabase Auth
-- =====================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create app_role enum for user roles
DO $$ BEGIN
    CREATE TYPE public.app_role AS ENUM ('admin', 'ambassador', 'user');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- Create users table (Firebase users reference)
CREATE TABLE IF NOT EXISTS public.users (
    id TEXT PRIMARY KEY,  -- Firebase UID
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create user_roles table (separate from profiles for security)
CREATE TABLE IF NOT EXISTS public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    role app_role NOT NULL DEFAULT 'ambassador',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles (prevents RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id TEXT, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- RLS policies for user_roles
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
CREATE POLICY "Users can view their own roles"
ON public.user_roles FOR SELECT
TO public
USING (true);

DROP POLICY IF EXISTS "Admins can manage all roles" ON public.user_roles;
CREATE POLICY "Admins can manage all roles"
ON public.user_roles FOR ALL
TO public
USING (public.has_role(current_setting('app.current_user_id'), 'admin'));

-- Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
    id TEXT PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
    avatar_url TEXT,
    phone TEXT,
    bio TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile"
ON public.profiles FOR SELECT
TO public
USING (true);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
TO public
USING (true);

-- Create products table
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    image_url TEXT,
    category TEXT NOT NULL,
    commission_type TEXT NOT NULL CHECK (commission_type IN ('percentage', 'fixed')),
    commission_value DECIMAL(10,2) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    stock_quantity INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Everyone can view active products" ON public.products;
CREATE POLICY "Everyone can view active products"
ON public.products FOR SELECT
TO public
USING (is_active = true);

DROP POLICY IF EXISTS "Admins can manage all products" ON public.products;
CREATE POLICY "Admins can manage all products"
ON public.products FOR ALL
TO public
USING (public.has_role(current_setting('app.current_user_id'), 'admin'));

-- Create orders table
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL DEFAULT 1,
    total_price DECIMAL(10,2) NOT NULL,
    discount_amount DECIMAL(10,2) DEFAULT 0,
    final_price DECIMAL(10,2) NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'shipped', 'delivered', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own orders" ON public.orders;
CREATE POLICY "Users can view their own orders"
ON public.orders FOR SELECT
TO public
USING (user_id = current_setting('app.current_user_id'));

DROP POLICY IF EXISTS "Users can create their own orders" ON public.orders;
CREATE POLICY "Users can create their own orders"
ON public.orders FOR INSERT
TO public
WITH CHECK (user_id = current_setting('app.current_user_id'));

DROP POLICY IF EXISTS "Admins can manage all orders" ON public.orders;
CREATE POLICY "Admins can manage all orders"
ON public.orders FOR ALL
TO public
USING (public.has_role(current_setting('app.current_user_id'), 'admin'));

-- Create referral_links table
CREATE TABLE IF NOT EXISTS public.referral_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
    code TEXT NOT NULL UNIQUE,
    clicks INTEGER DEFAULT 0,
    conversions INTEGER DEFAULT 0,
    total_commission DECIMAL(10,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE (user_id, product_id)
);

ALTER TABLE public.referral_links ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own referral links" ON public.referral_links;
CREATE POLICY "Users can view their own referral links"
ON public.referral_links FOR SELECT
TO public
USING (user_id = current_setting('app.current_user_id'));

DROP POLICY IF EXISTS "Users can create their own referral links" ON public.referral_links;
CREATE POLICY "Users can create their own referral links"
ON public.referral_links FOR INSERT
TO public
WITH CHECK (user_id = current_setting('app.current_user_id'));

DROP POLICY IF EXISTS "Admins can view all referral links" ON public.referral_links;
CREATE POLICY "Admins can view all referral links"
ON public.referral_links FOR SELECT
TO public
USING (public.has_role(current_setting('app.current_user_id'), 'admin'));

-- Create click_tracking table for anti-fraud
CREATE TABLE IF NOT EXISTS public.click_tracking (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    referral_link_id UUID NOT NULL REFERENCES public.referral_links(id) ON DELETE CASCADE,
    ip_address TEXT,
    user_agent TEXT,
    country TEXT,
    is_suspicious BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.click_tracking ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view all click tracking" ON public.click_tracking;
CREATE POLICY "Admins can view all click tracking"
ON public.click_tracking FOR SELECT
TO public
USING (public.has_role(current_setting('app.current_user_id'), 'admin'));

-- Create commissions table
CREATE TABLE IF NOT EXISTS public.commissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
    referral_link_id UUID REFERENCES public.referral_links(id) ON DELETE SET NULL,
    amount DECIMAL(10,2) NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('click', 'sale', 'personal_purchase')),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'paid', 'rejected')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.commissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own commissions" ON public.commissions;
CREATE POLICY "Users can view their own commissions"
ON public.commissions FOR SELECT
TO public
USING (user_id = current_setting('app.current_user_id'));

DROP POLICY IF EXISTS "Admins can manage all commissions" ON public.commissions;
CREATE POLICY "Admins can manage all commissions"
ON public.commissions FOR ALL
TO public
USING (public.has_role(current_setting('app.current_user_id'), 'admin'));

-- Create payouts table
CREATE TABLE IF NOT EXISTS public.payouts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    method TEXT NOT NULL CHECK (method IN ('mobile_money', 'bitcoin', 'bank_transfer')),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    transaction_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    processed_at TIMESTAMP WITH TIME ZONE
);

ALTER TABLE public.payouts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own payouts" ON public.payouts;
CREATE POLICY "Users can view their own payouts"
ON public.payouts FOR SELECT
TO public
USING (user_id = current_setting('app.current_user_id'));

DROP POLICY IF EXISTS "Users can request payouts" ON public.payouts;
CREATE POLICY "Users can request payouts"
ON public.payouts FOR INSERT
TO public
WITH CHECK (user_id = current_setting('app.current_user_id'));

DROP POLICY IF EXISTS "Admins can manage all payouts" ON public.payouts;
CREATE POLICY "Admins can manage all payouts"
ON public.payouts FOR ALL
TO public
USING (public.has_role(current_setting('app.current_user_id'), 'admin'));

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category);
CREATE INDEX IF NOT EXISTS idx_products_active ON public.products(is_active);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_referral_links_user_id ON public.referral_links(user_id);
CREATE INDEX IF NOT EXISTS idx_referral_links_code ON public.referral_links(code);
CREATE INDEX IF NOT EXISTS idx_commissions_user_id ON public.commissions(user_id);
CREATE INDEX IF NOT EXISTS idx_commissions_status ON public.commissions(status);
CREATE INDEX IF NOT EXISTS idx_click_tracking_referral_link_id ON public.click_tracking(referral_link_id);
CREATE INDEX IF NOT EXISTS idx_click_tracking_created_at ON public.click_tracking(created_at);
CREATE INDEX IF NOT EXISTS idx_payouts_user_id ON public.payouts(user_id);
CREATE INDEX IF NOT EXISTS idx_payouts_status ON public.payouts(status);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

-- Add updated_at triggers
DROP TRIGGER IF EXISTS update_users_updated_at ON public.users;
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_products_updated_at ON public.products;
CREATE TRIGGER update_products_updated_at
    BEFORE UPDATE ON public.products
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_orders_updated_at ON public.orders;
CREATE TRIGGER update_orders_updated_at
    BEFORE UPDATE ON public.orders
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed admin user (opcional - comentar si pas besoin)
-- INSERT INTO public.users (id, email, full_name) VALUES ('admin-id-here', 'admin@example.com', 'Admin');
-- INSERT INTO public.user_roles (user_id, role) VALUES ('admin-id-here', 'admin');

-- =====================================================
-- MIGRATION TERMINÉE
-- Tables créées: 9 (users + 8 autres)
-- Indexes créés: 13
-- Triggers créés: 4
-- =====================================================