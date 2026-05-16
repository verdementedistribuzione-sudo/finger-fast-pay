
-- Roles
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL DEFAULT 'user',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE POLICY "roles_select_self_or_admin" ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "roles_admin_all" ON public.user_roles FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- App settings (single row)
CREATE TABLE public.app_settings (
  id int PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  sca_threshold numeric NOT NULL DEFAULT 50,
  require_pin_above_threshold boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now()
);
INSERT INTO public.app_settings (id) VALUES (1);
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "settings_read_all_auth" ON public.app_settings FOR SELECT
  USING (auth.uid() IS NOT NULL);
CREATE POLICY "settings_admin_update" ON public.app_settings FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

-- PIN hash on profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS pin_hash text;

-- Admin can see profiles
CREATE POLICY "profiles_select_admin" ON public.profiles FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- User devices
CREATE TABLE public.user_devices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  label text NOT NULL,
  credential_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  last_used_at timestamptz
);
ALTER TABLE public.user_devices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "devices_own" ON public.user_devices FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "devices_admin_select" ON public.user_devices FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- Admin can see all transactions
CREATE POLICY "tx_admin_select" ON public.transactions FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- Payment requests (merchant -> user)
CREATE TABLE public.payment_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_name text NOT NULL,
  merchant_ref text,
  user_email text NOT NULL,
  user_id uuid,
  amount numeric NOT NULL CHECK (amount > 0),
  currency text NOT NULL DEFAULT 'EUR',
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','authorized','declined','expired')),
  token text,
  created_at timestamptz NOT NULL DEFAULT now(),
  authorized_at timestamptz,
  expires_at timestamptz NOT NULL DEFAULT now() + interval '10 minutes'
);
ALTER TABLE public.payment_requests ENABLE ROW LEVEL SECURITY;

-- Anyone (also anon merchant) can create a request
CREATE POLICY "pr_insert_any" ON public.payment_requests FOR INSERT
  WITH CHECK (true);
-- Merchant can poll its own request by id (no auth) — allow public read of id-targeted rows
CREATE POLICY "pr_read_public" ON public.payment_requests FOR SELECT
  USING (true);
-- Only the matched user (by email or id) can update to authorize/decline
CREATE POLICY "pr_update_owner" ON public.payment_requests FOR UPDATE
  USING (
    auth.uid() = user_id
    OR (user_id IS NULL AND auth.jwt()->>'email' = user_email)
  );

CREATE INDEX idx_pr_email_status ON public.payment_requests(user_email, status);
CREATE INDEX idx_pr_user_status ON public.payment_requests(user_id, status);
