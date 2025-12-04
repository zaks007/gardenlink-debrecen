-- Allow users to update their own role (for role selection during signup)
CREATE POLICY "Users can update own role during signup"
ON public.user_roles
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);