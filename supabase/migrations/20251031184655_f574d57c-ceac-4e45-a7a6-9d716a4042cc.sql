-- Add policy for admins to view all messages
CREATE POLICY "Admins can view all messages"
  ON public.messages FOR SELECT
  USING (public.is_admin_user(auth.uid()));