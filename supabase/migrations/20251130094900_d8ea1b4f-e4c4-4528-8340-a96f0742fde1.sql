-- Create storage bucket for garden images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'garden-images',
  'garden-images',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
);

-- Allow anyone to view images
CREATE POLICY "Anyone can view garden images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'garden-images');

-- Only admins can upload images
CREATE POLICY "Admins can upload garden images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'garden-images' AND
  has_role(auth.uid(), 'admin'::app_role)
);

-- Only admins can update their images
CREATE POLICY "Admins can update garden images"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'garden-images' AND
  has_role(auth.uid(), 'admin'::app_role)
);

-- Only admins can delete their images
CREATE POLICY "Admins can delete garden images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'garden-images' AND
  has_role(auth.uid(), 'admin'::app_role)
);