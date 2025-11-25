-- =====================================================
-- SUPABASE STORAGE SETUP FOR OFFER IMAGES
-- =====================================================
-- Run this in Supabase SQL Editor to create storage bucket
-- and set up proper access policies
-- =====================================================

-- Create the offer-images bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'offer-images',
  'offer-images',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];

-- =====================================================
-- STORAGE POLICIES
-- =====================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can view offer images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload offer images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own offer images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own offer images" ON storage.objects;

-- Policy 1: Anyone can view offer images (public read)
CREATE POLICY "Anyone can view offer images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'offer-images');

-- Policy 2: Authenticated users can upload offer images
CREATE POLICY "Authenticated users can upload offer images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'offer-images' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy 3: Users can update their own offer images
CREATE POLICY "Users can update their own offer images"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'offer-images' AND
  auth.uid()::text = (storage.foldername(name))[1]
)
WITH CHECK (
  bucket_id = 'offer-images' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy 4: Users can delete their own offer images
CREATE POLICY "Users can delete their own offer images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'offer-images' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- =====================================================
-- VERIFICATION
-- =====================================================

-- Check bucket was created
SELECT * FROM storage.buckets WHERE id = 'offer-images';

-- Check policies were created
SELECT * FROM pg_policies WHERE tablename = 'objects' AND policyname LIKE '%offer images%';
