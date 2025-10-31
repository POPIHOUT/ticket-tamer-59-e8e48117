-- Add policy for admins to view all tickets
CREATE POLICY "Admins can view all tickets"
  ON public.tickets FOR SELECT
  USING (public.is_admin_user(auth.uid()));