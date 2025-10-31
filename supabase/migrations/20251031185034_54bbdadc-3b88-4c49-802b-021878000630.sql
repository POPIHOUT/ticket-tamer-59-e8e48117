-- Allow users to view support profiles
CREATE POLICY "Users can view support profiles"
  ON public.profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = profiles.id AND is_support = true
    )
  );

-- Update ticket status constraint to include solved
ALTER TABLE public.tickets DROP CONSTRAINT IF EXISTS tickets_status_check;
ALTER TABLE public.tickets ADD CONSTRAINT tickets_status_check 
  CHECK (status IN ('open', 'in_progress', 'waiting_for_response', 'solved', 'closed'));