DROP POLICY IF EXISTS "Members view sub_milestones" ON public.sub_milestones;

CREATE POLICY "Members view sub_milestones"
ON public.sub_milestones
FOR SELECT
USING (
  is_project_member(project_id, auth.uid())
  AND (
    project_member_role(project_id, auth.uid()) <> 'client'::project_member_role
    OR is_published = true
    OR EXISTS (
      SELECT 1 FROM public.milestones m
      WHERE m.id = sub_milestones.milestone_id
        AND m.is_published = true
        AND m.review_status = 'approved'
    )
  )
);