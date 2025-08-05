-- Update storage bucket configuration for larger video files
UPDATE storage.buckets 
SET file_size_limit = 209715200  -- 200MB in bytes
WHERE id = 'videos';

-- Create storage policies for large file uploads if they don't exist
CREATE POLICY IF NOT EXISTS "Allow authenticated users to upload large videos" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'videos' 
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = 'original'
);

CREATE POLICY IF NOT EXISTS "Allow authenticated users to view videos" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'videos' AND auth.role() = 'authenticated');

CREATE POLICY IF NOT EXISTS "Allow authenticated users to delete their videos" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'videos' 
  AND auth.role() = 'authenticated'
);