-- Update storage bucket configuration to allow 200MB files
UPDATE storage.buckets 
SET 
  file_size_limit = 209715200,  -- 200MB in bytes
  allowed_mime_types = ARRAY['video/mp4', 'video/avi', 'video/mov', 'video/wmv', 'video/flv', 'video/webm', 'video/mkv', 'video/m4v', 'video/3gp']
WHERE id = 'videos';

-- If bucket doesn't exist, create it
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
SELECT 'videos', 'videos', true, 209715200, ARRAY['video/mp4', 'video/avi', 'video/mov', 'video/wmv', 'video/flv', 'video/webm', 'video/mkv', 'video/m4v', 'video/3gp']
WHERE NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'videos');