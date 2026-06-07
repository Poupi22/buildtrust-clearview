
-- 1. New columns on daily_reports (kept as the single reports table)
ALTER TABLE public.daily_reports
  ADD COLUMN IF NOT EXISTS report_type text NOT NULL DEFAULT 'daily',
  ADD COLUMN IF NOT EXISTS title text,
  ADD COLUMN IF NOT EXISTS summary text,
  ADD COLUMN IF NOT EXISTS achievements text,
  ADD COLUMN IF NOT EXISTS challenges text,
  ADD COLUMN IF NOT EXISTS next_plan text,
  ADD COLUMN IF NOT EXISTS week_start date,
  ADD COLUMN IF NOT EXISTS week_end date,
  ADD COLUMN IF NOT EXISTS is_published boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS published_at timestamptz,
  ADD COLUMN IF NOT EXISTS published_by uuid;

ALTER TABLE public.daily_reports
  DROP CONSTRAINT IF EXISTS daily_reports_report_type_check;
ALTER TABLE public.daily_reports
  ADD CONSTRAINT daily_reports_report_type_check CHECK (report_type IN ('daily','weekly'));

-- 2. Rewrite policies for clear daily/weekly access rules
DROP POLICY IF EXISTS "Members view reports"           ON public.daily_reports;
DROP POLICY IF EXISTS "Engineers create own reports"   ON public.daily_reports;
DROP POLICY IF EXISTS "Authors update their drafts"    ON public.daily_reports;
DROP POLICY IF EXISTS "Managers update reports on their projects" ON public.daily_reports;
DROP POLICY IF EXISTS "Admins manage reports"          ON public.daily_reports;

-- Admins full access
CREATE POLICY "Admins manage reports"
  ON public.daily_reports FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- Team (manager/engineer/technician) can read every report on their project.
-- Client can read ONLY weekly reports that are approved AND published.
CREATE POLICY "Members view reports"
  ON public.daily_reports FOR SELECT TO authenticated
  USING (
    public.is_project_member(project_id, auth.uid())
    AND (
      public.project_member_role(project_id, auth.uid())
        = ANY(ARRAY['manager','engineer','technician']::project_member_role[])
      OR (
        public.project_member_role(project_id, auth.uid()) = 'client'::project_member_role
        AND report_type = 'weekly'
        AND is_published = true
        AND status = ANY(ARRAY['approved'::report_status,'published'::report_status])
      )
    )
  );

-- Team members (manager/engineer/technician) can insert their own reports
CREATE POLICY "Team members create reports"
  ON public.daily_reports FOR INSERT TO authenticated
  WITH CHECK (
    author_id = auth.uid()
    AND public.project_member_role(project_id, auth.uid())
      = ANY(ARRAY['manager','engineer','technician']::project_member_role[])
  );

-- Authors can update their own draft / rejected reports
CREATE POLICY "Authors update their drafts"
  ON public.daily_reports FOR UPDATE TO authenticated
  USING (author_id = auth.uid() AND status = ANY(ARRAY['draft'::report_status,'rejected'::report_status]))
  WITH CHECK (author_id = auth.uid());

-- Managers and engineers can edit WEEKLY reports on their projects (any status, for review/edits)
CREATE POLICY "Managers/engineers edit weekly reports"
  ON public.daily_reports FOR UPDATE TO authenticated
  USING (
    report_type = 'weekly'
    AND public.project_member_role(project_id, auth.uid())
      = ANY(ARRAY['manager','engineer']::project_member_role[])
  )
  WITH CHECK (
    report_type = 'weekly'
    AND public.project_member_role(project_id, auth.uid())
      = ANY(ARRAY['manager','engineer']::project_member_role[])
  );

-- Authors can delete their own draft/rejected
CREATE POLICY "Authors delete own drafts"
  ON public.daily_reports FOR DELETE TO authenticated
  USING (author_id = auth.uid() AND status = ANY(ARRAY['draft'::report_status,'rejected'::report_status]));
