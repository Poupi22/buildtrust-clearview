
-- 1) Table
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL,
  body text,
  link text,
  type text NOT NULL,
  entity_type text,
  entity_id uuid,
  project_id uuid,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_notifications_user_unread ON public.notifications(user_id, is_read, created_at DESC);

GRANT SELECT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own notifications" ON public.notifications
  FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users update own notifications" ON public.notifications
  FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users delete own notifications" ON public.notifications
  FOR DELETE TO authenticated USING (user_id = auth.uid());

ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER TABLE public.notifications REPLICA IDENTITY FULL;

-- 2) Helpers
CREATE OR REPLACE FUNCTION public.notify_users(
  _user_ids uuid[],
  _title text,
  _body text,
  _link text,
  _type text,
  _entity_type text,
  _entity_id uuid,
  _project_id uuid
) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.notifications (user_id, title, body, link, type, entity_type, entity_id, project_id)
  SELECT DISTINCT uid, _title, _body, _link, _type, _entity_type, _entity_id, _project_id
  FROM unnest(_user_ids) AS uid
  WHERE uid IS NOT NULL;
END;
$$;

CREATE OR REPLACE FUNCTION public.notify_project_roles(
  _project_id uuid,
  _roles project_member_role[],
  _exclude uuid,
  _title text,
  _body text,
  _link text,
  _type text,
  _entity_type text,
  _entity_id uuid
) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _ids uuid[];
BEGIN
  SELECT array_agg(user_id) INTO _ids
  FROM public.project_members
  WHERE project_id = _project_id
    AND role = ANY(_roles)
    AND (_exclude IS NULL OR user_id <> _exclude);
  IF _ids IS NOT NULL THEN
    PERFORM public.notify_users(_ids, _title, _body, _link, _type, _entity_type, _entity_id, _project_id);
  END IF;
END;
$$;

-- 3) Progress reports
CREATE OR REPLACE FUNCTION public.trg_notify_progress_reports()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _proj text;
  _link text;
BEGIN
  SELECT title INTO _proj FROM public.projects WHERE id = NEW.project_id;
  _link := '/projects/' || NEW.project_id::text;

  IF TG_OP = 'INSERT' THEN
    PERFORM public.notify_project_roles(
      NEW.project_id,
      ARRAY['manager','engineer']::project_member_role[],
      NEW.author_id,
      'New progress report submitted',
      'A report awaits your review on ' || COALESCE(_proj,'project'),
      _link, 'report_submitted', 'progress_report', NEW.id
    );
  ELSIF TG_OP = 'UPDATE' THEN
    IF NEW.status IS DISTINCT FROM OLD.status AND NEW.status IN ('approved','rejected') THEN
      PERFORM public.notify_users(ARRAY[NEW.author_id], 
        CASE WHEN NEW.status='approved' THEN 'Report approved' ELSE 'Report rejected' END,
        COALESCE(NEW.review_comment, 'Your report on ' || COALESCE(_proj,'project') || ' was ' || NEW.status),
        _link, 'report_' || NEW.status, 'progress_report', NEW.id, NEW.project_id);
    END IF;
    IF NEW.is_published = true AND COALESCE(OLD.is_published,false) = false AND NEW.status='approved' THEN
      PERFORM public.notify_project_roles(NEW.project_id, ARRAY['client']::project_member_role[], NULL,
        'New progress published', 'New progress published on ' || COALESCE(_proj,'your project'),
        '/portal', 'report_published', 'progress_report', NEW.id);
    END IF;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS notify_progress_reports ON public.progress_reports;
CREATE TRIGGER notify_progress_reports
AFTER INSERT OR UPDATE ON public.progress_reports
FOR EACH ROW EXECUTE FUNCTION public.trg_notify_progress_reports();

