
DROP POLICY IF EXISTS "Managers manage project tasks" ON public.tasks;
CREATE POLICY "Managers/engineers manage project tasks" ON public.tasks
  FOR ALL TO authenticated
  USING (project_member_role(project_id, auth.uid()) = ANY(ARRAY['manager','engineer']::project_member_role[]))
  WITH CHECK (project_member_role(project_id, auth.uid()) = ANY(ARRAY['manager','engineer']::project_member_role[]));
