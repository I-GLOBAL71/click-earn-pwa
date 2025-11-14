-- Create table for global commission settings
CREATE TABLE IF NOT EXISTS public.commission_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  value numeric NOT NULL,
  description text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.commission_settings ENABLE ROW LEVEL SECURITY;

-- Only admins can manage commission settings
CREATE POLICY "Admins can manage commission settings"
ON public.commission_settings
FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Insert default settings
INSERT INTO public.commission_settings (key, value, description)
VALUES 
  ('click_commission', 0.1, 'Montant de commission par clic (en FCFA)'),
  ('min_payout_amount', 5000, 'Montant minimum de retrait (en FCFA)')
ON CONFLICT (key) DO NOTHING;

-- Add trigger for updated_at
CREATE TRIGGER update_commission_settings_updated_at
  BEFORE UPDATE ON public.commission_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();