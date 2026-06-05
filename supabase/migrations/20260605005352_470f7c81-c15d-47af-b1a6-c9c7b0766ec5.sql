DROP POLICY IF EXISTS "Engineers/managers manage media on their projects" ON public.media_files;

CREATE POLICY "Engineers/managers/technicians manage media on their projects"
ON public.media_files
FOR ALL
TO authenticated
USING (
  project_member_role(project_id, auth.uid()) = ANY (
    ARRAY['manager'::project_member_role, 'engineer'::project_member_role, 'technician'::project_member_role]
  )
)
WITH CHECK (
  project_member_role(project_id, auth.uid()) = ANY (
    ARRAY['manager'::project_member_role, 'engineer'::project_member_role, 'technician'::project_member_role]
  )
);