-- Update ticket status constraint to include solved
ALTER TABLE public.tickets DROP CONSTRAINT IF EXISTS tickets_status_check;
ALTER TABLE public.tickets ADD CONSTRAINT tickets_status_check 
  CHECK (status IN ('open', 'in_progress', 'waiting_for_response', 'solved', 'closed'));