-- Add policies for support and admin to send messages to any ticket
CREATE POLICY "Support can send messages to any ticket"
  ON public.messages FOR INSERT
  WITH CHECK (public.is_support_user(auth.uid()));

CREATE POLICY "Admins can send messages to any ticket"
  ON public.messages FOR INSERT
  WITH CHECK (public.is_admin_user(auth.uid()));