-- 4) Tasks
CREATE OR REPLACE FUNCTION public.trg_notify_tasks()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _proj text; _link text;
BEGIN
  SELECT title INTO _proj FROM public.projects WHERE id = NEW.project_id;
  _link := '/projects/' || NEW.project_id::text;
  IF TG_OP = 'INSERT' THEN
    PERFORM public.notify_users(ARRAY[NEW.assigned_to],
      'New task assigned: ' || NEW.title,
      'On ' || COALESCE(_proj,'project') || ' — priority ' || NEW.priority,
      _link, 'task_assigned', 'task', NEW.id, NEW.project_id);
  ELSIF TG_OP = 'UPDATE' AND NEW.status IS DISTINCT FROM OLD.status THEN
    PERFORM public.notify_users(ARRAY[NEW.created_by],
      'Task ' || NEW.status || ': ' || NEW.title,
      'Status changed by assignee on ' || COALESCE(_proj,'project'),
      _link, 'task_status', 'task', NEW.id, NEW.project_id);
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS notify_tasks ON public.tasks;
CREATE TRIGGER notify_tasks AFTER INSERT OR UPDATE ON public.tasks
FOR EACH ROW EXECUTE FUNCTION public.trg_notify_tasks();

-- 5) Milestones
CREATE OR REPLACE FUNCTION public.trg_notify_milestones()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _proj text; _link text;
BEGIN
  SELECT title INTO _proj FROM public.projects WHERE id = NEW.project_id;
  _link := '/projects/' || NEW.project_id::text;
  IF TG_OP = 'INSERT' THEN
    PERFORM public.notify_project_roles(NEW.project_id,
      ARRAY['manager','engineer','technician']::project_member_role[], NULL,
      'New milestone: ' || NEW.title, 'Added to ' || COALESCE(_proj,'project'),
      _link, 'milestone_created', 'milestone', NEW.id);
  ELSIF TG_OP = 'UPDATE' AND NEW.review_status = 'approved' AND OLD.review_status IS DISTINCT FROM 'approved' THEN
    PERFORM public.notify_project_roles(NEW.project_id, ARRAY['client']::project_member_role[], NULL,
      'Milestone published: ' || NEW.title, 'Now visible in your portal',
      '/portal', 'milestone_published', 'milestone', NEW.id);
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS notify_milestones ON public.milestones;
CREATE TRIGGER notify_milestones AFTER INSERT OR UPDATE ON public.milestones
FOR EACH ROW EXECUTE FUNCTION public.trg_notify_milestones();

-- 6) Sub-milestones
CREATE OR REPLACE FUNCTION public.trg_notify_sub_milestones()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _proj text; _link text;
BEGIN
  SELECT title INTO _proj FROM public.projects WHERE id = NEW.project_id;
  _link := '/projects/' || NEW.project_id::text;
  IF TG_OP = 'INSERT' THEN
    PERFORM public.notify_project_roles(NEW.project_id,
      ARRAY['manager','engineer','technician']::project_member_role[], NULL,
      'New sub-milestone: ' || NEW.title, 'Added to ' || COALESCE(_proj,'project'),
      _link, 'sub_milestone_created', 'sub_milestone', NEW.id);
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS notify_sub_milestones ON public.sub_milestones;
CREATE TRIGGER notify_sub_milestones AFTER INSERT ON public.sub_milestones
FOR EACH ROW EXECUTE FUNCTION public.trg_notify_sub_milestones();

-- 7) Media files
CREATE OR REPLACE FUNCTION public.trg_notify_media()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _proj text; _link text; _label text;
BEGIN
  SELECT title INTO _proj FROM public.projects WHERE id = NEW.project_id;
  _link := '/projects/' || NEW.project_id::text;
  _label := CASE WHEN NEW.mime_type LIKE 'image/%' THEN 'photo' ELSE 'document' END;
  IF TG_OP = 'INSERT' THEN
    PERFORM public.notify_project_roles(NEW.project_id,
      ARRAY['manager','engineer','technician']::project_member_role[], NEW.uploaded_by,
      'New ' || _label || ' uploaded',
      COALESCE(NEW.caption, 'A new file was added to ' || COALESCE(_proj,'project')),
      _link, 'media_uploaded', 'media_file', NEW.id);
  ELSIF TG_OP = 'UPDATE' AND NEW.is_published = true AND COALESCE(OLD.is_published,false) = false THEN
    PERFORM public.notify_project_roles(NEW.project_id, ARRAY['client']::project_member_role[], NULL,
      'New ' || _label || ' published',
      COALESCE(NEW.caption, 'A new ' || _label || ' is available in your portal'),
      '/portal', 'media_published', 'media_file', NEW.id);
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS notify_media ON public.media_files;
CREATE TRIGGER notify_media AFTER INSERT OR UPDATE ON public.media_files
FOR EACH ROW EXECUTE FUNCTION public.trg_notify_media();
