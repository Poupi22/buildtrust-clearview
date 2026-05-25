
-- Enum for progress report status
DO $$ BEGIN
  CREATE TYPE public.progress_report_status AS ENUM ('submitted','approved','rejected');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Add contribution to milestones
ALTER TABLE public.milestones
  ADD COLUMN IF NOT EXISTS contribution_pct numeric NOT NULL DEFAULT 0;

-- Sub-milestones table
CREATE TABLE IF NOT EXISTS public.sub_milestones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  milestone_id uuid NOT NULL,
  project_id uuid NOT NULL,
  title text NOT NULL,
  unit text NOT NULL DEFAULT 'unit',
  target_quantity numeric NOT NULL CHECK (target_quantity > 0),
  contribution_pct numeric NOT NULL DEFAULT 0,
  ordering integer NOT NULL DEFAULT 0,
  completed_quantity numeric NOT NULL DEFAULT 0,
  progress_pct numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending',
  is_published boolean NOT NULL DEFAULT false,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_sub_milestones_milestone ON public.sub_milestones(milestone_id);
CREATE INDEX IF NOT EXISTS idx_sub_milestones_project ON public.sub_milestones(project_id);

ALTER TABLE public.sub_milestones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage sub_milestones" ON public.sub_milestones
  FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Managers/engineers manage sub_milestones" ON public.sub_milestones
  FOR ALL TO authenticated
  USING (public.project_member_role(project_id, auth.uid()) IN ('manager'::project_member_role,'engineer'::project_member_role))
  WITH CHECK (public.project_member_role(project_id, auth.uid()) IN ('manager'::project_member_role,'engineer'::project_member_role));

CREATE POLICY "Members view sub_milestones" ON public.sub_milestones
  FOR SELECT TO authenticated
  USING (
    public.is_project_member(project_id, auth.uid())
    AND (public.project_member_role(project_id, auth.uid()) <> 'client'::project_member_role OR is_published = true)
  );

CREATE TRIGGER sub_milestones_set_updated_at
BEFORE UPDATE ON public.sub_milestones
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Progress reports
CREATE TABLE IF NOT EXISTS public.progress_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sub_milestone_id uuid NOT NULL,
  project_id uuid NOT NULL,
  author_id uuid NOT NULL,
  quantity numeric NOT NULL CHECK (quantity > 0),
  description text,
  report_date date NOT NULL DEFAULT CURRENT_DATE,
  status public.progress_report_status NOT NULL DEFAULT 'submitted',
  review_comment text,
  reviewed_by uuid,
  reviewed_at timestamptz,
  is_published boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_progress_reports_sub ON public.progress_reports(sub_milestone_id);
CREATE INDEX IF NOT EXISTS idx_progress_reports_project ON public.progress_reports(project_id);

ALTER TABLE public.progress_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage progress_reports" ON public.progress_reports
  FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Engineers/managers create progress_reports" ON public.progress_reports
  FOR INSERT TO authenticated
  WITH CHECK (
    author_id = auth.uid()
    AND public.project_member_role(project_id, auth.uid()) IN ('manager'::project_member_role,'engineer'::project_member_role)
  );

CREATE POLICY "Authors update own pending/rejected" ON public.progress_reports
  FOR UPDATE TO authenticated
  USING (author_id = auth.uid() AND status IN ('submitted','rejected'))
  WITH CHECK (author_id = auth.uid());

CREATE POLICY "Authors delete own rejected" ON public.progress_reports
  FOR DELETE TO authenticated
  USING (author_id = auth.uid() AND status = 'rejected');

CREATE POLICY "Managers review progress_reports" ON public.progress_reports
  FOR UPDATE TO authenticated
  USING (public.project_member_role(project_id, auth.uid()) = 'manager'::project_member_role)
  WITH CHECK (public.project_member_role(project_id, auth.uid()) = 'manager'::project_member_role);

CREATE POLICY "Members view progress_reports" ON public.progress_reports
  FOR SELECT TO authenticated
  USING (
    public.is_project_member(project_id, auth.uid())
    AND (
      public.project_member_role(project_id, auth.uid()) <> 'client'::project_member_role
      OR (status = 'approved' AND is_published = true)
    )
  );

CREATE TRIGGER progress_reports_set_updated_at
BEFORE UPDATE ON public.progress_reports
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Link media to progress reports
ALTER TABLE public.media_files
  ADD COLUMN IF NOT EXISTS progress_report_id uuid;
CREATE INDEX IF NOT EXISTS idx_media_files_progress_report ON public.media_files(progress_report_id);

-- ============ Recalc functions ============

