CREATE TABLE public.webauthn_credentials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  credential_id text NOT NULL UNIQUE,
  public_key text NOT NULL,
  counter bigint NOT NULL DEFAULT 0,
  transports text[],
  attestation_fmt text,
  aaguid text,
  device_type text,
  backed_up boolean,
  created_at timestamptz NOT NULL DEFAULT now(),
  last_used_at timestamptz
);
GRANT SELECT ON public.webauthn_credentials TO authenticated;
GRANT ALL ON public.webauthn_credentials TO service_role;
ALTER TABLE public.webauthn_credentials ENABLE ROW LEVEL SECURITY;
CREATE POLICY wc_select_own ON public.webauthn_credentials FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY wc_select_admin ON public.webauthn_credentials FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.webauthn_challenges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  challenge text NOT NULL,
  kind text NOT NULL,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '5 minutes'),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.webauthn_challenges TO service_role;
ALTER TABLE public.webauthn_challenges ENABLE ROW LEVEL SECURITY;