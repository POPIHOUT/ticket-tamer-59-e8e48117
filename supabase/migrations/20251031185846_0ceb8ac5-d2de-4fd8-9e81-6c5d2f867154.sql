-- Drop the problematic policy that causes infinite recursion
DROP POLICY IF EXISTS "Users can view support profiles" ON public.profiles;

-- Create a corrected policy: Support profiles are visible to authenticated users
-- This is safe because we're only checking a boolean flag, not referencing the same table
CREATE POLICY "Support profiles are visible to authenticated users"
ON public.profiles
FOR SELECT
TO authenticated
USING (is_support = true OR is_admin = true);