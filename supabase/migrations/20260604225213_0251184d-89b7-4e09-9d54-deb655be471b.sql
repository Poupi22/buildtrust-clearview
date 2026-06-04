
DROP POLICY IF EXISTS "Engineers/managers create progress_reports" ON public.progress_reports;

CREATE POLICY "Field team creates progress_reports"
  ON public.progress_reports FOR INSERT
  TO authenticated
  WITH CHECK (
    author_id = auth.uid()
    AND public.project_member_role(project_id, auth.uid()) = ANY (
      ARRAY['manager'::project_member_role, 'engineer'::project_member_role, 'technician'::project_member_role]
    )
  );
