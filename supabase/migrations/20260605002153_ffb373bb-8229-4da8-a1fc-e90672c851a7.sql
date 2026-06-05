
DROP POLICY IF EXISTS "Engineers/managers upload to their projects" ON storage.objects;
DROP POLICY IF EXISTS "Engineers/managers update their project media" ON storage.objects;
DROP POLICY IF EXISTS "Engineers/managers delete their project media" ON storage.objects;

CREATE POLICY "Project members upload to their projects"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'project-media'
  AND public.is_project_member(((storage.foldername(name))[1])::uuid, auth.uid())
);

CREATE POLICY "Project members update their project media"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'project-media'
  AND public.is_project_member(((storage.foldername(name))[1])::uuid, auth.uid())
);

CREATE POLICY "Engineers/managers delete project media"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'project-media'
  AND public.project_member_role(((storage.foldername(name))[1])::uuid, auth.uid())
      = ANY (ARRAY['manager'::public.project_member_role, 'engineer'::public.project_member_role])
);
