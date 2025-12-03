-- Fix user_roles table RLS policy to prevent public exposure
DROP POLICY IF EXISTS "Users can view all roles" ON public.user_roles;

-- Create new policy that only allows users to view their own roles
CREATE POLICY "Users can view own roles" 
ON public.user_roles 
FOR SELECT 
USING (auth.uid() = user_id);