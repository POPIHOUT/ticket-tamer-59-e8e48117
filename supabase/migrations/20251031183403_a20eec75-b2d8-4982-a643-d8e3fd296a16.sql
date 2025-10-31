-- Update the handle_message_status function to check both is_support and is_admin
CREATE OR REPLACE FUNCTION public.handle_message_status()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  ticket_owner_id UUID;
  sender_is_support BOOLEAN;
  sender_is_admin BOOLEAN;
BEGIN
  -- Get ticket owner
  SELECT user_id INTO ticket_owner_id
  FROM public.tickets
  WHERE id = NEW.ticket_id;
  
  -- Check if sender is support or admin
  SELECT is_support, is_admin INTO sender_is_support, sender_is_admin
  FROM public.profiles
  WHERE id = NEW.user_id;
  
  -- If ticket is closed and message is from ticket owner, reopen it
  IF NEW.user_id = ticket_owner_id THEN
    UPDATE public.tickets
    SET status = 'open', updated_at = now()
    WHERE id = NEW.ticket_id
      AND status = 'closed';
  END IF;
  
  -- If message is from support or admin, set to waiting_for_response
  IF sender_is_support = true OR sender_is_admin = true THEN
    UPDATE public.tickets
    SET status = 'waiting_for_response', updated_at = now()
    WHERE id = NEW.ticket_id
      AND status != 'closed';
  -- If message is from user (not support/admin), set to open or in_progress
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