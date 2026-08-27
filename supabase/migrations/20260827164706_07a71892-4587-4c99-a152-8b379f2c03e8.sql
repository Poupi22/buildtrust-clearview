
-- ============ ENUMS ============
DO $$ BEGIN CREATE TYPE public.plan_version_status AS ENUM ('draft','submitted','active','archived'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.weekly_plan_status AS ENUM ('draft','submitted','active','closed','void'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.obligation_kind AS ENUM ('daily','weekly'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.obligation_status AS ENUM ('pending','submitted','approved','absent'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.report_state AS ENUM ('pending','draft','submitted','under_review','approved','rejected','absent','archived'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.weekly_cycle_status AS ENUM ('open','compliant','non_compliant','void'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.activity_status AS ENUM ('not_started','in_progress','completed','delayed','suspended'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============ PROJECTS ============
ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS timezone text NOT NULL DEFAULT 'Africa/Douala',
  ADD COLUMN IF NOT EXISTS active_plan_version_id uuid,
  ADD COLUMN IF NOT EXISTS execution_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS entreprise text,
  ADD COLUMN IF NOT EXISTS mission_controle text;

ALTER TABLE public.milestones
  ADD COLUMN IF NOT EXISTS planned_start date,
  ADD COLUMN IF NOT EXISTS planned_end date,
  ADD COLUMN IF NOT EXISTS actual_start date,
  ADD COLUMN IF NOT EXISTS actual_end date;

ALTER TABLE public.sub_milestones
  ADD COLUMN IF NOT EXISTS planned_start date,
  ADD COLUMN IF NOT EXISTS planned_end date,
  ADD COLUMN IF NOT EXISTS actual_start date,
  ADD COLUMN IF NOT EXISTS actual_end date;

ALTER TABLE public.audit_log
  ADD COLUMN IF NOT EXISTS actor_role text,
  ADD COLUMN IF NOT EXISTS project_id uuid,
  ADD COLUMN IF NOT EXISTS old_value jsonb,
  ADD COLUMN IF NOT EXISTS new_value jsonb,
  ADD COLUMN IF NOT EXISTS reason text;

-- ============ HELPERS ============
CREATE OR REPLACE FUNCTION public.is_super_admin(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.has_role(_user_id, 'super-admin'::app_role);
$$;

CREATE TABLE IF NOT EXISTS public.client_assistant_access (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  assistant_id uuid NOT NULL,
  invited_by uuid NOT NULL,
  professional_role text,
  phone text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (project_id, assistant_id)
);
GRANT SELECT, INSERT, UPDATE ON public.client_assistant_access TO authenticated;
GRANT ALL ON public.client_assistant_access TO service_role;
ALTER TABLE public.client_assistant_access ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_project_assistant(_project_id uuid, _user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.client_assistant_access
    WHERE project_id = _project_id AND assistant_id = _user_id AND is_active);
$$;

CREATE OR REPLACE FUNCTION public.can_view_project(_project_id uuid, _user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.is_admin(_user_id)
      OR public.is_project_member(_project_id, _user_id)
      OR public.is_project_assistant(_project_id, _user_id);
$$;

CREATE OR REPLACE FUNCTION public.can_manage_project(_project_id uuid, _user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.is_admin(_user_id)
      OR public.project_member_role(_project_id, _user_id) IN ('manager','engineer');
$$;

CREATE OR REPLACE FUNCTION public.can_report_on_project(_project_id uuid, _user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.is_admin(_user_id)
      OR public.project_member_role(_project_id, _user_id) IN ('manager','engineer','technician','project-lead');
$$;

CREATE OR REPLACE FUNCTION public.is_project_client_side(_project_id uuid, _user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.project_member_role(_project_id, _user_id) = 'client'
      OR public.is_project_assistant(_project_id, _user_id);
$$;

CREATE POLICY "assistant access viewable by project people" ON public.client_assistant_access
  FOR SELECT TO authenticated USING (public.can_view_project(project_id, auth.uid()) OR assistant_id = auth.uid());
CREATE POLICY "clients and admins manage assistants" ON public.client_assistant_access
  FOR INSERT TO authenticated WITH CHECK (
    invited_by = auth.uid() AND (public.is_admin(auth.uid()) OR public.project_member_role(project_id, auth.uid()) = 'client'));
CREATE POLICY "clients and admins update assistants" ON public.client_assistant_access
  FOR UPDATE TO authenticated USING (public.is_admin(auth.uid()) OR public.project_member_role(project_id, auth.uid()) = 'client');

-- ============ AUDIT ============
CREATE OR REPLACE FUNCTION public.log_audit(_action text, _entity_type text, _entity_id uuid, _project_id uuid, _old jsonb, _new jsonb, _reason text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.audit_log (actor_id, actor_role, action, entity_type, entity_id, project_id, old_value, new_value, reason)
  VALUES (auth.uid(), (SELECT role::text FROM public.user_roles WHERE user_id = auth.uid() LIMIT 1),
          _action, _entity_type, _entity_id, _project_id, _old, _new, _reason);
END $$;

-- ============ BASELINE PLAN VERSIONS ============
CREATE TABLE IF NOT EXISTS public.project_plan_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  version_no integer NOT NULL,
  title text NOT NULL,
  status plan_version_status NOT NULL DEFAULT 'draft',
  planned_start_date date,
  planned_end_date date,
  period_label text,
  file_path text,
  revision_reason text,
  previous_version_id uuid REFERENCES public.project_plan_versions(id),
  admin_note text,
  submitted_by uuid NOT NULL,
  submitted_at timestamptz NOT NULL DEFAULT now(),
  activated_at timestamptz,
  activated_by uuid,
  archived_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (project_id, version_no)
);
CREATE UNIQUE INDEX IF NOT EXISTS one_active_plan_per_project
  ON public.project_plan_versions (project_id) WHERE status = 'active';
GRANT SELECT, INSERT, UPDATE ON public.project_plan_versions TO authenticated;
GRANT ALL ON public.project_plan_versions TO service_role;
ALTER TABLE public.project_plan_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "plan versions readable by project people" ON public.project_plan_versions
  FOR SELECT TO authenticated USING (public.can_view_project(project_id, auth.uid()));
CREATE POLICY "team submits plan versions" ON public.project_plan_versions
  FOR INSERT TO authenticated WITH CHECK (submitted_by = auth.uid() AND public.can_manage_project(project_id, auth.uid()) AND status IN ('draft','submitted'));
CREATE POLICY "authors edit drafts, super admin edits all" ON public.project_plan_versions
  FOR UPDATE TO authenticated
  USING (public.is_super_admin(auth.uid()) OR (submitted_by = auth.uid() AND status = 'draft'))
  WITH CHECK (public.is_super_admin(auth.uid()) OR (submitted_by = auth.uid() AND status IN ('draft','submitted')));

CREATE OR REPLACE FUNCTION public.trg_plan_version_guard()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.status IN ('active','archived') AND OLD.status IS DISTINCT FROM NEW.status
     AND NOT public.is_super_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Only a Super Admin can activate or archive a baseline plan version';
  END IF;
  IF OLD.status = 'active' AND NEW.status = 'active'
     AND (NEW.planned_start_date IS DISTINCT FROM OLD.planned_start_date
       OR NEW.planned_end_date IS DISTINCT FROM OLD.planned_end_date
       OR NEW.file_path IS DISTINCT FROM OLD.file_path
       OR NEW.title IS DISTINCT FROM OLD.title)
     AND NOT public.is_super_admin(auth.uid()) THEN
    RAISE EXCEPTION 'An active baseline plan cannot be modified';
  END IF;
  IF OLD.status = 'archived' AND NEW.status <> 'archived' THEN
    RAISE EXCEPTION 'An archived baseline plan version cannot be reopened';
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END $$;
CREATE TRIGGER plan_version_guard BEFORE UPDATE ON public.project_plan_versions
  FOR EACH ROW EXECUTE FUNCTION public.trg_plan_version_guard();

CREATE OR REPLACE FUNCTION public.trg_plan_version_activate()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.status = 'active' AND (TG_OP = 'INSERT' OR OLD.status IS DISTINCT FROM 'active') THEN
    UPDATE public.project_plan_versions
       SET status = 'archived', archived_at = now()
     WHERE project_id = NEW.project_id AND id <> NEW.id AND status = 'active';
    UPDATE public.projects
       SET active_plan_version_id = NEW.id, execution_enabled = true, updated_at = now()
     WHERE id = NEW.project_id;
    PERFORM public.log_audit('plan_version_activated','project_plan_version',NEW.id,NEW.project_id,NULL,
      jsonb_build_object('version_no',NEW.version_no), NEW.revision_reason);
  END IF;
  RETURN NULL;
END $$;
CREATE TRIGGER plan_version_activate AFTER INSERT OR UPDATE ON public.project_plan_versions
  FOR EACH ROW EXECUTE FUNCTION public.trg_plan_version_activate();

CREATE TABLE IF NOT EXISTS public.plan_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_version_id uuid NOT NULL REFERENCES public.project_plan_versions(id) ON DELETE CASCADE,
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  milestone_id uuid REFERENCES public.milestones(id) ON DELETE SET NULL,
  sub_milestone_id uuid REFERENCES public.sub_milestones(id) ON DELETE SET NULL,
  title text NOT NULL,
  planned_start date,
  planned_end date,
  dependency text,
  ordering integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.plan_activities TO authenticated;
GRANT ALL ON public.plan_activities TO service_role;
ALTER TABLE public.plan_activities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "plan activities readable" ON public.plan_activities
  FOR SELECT TO authenticated USING (public.can_view_project(project_id, auth.uid()));
CREATE POLICY "plan activities writable on drafts" ON public.plan_activities
  FOR ALL TO authenticated
  USING (public.is_super_admin(auth.uid()) OR (public.can_manage_project(project_id, auth.uid())
        AND EXISTS (SELECT 1 FROM public.project_plan_versions v WHERE v.id = plan_version_id AND v.status IN ('draft','submitted'))))
  WITH CHECK (public.is_super_admin(auth.uid()) OR (public.can_manage_project(project_id, auth.uid())
        AND EXISTS (SELECT 1 FROM public.project_plan_versions v WHERE v.id = plan_version_id AND v.status IN ('draft','submitted'))));

-- ============ WEEKLY WORK PLAN ============
CREATE TABLE IF NOT EXISTS public.weekly_work_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  plan_version_id uuid REFERENCES public.project_plan_versions(id),
  week_no integer NOT NULL,
  year integer NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  status weekly_plan_status NOT NULL DEFAULT 'draft',
  cycle_status weekly_cycle_status NOT NULL DEFAULT 'open',
  notes text,
  expected_outcome text,
  created_by uuid NOT NULL,
  activated_at timestamptz,
  closed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (project_id, year, week_no)
);
GRANT SELECT, INSERT, UPDATE ON public.weekly_work_plans TO authenticated;
GRANT ALL ON public.weekly_work_plans TO service_role;
ALTER TABLE public.weekly_work_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "weekly plans readable" ON public.weekly_work_plans
  FOR SELECT TO authenticated USING (
    public.can_view_project(project_id, auth.uid())
    AND (status IN ('active','closed') OR NOT public.is_project_client_side(project_id, auth.uid())));
CREATE POLICY "weekly plans created by team" ON public.weekly_work_plans
  FOR INSERT TO authenticated WITH CHECK (created_by = auth.uid() AND public.can_manage_project(project_id, auth.uid()));
CREATE POLICY "weekly plans updated by team" ON public.weekly_work_plans
  FOR UPDATE TO authenticated USING (public.can_manage_project(project_id, auth.uid()));
CREATE TRIGGER weekly_work_plans_updated BEFORE UPDATE ON public.weekly_work_plans
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.weekly_work_days (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  weekly_work_plan_id uuid NOT NULL REFERENCES public.weekly_work_plans(id) ON DELETE CASCADE,
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  work_date date NOT NULL,
  is_working_day boolean NOT NULL DEFAULT true,
  locked boolean NOT NULL DEFAULT false,
  reporting_status text NOT NULL DEFAULT 'scheduled',
  exception_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (weekly_work_plan_id, work_date)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.weekly_work_days TO authenticated;
GRANT ALL ON public.weekly_work_days TO service_role;
ALTER TABLE public.weekly_work_days ENABLE ROW LEVEL SECURITY;
CREATE POLICY "work days readable" ON public.weekly_work_days
  FOR SELECT TO authenticated USING (public.can_view_project(project_id, auth.uid()));
CREATE POLICY "work days managed by team" ON public.weekly_work_days
  FOR ALL TO authenticated
  USING (public.can_manage_project(project_id, auth.uid()))
  WITH CHECK (public.can_manage_project(project_id, auth.uid()));

CREATE OR REPLACE FUNCTION public.trg_work_day_lock()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    IF OLD.locked THEN RAISE EXCEPTION 'Working days of an active weekly plan are locked'; END IF;
    RETURN OLD;
  END IF;
  IF TG_OP = 'UPDATE' AND OLD.locked
     AND (NEW.is_working_day IS DISTINCT FROM OLD.is_working_day OR NEW.work_date IS DISTINCT FROM OLD.work_date)
     AND NEW.exception_reason IS NULL THEN
    RAISE EXCEPTION 'A locked working day can only be changed through a documented exception';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER work_day_lock BEFORE UPDATE OR DELETE ON public.weekly_work_days
  FOR EACH ROW EXECUTE FUNCTION public.trg_work_day_lock();

CREATE TABLE IF NOT EXISTS public.planned_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  weekly_work_plan_id uuid NOT NULL REFERENCES public.weekly_work_plans(id) ON DELETE CASCADE,
  work_day_id uuid REFERENCES public.weekly_work_days(id) ON DELETE CASCADE,
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  milestone_id uuid REFERENCES public.milestones(id) ON DELETE SET NULL,
  sub_milestone_id uuid REFERENCES public.sub_milestones(id) ON DELETE SET NULL,
  title text NOT NULL,
  responsible_id uuid,
  planned_quantity numeric,
  unit text,
  expected_outcome text,
  status activity_status NOT NULL DEFAULT 'not_started',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.planned_activities TO authenticated;
GRANT ALL ON public.planned_activities TO service_role;
ALTER TABLE public.planned_activities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "planned activities readable" ON public.planned_activities
  FOR SELECT TO authenticated USING (public.can_view_project(project_id, auth.uid()));
CREATE POLICY "planned activities managed by team" ON public.planned_activities
  FOR ALL TO authenticated
  USING (public.can_manage_project(project_id, auth.uid()))
  WITH CHECK (public.can_manage_project(project_id, auth.uid()));

-- ============ OBLIGATIONS ============
CREATE TABLE IF NOT EXISTS public.report_obligations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  weekly_work_plan_id uuid REFERENCES public.weekly_work_plans(id) ON DELETE CASCADE,
  work_day_id uuid REFERENCES public.weekly_work_days(id) ON DELETE CASCADE,
  kind obligation_kind NOT NULL,
  due_date date NOT NULL,
  due_at timestamptz NOT NULL,
  status obligation_status NOT NULL DEFAULT 'pending',
  report_id uuid,
  responsible_id uuid,
  resolved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS obligation_unique_daily ON public.report_obligations (project_id, kind, due_date) WHERE kind = 'daily';
CREATE UNIQUE INDEX IF NOT EXISTS obligation_unique_weekly ON public.report_obligations (weekly_work_plan_id) WHERE kind = 'weekly';
GRANT SELECT ON public.report_obligations TO authenticated;
GRANT ALL ON public.report_obligations TO service_role;
ALTER TABLE public.report_obligations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "obligations readable" ON public.report_obligations
  FOR SELECT TO authenticated USING (public.can_view_project(project_id, auth.uid()));

CREATE TABLE IF NOT EXISTS public.compliance_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  obligation_id uuid REFERENCES public.report_obligations(id) ON DELETE CASCADE,
  weekly_work_plan_id uuid REFERENCES public.weekly_work_plans(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  event_date date NOT NULL,
  responsible_id uuid,
  detail text,
  admin_note text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS compliance_event_unique ON public.compliance_events (obligation_id, event_type) WHERE obligation_id IS NOT NULL;
GRANT SELECT ON public.compliance_events TO authenticated;
GRANT UPDATE (admin_note) ON public.compliance_events TO authenticated;
GRANT ALL ON public.compliance_events TO service_role;
ALTER TABLE public.compliance_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "compliance events readable" ON public.compliance_events
  FOR SELECT TO authenticated USING (public.can_view_project(project_id, auth.uid()));
CREATE POLICY "super admin may annotate compliance events" ON public.compliance_events
  FOR UPDATE TO authenticated USING (public.is_super_admin(auth.uid())) WITH CHECK (public.is_super_admin(auth.uid()));

-- Create obligations when a weekly plan becomes active, and lock its days
CREATE OR REPLACE FUNCTION public.trg_weekly_plan_activate()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _tz text; _last date;
BEGIN
  IF NEW.status = 'active' AND OLD.status IS DISTINCT FROM 'active' THEN
    SELECT COALESCE(timezone,'UTC') INTO _tz FROM public.projects WHERE id = NEW.project_id;
    UPDATE public.weekly_work_days SET locked = true WHERE weekly_work_plan_id = NEW.id;

    INSERT INTO public.report_obligations (project_id, weekly_work_plan_id, work_day_id, kind, due_date, due_at)
    SELECT NEW.project_id, NEW.id, d.id, 'daily', d.work_date,
           ((d.work_date + time '23:59:59') AT TIME ZONE _tz)
    FROM public.weekly_work_days d
    WHERE d.weekly_work_plan_id = NEW.id AND d.is_working_day
    ON CONFLICT DO NOTHING;

    SELECT max(work_date) INTO _last FROM public.weekly_work_days
      WHERE weekly_work_plan_id = NEW.id AND is_working_day;
    IF _last IS NOT NULL THEN
      INSERT INTO public.report_obligations (project_id, weekly_work_plan_id, kind, due_date, due_at)
      VALUES (NEW.project_id, NEW.id, 'weekly', _last, ((_last + time '23:59:59') AT TIME ZONE _tz))
      ON CONFLICT DO NOTHING;
    END IF;

    UPDATE public.weekly_work_plans SET activated_at = COALESCE(activated_at, now()) WHERE id = NEW.id;
    PERFORM public.log_audit('weekly_plan_activated','weekly_work_plan',NEW.id,NEW.project_id,NULL,
      jsonb_build_object('week_no',NEW.week_no,'year',NEW.year), NULL);
  END IF;
  RETURN NULL;
END $$;
CREATE TRIGGER weekly_plan_activate AFTER UPDATE ON public.weekly_work_plans
  FOR EACH ROW EXECUTE FUNCTION public.trg_weekly_plan_activate();

-- ============ REPORTS (evolve daily_reports) ============
ALTER TABLE public.daily_reports
  ADD COLUMN IF NOT EXISTS obligation_id uuid REFERENCES public.report_obligations(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS weekly_work_plan_id uuid REFERENCES public.weekly_work_plans(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS plan_version_id uuid REFERENCES public.project_plan_versions(id),
  ADD COLUMN IF NOT EXISTS state report_state NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS revision integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS supersedes_id uuid REFERENCES public.daily_reports(id),
  ADD COLUMN IF NOT EXISTS submitted_at_server timestamptz,
  ADD COLUMN IF NOT EXISTS signature_snapshot jsonb,
  ADD COLUMN IF NOT EXISTS approver_signature_snapshot jsonb,
  ADD COLUMN IF NOT EXISTS report_ref text,
  ADD COLUMN IF NOT EXISTS work_start_time time,
  ADD COLUMN IF NOT EXISTS work_end_time time,
  ADD COLUMN IF NOT EXISTS work_area text,
  ADD COLUMN IF NOT EXISTS personnel jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS equipment jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS works_done jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS materials jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS owner_instructions text,
  ADD COLUMN IF NOT EXISTS supervision_instructions text,
  ADD COLUMN IF NOT EXISTS safety_observations text,
  ADD COLUMN IF NOT EXISTS technical_observations text,
  ADD COLUMN IF NOT EXISTS corrective_actions text,
  ADD COLUMN IF NOT EXISTS delays text,
  ADD COLUMN IF NOT EXISTS is_late boolean NOT NULL DEFAULT false;

UPDATE public.daily_reports SET state = CASE status
  WHEN 'draft' THEN 'draft'::report_state
  WHEN 'submitted' THEN 'submitted'::report_state
  WHEN 'under-review' THEN 'under_review'::report_state
  WHEN 'approved' THEN 'approved'::report_state
  WHEN 'rejected' THEN 'rejected'::report_state
  WHEN 'published' THEN 'approved'::report_state
  ELSE 'draft'::report_state END
WHERE state = 'draft';

CREATE OR REPLACE FUNCTION public.trg_report_state_guard()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND OLD.state = 'approved' AND NOT public.is_super_admin(auth.uid()) THEN
    IF NEW.state IS DISTINCT FROM OLD.state OR NEW.summary IS DISTINCT FROM OLD.summary
       OR NEW.notes IS DISTINCT FROM OLD.notes OR NEW.works_done IS DISTINCT FROM OLD.works_done THEN
      RAISE EXCEPTION 'An approved report is an official record and cannot be modified';
    END IF;
  END IF;
  IF TG_OP = 'UPDATE' AND OLD.state = 'absent' THEN
    RAISE EXCEPTION 'An absent report cannot be converted into a submitted report';
  END IF;
  IF NEW.state = 'submitted' AND OLD.state IS DISTINCT FROM 'submitted' THEN
    NEW.submitted_at_server := now();
    IF NEW.obligation_id IS NOT NULL THEN
      NEW.is_late := EXISTS (SELECT 1 FROM public.report_obligations o WHERE o.id = NEW.obligation_id AND now() > o.due_at);
    END IF;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER report_state_guard BEFORE UPDATE ON public.daily_reports
  FOR EACH ROW EXECUTE FUNCTION public.trg_report_state_guard();

CREATE OR REPLACE FUNCTION public.trg_report_sync_obligation()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.obligation_id IS NOT NULL AND NEW.state IN ('submitted','under_review','approved') THEN
    UPDATE public.report_obligations
       SET status = CASE WHEN NEW.state = 'approved' THEN 'approved'::obligation_status ELSE 'submitted'::obligation_status END,
           report_id = NEW.id, resolved_at = COALESCE(resolved_at, now()), updated_at = now()
     WHERE id = NEW.obligation_id AND status <> 'absent';
  END IF;
  RETURN NULL;
END $$;
CREATE TRIGGER report_sync_obligation AFTER INSERT OR UPDATE ON public.daily_reports
  FOR EACH ROW EXECUTE FUNCTION public.trg_report_sync_obligation();

-- ============ REPORT VERSIONS / APPROVALS / SIGNATURES ============
CREATE TABLE IF NOT EXISTS public.report_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id uuid NOT NULL REFERENCES public.daily_reports(id) ON DELETE CASCADE,
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  revision integer NOT NULL,
  state report_state NOT NULL,
  snapshot jsonb NOT NULL,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.report_versions TO authenticated;
GRANT ALL ON public.report_versions TO service_role;
ALTER TABLE public.report_versions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "report versions readable by team" ON public.report_versions
  FOR SELECT TO authenticated USING (public.can_view_project(project_id, auth.uid()) AND NOT public.is_project_client_side(project_id, auth.uid()));
CREATE POLICY "report versions insertable" ON public.report_versions
  FOR INSERT TO authenticated WITH CHECK (created_by = auth.uid() AND public.can_report_on_project(project_id, auth.uid()));

CREATE TABLE IF NOT EXISTS public.signature_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  version integer NOT NULL DEFAULT 1,
  kind text NOT NULL DEFAULT 'initials',
  initials text,
  signature_data text,
  full_name text,
  is_current boolean NOT NULL DEFAULT true,
  registered_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS signature_current_unique ON public.signature_profiles (user_id) WHERE is_current;
GRANT SELECT, INSERT, UPDATE ON public.signature_profiles TO authenticated;
GRANT ALL ON public.signature_profiles TO service_role;
ALTER TABLE public.signature_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "signatures readable by co-members" ON public.signature_profiles
  FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_admin(auth.uid()) OR public.shares_project(auth.uid(), user_id));
CREATE POLICY "own signature registration" ON public.signature_profiles
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "own signature retirement" ON public.signature_profiles
  FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE TABLE IF NOT EXISTS public.report_approvals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id uuid NOT NULL REFERENCES public.daily_reports(id) ON DELETE CASCADE,
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  reviewer_id uuid NOT NULL,
  decision approval_decision NOT NULL,
  reason text,
  signature_profile_id uuid REFERENCES public.signature_profiles(id),
  signature_snapshot jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.report_approvals TO authenticated;
GRANT ALL ON public.report_approvals TO service_role;
ALTER TABLE public.report_approvals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "approvals readable" ON public.report_approvals
  FOR SELECT TO authenticated USING (public.can_view_project(project_id, auth.uid()));
CREATE POLICY "reviewers record approvals" ON public.report_approvals
  FOR INSERT TO authenticated WITH CHECK (reviewer_id = auth.uid() AND public.can_manage_project(project_id, auth.uid()));

-- ============ DOCUMENTS ============
CREATE TABLE IF NOT EXISTS public.project_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  title text NOT NULL,
  category text NOT NULL DEFAULT 'general',
  description text,
  visibility text NOT NULL DEFAULT 'project',
  current_version integer NOT NULL DEFAULT 1,
  uploaded_by uuid NOT NULL,
  uploader_role text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.project_documents TO authenticated;
GRANT ALL ON public.project_documents TO service_role;
ALTER TABLE public.project_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "documents readable" ON public.project_documents
  FOR SELECT TO authenticated USING (
    public.can_view_project(project_id, auth.uid())
    AND (visibility <> 'internal' OR NOT public.is_project_client_side(project_id, auth.uid())));
CREATE POLICY "documents uploadable" ON public.project_documents
  FOR INSERT TO authenticated WITH CHECK (uploaded_by = auth.uid() AND public.can_view_project(project_id, auth.uid()));
CREATE POLICY "documents updatable by uploader or manager" ON public.project_documents
  FOR UPDATE TO authenticated USING (uploaded_by = auth.uid() OR public.can_manage_project(project_id, auth.uid()));

CREATE TABLE IF NOT EXISTS public.document_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL REFERENCES public.project_documents(id) ON DELETE CASCADE,
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  version integer NOT NULL,
  storage_path text NOT NULL,
  mime_type text,
  note text,
  uploaded_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (document_id, version)
);
GRANT SELECT, INSERT ON public.document_versions TO authenticated;
GRANT ALL ON public.document_versions TO service_role;
ALTER TABLE public.document_versions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "document versions readable" ON public.document_versions
  FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.project_documents d WHERE d.id = document_id));
CREATE POLICY "document versions insertable" ON public.document_versions
  FOR INSERT TO authenticated WITH CHECK (uploaded_by = auth.uid() AND public.can_view_project(project_id, auth.uid()));

-- ============ COMMENTS ============
CREATE TABLE IF NOT EXISTS public.report_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  report_id uuid REFERENCES public.daily_reports(id) ON DELETE CASCADE,
  entity_type text NOT NULL DEFAULT 'report',
  entity_id uuid,
  author_id uuid NOT NULL,
  author_role text,
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.report_comments TO authenticated;
GRANT ALL ON public.report_comments TO service_role;
ALTER TABLE public.report_comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "comments readable" ON public.report_comments
  FOR SELECT TO authenticated USING (public.can_view_project(project_id, auth.uid()));
CREATE POLICY "comments insertable" ON public.report_comments
  FOR INSERT TO authenticated WITH CHECK (author_id = auth.uid() AND public.can_view_project(project_id, auth.uid()));

-- ============ DEADLINE ENGINE ============
CREATE OR REPLACE FUNCTION public.enforce_report_deadlines()
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _o record; _count integer := 0;
BEGIN
  FOR _o IN
    SELECT * FROM public.report_obligations
    WHERE status = 'pending' AND due_at < now()
    LIMIT 500
  LOOP
    UPDATE public.report_obligations
       SET status = 'absent', resolved_at = now(), updated_at = now()
     WHERE id = _o.id;

    INSERT INTO public.compliance_events (project_id, obligation_id, weekly_work_plan_id, event_type, event_date, responsible_id, detail)
    VALUES (_o.project_id, _o.id, _o.weekly_work_plan_id,
            CASE WHEN _o.kind = 'daily' THEN 'daily_report_absent' ELSE 'weekly_report_absent' END,
            _o.due_date, _o.responsible_id,
            'Deadline ' || to_char(_o.due_at, 'YYYY-MM-DD HH24:MI') || ' passed with no valid submission')
    ON CONFLICT DO NOTHING;

    IF _o.kind = 'daily' AND _o.work_day_id IS NOT NULL THEN
      UPDATE public.weekly_work_days SET reporting_status = 'unworked_unreported' WHERE id = _o.work_day_id;
    END IF;

    IF _o.kind = 'weekly' AND _o.weekly_work_plan_id IS NOT NULL THEN
      UPDATE public.weekly_work_plans SET cycle_status = 'non_compliant' WHERE id = _o.weekly_work_plan_id;
    END IF;

    INSERT INTO public.audit_log (actor_id, actor_role, action, entity_type, entity_id, project_id, new_value)
    VALUES (NULL, 'system', 'report_obligation_absent', 'report_obligation', _o.id, _o.project_id,
            jsonb_build_object('kind', _o.kind, 'due_at', _o.due_at));

    PERFORM public.notify_project_roles(_o.project_id,
      ARRAY['manager','engineer']::project_member_role[], NULL,
      CASE WHEN _o.kind='daily' THEN 'Daily report marked ABSENT' ELSE 'Weekly report marked ABSENT' END,
      'Deadline of ' || _o.due_date::text || ' passed without a submission',
      '/projects/' || _o.project_id::text, 'compliance_absent', 'report_obligation', _o.id);

    _count := _count + 1;
  END LOOP;
  RETURN _count;
END $$;
REVOKE EXECUTE ON FUNCTION public.enforce_report_deadlines() FROM anon, authenticated;
