-- Drop existing problematic policies for messages
DROP POLICY IF EXISTS "Users can send messages to their tickets" ON public.messages;
DROP POLICY IF EXISTS "Support can send messages to any ticket" ON public.messages;

-- Simplify message insertion policies
CREATE POLICY "Users can send messages"
  ON public.messages FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Add column for initial message in tickets
ALTER TABLE public.tickets ADD COLUMN IF NOT EXISTS initial_message TEXT;

-- Add status update controls
CREATE POLICY "Admins can update all tickets"
  ON public.tickets FOR UPDATE
  USING (public.is_admin_user(auth.uid()));

-- Create function to auto-reopen ticket on new message
CREATE OR REPLACE FUNCTION public.reopen_ticket_on_message()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- If ticket is closed and message is from ticket owner, reopen it
  UPDATE public.tickets
  SET status = 'open', updated_at = now()
  WHERE id = NEW.ticket_id
    AND status = 'closed'
    AND user_id = NEW.user_id;
  
  RETURN NEW;
END;
$$;

-- Create trigger for auto-reopening
DROP TRIGGER IF EXISTS reopen_ticket_trigger ON public.messages;
CREATE TRIGGER reopen_ticket_trigger
  AFTER INSERT ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION public.reopen_ticket_on_message();