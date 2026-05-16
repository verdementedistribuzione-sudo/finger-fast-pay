
CREATE TABLE public.biometric_audit (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  transaction_id UUID NULL,
  step TEXT NOT NULL,           -- 'finger_1' | 'finger_2' | 'pin' | 'app_fallback' | 'enrollment_1' | 'enrollment_2'
  method TEXT NOT NULL,         -- 'biometric' | 'pin' | 'app'
  outcome TEXT NOT NULL,        -- 'success' | 'failure' | 'cancelled'
  reason TEXT NULL,             -- short non-sensitive reason (e.g. 'wrong_pin', 'not_supported')
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_biometric_audit_user ON public.biometric_audit(user_id, created_at DESC);
CREATE INDEX idx_biometric_audit_tx ON public.biometric_audit(transaction_id);

ALTER TABLE public.biometric_audit ENABLE ROW LEVEL SECURITY;

CREATE POLICY "audit_select_own" ON public.biometric_audit
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "audit_select_admin" ON public.biometric_audit
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "audit_insert_own" ON public.biometric_audit
  FOR INSERT WITH CHECK (auth.uid() = user_id);
