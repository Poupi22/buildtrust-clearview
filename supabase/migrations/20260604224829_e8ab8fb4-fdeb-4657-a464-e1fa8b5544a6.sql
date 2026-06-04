
-- 1. Extend role enums
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'technician';
ALTER TYPE public.project_member_role ADD VALUE IF NOT EXISTS 'technician';

-- 2. Tasks table
CREATE TABLE IF NOT EXISTS public.tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  milestone_id uuid REFERENCES public.milestones(id) ON DELETE SET NULL,
  sub_milestone_id uuid REFERENCES public.sub_milestones(id) ON DELETE SET NULL,
  assigned_to uuid NOT NULL,
  title text NOT NULL,
  description text,
  due_date date,
  status text NOT NULL DEFAULT 'todo' CHECK (status IN ('todo','in_progress','done','blocked')),
  priority text NOT NULL DEFAULT 'normal' CHECK (priority IN ('low','normal','high','urgent')),
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tasks_project ON public.tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assignee ON public.tasks(assigned_to);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.tasks TO authenticated;
GRANT ALL ON public.tasks TO service_role;

ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- Admins (super/company) full access
CREATE POLICY "Admins manage tasks"
  ON public.tasks FOR ALL
  TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- Project managers full access on their projects
CREATE POLICY "Managers manage project tasks"
  ON public.tasks FOR ALL
  TO authenticated
  USING (public.project_member_role(project_id, auth.uid()) = 'manager'::project_member_role)
  WITH CHECK (public.project_member_role(project_id, auth.uid()) = 'manager'::project_member_role);

-- Project members can read tasks on their project
CREATE POLICY "Project members read tasks"
  ON public.tasks FOR SELECT
  TO authenticated
  USING (public.is_project_member(project_id, auth.uid()));

-- Assignees can update status on their own tasks (whole row update allowed; trigger guards columns)
CREATE POLICY "Assignee updates own task"
  ON public.tasks FOR UPDATE
  TO authenticated
  USING (assigned_to = auth.uid())
  WITH CHECK (assigned_to = auth.uid());

-- Restrict assignee updates to only status field
CREATE OR REPLACE FUNCTION public.trg_tasks_restrict_assignee_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- admins/managers bypass
  IF public.is_admin(auth.uid())
     OR public.project_member_role(NEW.project_id, auth.uid()) = 'manager'::project_member_role THEN
    RETURN NEW;
  END IF;

  -- assignee can only touch status (and updated_at)
  IF NEW.assigned_to <> OLD.assigned_to
     OR NEW.title IS DISTINCT FROM OLD.title
     OR NEW.description IS DISTINCT FROM OLD.description
     OR NEW.due_date IS DISTINCT FROM OLD.due_date
     OR NEW.priority IS DISTINCT FROM OLD.priority
     OR NEW.project_id <> OLD.project_id
     OR NEW.milestone_id IS DISTINCT FROM OLD.milestone_id
     OR NEW.sub_milestone_id IS DISTINCT FROM OLD.sub_milestone_id THEN
    RAISE EXCEPTION 'Only status can be updated by assignee';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tasks_restrict_assignee_update ON public.tasks;
CREATE TRIGGER tasks_restrict_assignee_update
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION public.trg_tasks_restrict_assignee_update();

DROP TRIGGER IF EXISTS tasks_updated_at ON public.tasks;
CREATE TRIGGER tasks_updated_at
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
