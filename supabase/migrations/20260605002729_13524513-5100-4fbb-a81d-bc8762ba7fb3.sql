
DROP POLICY IF EXISTS "Managers review progress_reports" ON public.progress_reports;

CREATE POLICY "Managers/engineers review progress_reports"
ON public.progress_reports
FOR UPDATE TO authenticated
USING (
  public.project_member_role(project_id, auth.uid())
    = ANY (ARRAY['manager'::public.project_member_role, 'engineer'::public.project_member_role])
)
WITH CHECK (
  public.project_member_role(project_id, auth.uid())
    = ANY (ARRAY['manager'::public.project_member_role, 'engineer'::public.project_member_role])
);
