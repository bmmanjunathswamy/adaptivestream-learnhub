-- Update storage bucket to allow larger files
UPDATE storage.buckets 
SET file_size_limit = 209715200
WHERE id = 'videos';

-- Ensure the videos bucket exists and is properly configured
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('videos', 'videos', true, 209715200)
ON CONFLICT (id) 
DO UPDATE SET file_size_limit = 209715200;

-- Create storage policies for video uploads
DROP POLICY IF EXISTS "Allow authenticated users to upload large videos" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to view videos" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to delete their videos" ON storage.objects;

CREATE POLICY "Allow authenticated video uploads" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'videos' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Allow video viewing" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'videos');

CREATE POLICY "Allow video deletion" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'videos' 
  AND auth.role() = 'authenticated'
);