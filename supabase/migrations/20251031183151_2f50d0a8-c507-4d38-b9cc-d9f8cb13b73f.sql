-- Update ticket status constraint to include waiting_for_response
ALTER TABLE public.tickets DROP CONSTRAINT IF EXISTS tickets_status_check;
ALTER TABLE public.tickets ADD CONSTRAINT tickets_status_check 
  CHECK (status IN ('open', 'in_progress', 'waiting_for_response', 'closed'));

-- Update the reopen function to set waiting_for_response when support responds
CREATE OR REPLACE FUNCTION public.handle_message_status()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  ticket_owner_id UUID;
  sender_is_support BOOLEAN;
BEGIN
  -- Get ticket owner
  SELECT user_id INTO ticket_owner_id
  FROM public.tickets
  WHERE id = NEW.ticket_id;
  
  -- Check if sender is support
  SELECT is_support INTO sender_is_support
  FROM public.profiles
  WHERE id = NEW.user_id;
  
  -- If ticket is closed and message is from ticket owner, reopen it
  IF NEW.user_id = ticket_owner_id THEN
    UPDATE public.tickets
    SET status = 'open', updated_at = now()
    WHERE id = NEW.ticket_id
      AND status = 'closed';
  END IF;
  
  -- If message is from support, set to waiting_for_response
  IF sender_is_support = true THEN
    UPDATE public.tickets
    SET status = 'waiting_for_response', updated_at = now()
    WHERE id = NEW.ticket_id
      AND status != 'closed';
  -- If message is from user (not support), set to open or in_progress
  ELSIF NEW.user_id = ticket_owner_id THEN
    UPDATE public.tickets
    SET status = CASE 
      WHEN status = 'waiting_for_response' THEN 'open'
      ELSE status
    END,
    updated_at = now()
    WHERE id = NEW.ticket_id
      AND status != 'closed';
  END IF;
  
  RETURN NEW;
END;
$$;

-- Update the trigger
DROP TRIGGER IF EXISTS reopen_ticket_trigger ON public.messages;
CREATE TRIGGER handle_message_status_trigger
  AFTER INSERT ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_message_status();