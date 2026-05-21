
CREATE POLICY "cards_admin_select"
  ON public.payment_cards FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "loyalty_admin_select"
  ON public.loyalty_cards FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "documents_admin_select"
  ON public.documents FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));
