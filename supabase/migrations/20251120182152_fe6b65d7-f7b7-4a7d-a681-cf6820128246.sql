-- Add urgent priority to tickets
-- Update the priority check constraint if it exists
DO $$ 
BEGIN
  -- No need to alter anything since priority is just text
  -- We'll handle validation in the application layer
END $$;