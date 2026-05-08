
-- ============ ENUMS ============
CREATE TYPE public.project_status AS ENUM ('active','on-hold','completed','delayed','planning');
CREATE TYPE public.milestone_status AS ENUM ('pending','in-progress','completed','delayed');
CREATE TYPE public.report_status AS ENUM ('draft','submitted','under-review','approved','rejected','published');
CREATE TYPE public.issue_severity AS ENUM ('low','medium','high','critical');
CREATE TYPE public.issue_status AS ENUM ('open','in-progress','resolved','closed');
CREATE TYPE public.project_member_role AS ENUM ('manager','engineer','client','viewer');
CREATE TYPE public.approval_decision AS ENUM ('approved','rejected','revision-requested');

-- ============ COMPANIES ============
CREATE TABLE public.companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  country TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

-- ============ PROJECTS ============
CREATE TABLE public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  code TEXT NOT NULL,
  client_name TEXT,
  type TEXT,
  location TEXT,
  start_date DATE,
  planned_end_date DATE,
  status public.project_status NOT NULL DEFAULT 'planning',
  completion INT NOT NULL DEFAULT 0 CHECK (completion BETWEEN 0 AND 100),
  current_phase TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_projects_company ON public.projects(company_id);
CREATE INDEX idx_projects_status ON public.projects(status);

-- ============ PROJECT MEMBERS ============
CREATE TABLE public.project_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role public.project_member_role NOT NULL DEFAULT 'engineer',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(project_id, user_id)
);
ALTER TABLE public.project_members ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_project_members_user ON public.project_members(user_id);

-- ============ MILESTONES ============
CREATE TABLE public.milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  ordering INT NOT NULL DEFAULT 0,
  planned_date DATE,
  actual_date DATE,
  status public.milestone_status NOT NULL DEFAULT 'pending',
  progress INT NOT NULL DEFAULT 0 CHECK (progress BETWEEN 0 AND 100),
  is_published BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.milestones ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_milestones_project ON public.milestones(project_id);

-- ============ DAILY REPORTS ============
CREATE TABLE public.daily_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  author_id UUID NOT NULL,
  report_date DATE NOT NULL,
  weather TEXT,
  workforce_count INT DEFAULT 0,
  tasks_completed TEXT[] DEFAULT ARRAY[]::TEXT[],
  next_activities TEXT[] DEFAULT ARRAY[]::TEXT[],
  notes TEXT,
  status public.report_status NOT NULL DEFAULT 'draft',
  submitted_at TIMESTAMPTZ,
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.daily_reports ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_daily_reports_project ON public.daily_reports(project_id);
CREATE INDEX idx_daily_reports_status ON public.daily_reports(status);

