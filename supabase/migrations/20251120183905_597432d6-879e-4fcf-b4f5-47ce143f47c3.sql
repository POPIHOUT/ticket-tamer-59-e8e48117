-- Add ticket assignments table to track which support user is handling a ticket
CREATE TABLE IF NOT EXISTS public.ticket_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES public.tickets(id) ON DELETE CASCADE,
  support_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(ticket_id, support_user_id)
);

ALTER TABLE public.ticket_assignments ENABLE ROW LEVEL SECURITY;

-- Support and admins can view assignments
CREATE POLICY "Support can view assignments"
  ON public.ticket_assignments FOR SELECT
  USING (is_support_user(auth.uid()) OR is_admin_user(auth.uid()));

-- Support and admins can create assignments
CREATE POLICY "Support can create assignments"
  ON public.ticket_assignments FOR INSERT
  WITH CHECK (is_support_user(auth.uid()) OR is_admin_user(auth.uid()));

-- Support and admins can delete assignments
CREATE POLICY "Support can delete assignments"
  ON public.ticket_assignments FOR DELETE
  USING (is_support_user(auth.uid()) OR is_admin_user(auth.uid()));

-- Add ratings table
CREATE TABLE IF NOT EXISTS public.ticket_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES public.tickets(id) ON DELETE CASCADE UNIQUE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  feedback TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.ticket_ratings ENABLE ROW LEVEL SECURITY;

-- Users can create ratings for their own tickets
CREATE POLICY "Users can rate their tickets"
  ON public.ticket_ratings FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.tickets
      WHERE tickets.id = ticket_id
        AND tickets.user_id = auth.uid()
    )
  );

-- Admins and support can view all ratings
CREATE POLICY "Admins can view ratings"
  ON public.ticket_ratings FOR SELECT
  USING (is_admin_user(auth.uid()) OR is_support_user(auth.uid()));

-- Users can view their own ratings
CREATE POLICY "Users can view own ratings"
  ON public.ticket_ratings FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.tickets
      WHERE tickets.id = ticket_id
        AND tickets.user_id = auth.uid()
    )
  );

-- Add is_bot flag to messages to track bot vs human messages
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS is_bot BOOLEAN DEFAULT false;