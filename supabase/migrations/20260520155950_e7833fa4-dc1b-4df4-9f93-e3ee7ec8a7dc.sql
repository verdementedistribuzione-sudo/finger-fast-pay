
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TABLE public.loyalty_cards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  card_type TEXT NOT NULL DEFAULT 'fidelity',
  brand TEXT NOT NULL,
  card_number TEXT NOT NULL,
  barcode_type TEXT NOT NULL DEFAULT 'CODE128',
  barcode_value TEXT NOT NULL,
  color TEXT,
  logo_url TEXT,
  expires_at DATE,
  notes TEXT,
  encrypted_extra TEXT,
  iv TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.loyalty_cards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "loyalty_all_own" ON public.loyalty_cards
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER loyalty_cards_updated
  BEFORE UPDATE ON public.loyalty_cards
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
