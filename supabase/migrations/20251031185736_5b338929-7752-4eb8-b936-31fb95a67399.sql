-- Create a security definer function to get email by nickname
-- This bypasses RLS and allows login lookup without authentication
CREATE OR REPLACE FUNCTION public.get_email_by_nickname(_nickname text)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT email
  FROM public.profiles
  WHERE nickname = _nickname
  LIMIT 1;
$$;