CREATE OR REPLACE FUNCTION public.recalc_sub_milestone(_sub uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _target numeric;
  _done numeric;
  _pct numeric;
  _status text;
BEGIN
  SELECT target_quantity INTO _target FROM public.sub_milestones WHERE id = _sub;
  IF _target IS NULL THEN RETURN; END IF;

  SELECT COALESCE(SUM(quantity),0) INTO _done
    FROM public.progress_reports
    WHERE sub_milestone_id = _sub AND status = 'approved';

  _pct := LEAST(100, ROUND((_done / _target) * 100, 2));
  _status := CASE WHEN _pct >= 100 THEN 'completed'
                  WHEN _pct > 0 THEN 'in-progress'
                  ELSE 'pending' END;

  UPDATE public.sub_milestones
    SET completed_quantity = _done,
        progress_pct = _pct,
        status = _status,
        updated_at = now()
    WHERE id = _sub;
END;
$$;

CREATE OR REPLACE FUNCTION public.recalc_milestone(_m uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _agg numeric;
  _total_contrib numeric;
BEGIN
  SELECT
    COALESCE(SUM(progress_pct * contribution_pct) / NULLIF(SUM(contribution_pct),0), 0),
    COALESCE(SUM(contribution_pct), 0)
  INTO _agg, _total_contrib
  FROM public.sub_milestones WHERE milestone_id = _m;

  UPDATE public.milestones
    SET progress = ROUND(COALESCE(_agg, 0))::int,
        status = CASE WHEN _agg >= 100 THEN 'completed'::milestone_status
                      WHEN _agg > 0 THEN 'in-progress'::milestone_status
                      ELSE 'pending'::milestone_status END,
        updated_at = now()
    WHERE id = _m;
END;
$$;

CREATE OR REPLACE FUNCTION public.recalc_project(_p uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _agg numeric;
BEGIN
  SELECT COALESCE(SUM(progress * contribution_pct) / NULLIF(SUM(contribution_pct),0), 0)
    INTO _agg
    FROM public.milestones WHERE project_id = _p;

  UPDATE public.projects
    SET completion = ROUND(COALESCE(_agg, 0))::int,
        updated_at = now()
    WHERE id = _p;
END;
$$;

-- Trigger: cascade recalculations from progress_reports
CREATE OR REPLACE FUNCTION public.trg_progress_reports_after()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _sub uuid;
  _milestone uuid;
  _project uuid;
BEGIN
  _sub := COALESCE(NEW.sub_milestone_id, OLD.sub_milestone_id);
  _project := COALESCE(NEW.project_id, OLD.project_id);
  SELECT milestone_id INTO _milestone FROM public.sub_milestones WHERE id = _sub;
  PERFORM public.recalc_sub_milestone(_sub);
  IF _milestone IS NOT NULL THEN PERFORM public.recalc_milestone(_milestone); END IF;
  IF _project IS NOT NULL THEN PERFORM public.recalc_project(_project); END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS progress_reports_after ON public.progress_reports;
CREATE TRIGGER progress_reports_after
AFTER INSERT OR UPDATE OR DELETE ON public.progress_reports
FOR EACH ROW EXECUTE FUNCTION public.trg_progress_reports_after();

-- Trigger: recalc parent when sub-milestone changes (target/contribution)
CREATE OR REPLACE FUNCTION public.trg_sub_milestones_after()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _milestone uuid;
  _project uuid;
BEGIN
  _milestone := COALESCE(NEW.milestone_id, OLD.milestone_id);
  _project := COALESCE(NEW.project_id, OLD.project_id);
  IF TG_OP <> 'DELETE' AND (TG_OP = 'INSERT' OR NEW.target_quantity IS DISTINCT FROM OLD.target_quantity) THEN
    PERFORM public.recalc_sub_milestone(NEW.id);
  END IF;
  IF _milestone IS NOT NULL THEN PERFORM public.recalc_milestone(_milestone); END IF;
  IF _project IS NOT NULL THEN PERFORM public.recalc_project(_project); END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS sub_milestones_after ON public.sub_milestones;
CREATE TRIGGER sub_milestones_after
AFTER INSERT OR UPDATE OR DELETE ON public.sub_milestones
FOR EACH ROW EXECUTE FUNCTION public.trg_sub_milestones_after();

-- Trigger: recalc project when milestone contribution changes
CREATE OR REPLACE FUNCTION public.trg_milestones_after_contrib()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' OR NEW.contribution_pct IS DISTINCT FROM OLD.contribution_pct OR TG_OP = 'DELETE' THEN
    PERFORM public.recalc_project(COALESCE(NEW.project_id, OLD.project_id));
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS milestones_after_contrib ON public.milestones;
CREATE TRIGGER milestones_after_contrib
AFTER INSERT OR UPDATE OF contribution_pct OR DELETE ON public.milestones
FOR EACH ROW EXECUTE FUNCTION public.trg_milestones_after_contrib();

-- Block new reports when sub-milestone is already completed
CREATE OR REPLACE FUNCTION public.trg_progress_reports_before_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _pct numeric;
  _target numeric;
  _done numeric;
BEGIN
  SELECT progress_pct, target_quantity, completed_quantity
    INTO _pct, _target, _done
    FROM public.sub_milestones WHERE id = NEW.sub_milestone_id;
  IF _pct IS NULL THEN
    RAISE EXCEPTION 'Sub-milestone not found';
  END IF;
  IF _pct >= 100 THEN
    RAISE EXCEPTION 'Sub-milestone already completed (100%%) — no new reports allowed';
  END IF;
  IF (_done + NEW.quantity) > _target * 1.0001 THEN
    -- Allow approval flow to clamp, but warn on submission exceeding target via approved set
    NULL;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS progress_reports_before_insert ON public.progress_reports;
CREATE TRIGGER progress_reports_before_insert
BEFORE INSERT ON public.progress_reports
FOR EACH ROW EXECUTE FUNCTION public.trg_progress_reports_before_insert();
