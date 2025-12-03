-- Allow anyone to view profiles of garden owners (users who have gardens)
CREATE POLICY "Anyone can view garden owner profiles"
ON public.profiles
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.gardens
    WHERE gardens.owner_id = profiles.id
  )
);