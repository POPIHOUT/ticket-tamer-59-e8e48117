-- Create messages table for ticket conversations
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES public.tickets(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Users can view messages for their own tickets
CREATE POLICY "Users can view messages for their tickets"
  ON public.messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.tickets
      WHERE tickets.id = messages.ticket_id
      AND tickets.user_id = auth.uid()
    )
  );

-- Support can view all messages
CREATE POLICY "Support can view all messages"
  ON public.messages FOR SELECT
  USING (public.is_support_user(auth.uid()));

-- Users can send messages to their own tickets
CREATE POLICY "Users can send messages to their tickets"
  ON public.messages FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.tickets
      WHERE tickets.id = messages.ticket_id
      AND tickets.user_id = auth.uid()
    )
    AND auth.uid() = user_id
  );

-- Support can send messages to any ticket
CREATE POLICY "Support can send messages to any ticket"
  ON public.messages FOR INSERT
  WITH CHECK (public.is_support_user(auth.uid()) AND auth.uid() = user_id);

-- Enable realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;