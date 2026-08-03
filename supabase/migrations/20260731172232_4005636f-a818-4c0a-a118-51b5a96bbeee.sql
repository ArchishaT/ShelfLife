CREATE POLICY "own medicine photos read" ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'medicine-photos' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "own medicine photos insert" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'medicine-photos' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "own medicine photos update" ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'medicine-photos' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "own medicine photos delete" ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'medicine-photos' AND (storage.foldername(name))[1] = auth.uid()::text);