-- Create avatars bucket (public)
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload their own avatar
CREATE POLICY "Users can upload own avatar"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'avatars' AND name = (auth.uid()::text || '.' || (storage.extension(name))));

-- Allow authenticated users to update their own avatar
CREATE POLICY "Users can update own avatar"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'avatars' AND name LIKE (auth.uid()::text || '.%'));

-- Allow public read
CREATE POLICY "Public avatar read"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'avatars');