-- ============ ISSUES ============
CREATE TABLE public.report_issues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  report_id UUID REFERENCES public.daily_reports(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  impact TEXT,
  severity public.issue_severity NOT NULL DEFAULT 'medium',
  status public.issue_status NOT NULL DEFAULT 'open',
  date_identified DATE NOT NULL DEFAULT CURRENT_DATE,
  is_published BOOLEAN NOT NULL DEFAULT false,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.report_issues ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_issues_project ON public.report_issues(project_id);

-- ============ MEDIA ============
CREATE TABLE public.media_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  report_id UUID REFERENCES public.daily_reports(id) ON DELETE SET NULL,
  milestone_id UUID REFERENCES public.milestones(id) ON DELETE SET NULL,
  storage_path TEXT NOT NULL,
  mime_type TEXT,
  caption TEXT,
  exif JSONB,
  is_published BOOLEAN NOT NULL DEFAULT false,
  uploaded_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.media_files ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_media_project ON public.media_files(project_id);

-- ============ APPROVALS ============
CREATE TABLE public.approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL, -- 'daily_report' | 'milestone' | 'issue'
  entity_id UUID NOT NULL,
  decision public.approval_decision NOT NULL,
  comment TEXT,
  reviewer_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.approvals ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_approvals_entity ON public.approvals(entity_type, entity_id);

-- ============ AUDIT LOG ============
CREATE TABLE public.audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID,
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_audit_entity ON public.audit_log(entity_type, entity_id);

-- ============ HELPER: is_project_member ============
CREATE OR REPLACE FUNCTION public.is_project_member(_project_id UUID, _user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.project_members
    WHERE project_id = _project_id AND user_id = _user_id
  );
$$;

CREATE OR REPLACE FUNCTION public.project_member_role(_project_id UUID, _user_id UUID)
RETURNS public.project_member_role
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT role FROM public.project_members
  WHERE project_id = _project_id AND user_id = _user_id
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.is_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT public.has_role(_user_id, 'super-admin'::app_role)
      OR public.has_role(_user_id, 'company-admin'::app_role);
$$;

-- ============ RLS POLICIES ============

-- COMPANIES: admins manage; members see their company through projects
CREATE POLICY "Admins manage companies" ON public.companies
  FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- PROJECTS
CREATE POLICY "Admins manage all projects" ON public.projects
  FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Members view their projects" ON public.projects
  FOR SELECT TO authenticated
  USING (public.is_project_member(id, auth.uid()));

-- PROJECT MEMBERS
CREATE POLICY "Admins manage members" ON public.project_members
  FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Users view own membership" ON public.project_members
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- MILESTONES
CREATE POLICY "Admins manage milestones" ON public.milestones
  FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Managers/engineers manage milestones on their projects" ON public.milestones
  FOR ALL TO authenticated
  USING (public.project_member_role(project_id, auth.uid()) IN ('manager','engineer'))
  WITH CHECK (public.project_member_role(project_id, auth.uid()) IN ('manager','engineer'));

CREATE POLICY "Members view milestones" ON public.milestones
  FOR SELECT TO authenticated
  USING (
    public.is_project_member(project_id, auth.uid())
    AND (
      public.project_member_role(project_id, auth.uid()) <> 'client'
      OR is_published = true
    )
  );

-- DAILY REPORTS
CREATE POLICY "Admins manage reports" ON public.daily_reports
  FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Engineers create own reports" ON public.daily_reports
  FOR INSERT TO authenticated
  WITH CHECK (
    author_id = auth.uid()
    AND public.project_member_role(project_id, auth.uid()) IN ('manager','engineer')
  );

CREATE POLICY "Authors update their drafts" ON public.daily_reports
  FOR UPDATE TO authenticated
  USING (author_id = auth.uid() AND status IN ('draft','rejected'))
  WITH CHECK (author_id = auth.uid());

CREATE POLICY "Managers update reports on their projects" ON public.daily_reports
  FOR UPDATE TO authenticated
  USING (public.project_member_role(project_id, auth.uid()) = 'manager')
  WITH CHECK (public.project_member_role(project_id, auth.uid()) = 'manager');

CREATE POLICY "Members view reports" ON public.daily_reports
  FOR SELECT TO authenticated
  USING (
    public.is_project_member(project_id, auth.uid())
    AND (
      public.project_member_role(project_id, auth.uid()) <> 'client'
      OR status IN ('approved','published')
    )
  );

-- ISSUES
CREATE POLICY "Admins manage issues" ON public.report_issues
  FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Engineers/managers manage issues on their projects" ON public.report_issues
  FOR ALL TO authenticated
  USING (public.project_member_role(project_id, auth.uid()) IN ('manager','engineer'))
  WITH CHECK (public.project_member_role(project_id, auth.uid()) IN ('manager','engineer'));

CREATE POLICY "Members view issues" ON public.report_issues
  FOR SELECT TO authenticated
  USING (
    public.is_project_member(project_id, auth.uid())
    AND (
      public.project_member_role(project_id, auth.uid()) <> 'client'
      OR is_published = true
    )
  );

-- MEDIA
CREATE POLICY "Admins manage media" ON public.media_files
  FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Engineers/managers manage media on their projects" ON public.media_files
  FOR ALL TO authenticated
  USING (public.project_member_role(project_id, auth.uid()) IN ('manager','engineer'))
  WITH CHECK (public.project_member_role(project_id, auth.uid()) IN ('manager','engineer'));

CREATE POLICY "Members view media" ON public.media_files
  FOR SELECT TO authenticated
  USING (
    public.is_project_member(project_id, auth.uid())
    AND (
      public.project_member_role(project_id, auth.uid()) <> 'client'
      OR is_published = true
    )
  );

-- APPROVALS
CREATE POLICY "Admins manage approvals" ON public.approvals
  FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Managers create approvals on their projects" ON public.approvals
  FOR INSERT TO authenticated
  WITH CHECK (
    reviewer_id = auth.uid()
    AND public.project_member_role(project_id, auth.uid()) = 'manager'
  );

CREATE POLICY "Members view approvals on their projects" ON public.approvals
  FOR SELECT TO authenticated
  USING (public.is_project_member(project_id, auth.uid()));

-- AUDIT LOG (admins read; inserts via SECURITY DEFINER funcs only — no INSERT policy)
CREATE POLICY "Admins read audit log" ON public.audit_log
  FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()));

-- ============ TIMESTAMP TRIGGERS ============
CREATE TRIGGER trg_companies_updated BEFORE UPDATE ON public.companies
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_projects_updated BEFORE UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_milestones_updated BEFORE UPDATE ON public.milestones
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_reports_updated BEFORE UPDATE ON public.daily_reports
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_issues_updated BEFORE UPDATE ON public.report_issues
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
