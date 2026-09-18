-- 1. Milestone publication is a consequence of approval only
DROP TRIGGER IF EXISTS sync_milestone_publish ON public.milestones;
DROP TRIGGER IF EXISTS trg_sync_milestone_publish ON public.milestones;

CREATE OR REPLACE FUNCTION public.enforce_milestone_publication()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.review_status <> 'approved' THEN
      NEW.is_published := false;
    END IF;
    RETURN NEW;
  END IF;

  -- approval grants publication
  IF NEW.review_status = 'approved' AND OLD.review_status IS DISTINCT FROM 'approved' THEN
    NEW.is_published := true;
  END IF;

  -- losing approval removes publication
  IF NEW.review_status <> 'approved' THEN
    NEW.is_published := false;
  END IF;

  -- manual unpublish of an approved milestone reverts the approval too
  IF NEW.review_status = 'approved' AND OLD.is_published AND NOT COALESCE(NEW.is_published, false) THEN
    NEW.review_status := 'draft';
    NEW.is_published := false;
  END IF;

  -- publishing something never approved is rejected outright
  IF COALESCE(NEW.is_published, false) AND NEW.review_status <> 'approved' THEN
    RAISE EXCEPTION 'A milestone can only be published after approval';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_enforce_milestone_publication
BEFORE INSERT OR UPDATE ON public.milestones
FOR EACH ROW EXECUTE FUNCTION public.enforce_milestone_publication();

-- 2. daily_reports: `state` is the single source of truth, legacy `status` derived
CREATE OR REPLACE FUNCTION public.sync_report_legacy_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.status := CASE NEW.state
    WHEN 'pending' THEN 'draft'
    WHEN 'draft' THEN 'draft'
    WHEN 'submitted' THEN 'submitted'
    WHEN 'under_review' THEN 'under-review'
    WHEN 'approved' THEN (CASE WHEN COALESCE(NEW.is_published, false) THEN 'published' ELSE 'approved' END)
    WHEN 'archived' THEN 'approved'
    WHEN 'rejected' THEN 'rejected'
    WHEN 'absent' THEN 'rejected'
    ELSE NEW.status
  END::report_status;

  IF NEW.state <> 'approved' THEN
    NEW.is_published := false;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_sync_report_legacy_status
BEFORE INSERT OR UPDATE ON public.daily_reports
FOR EACH ROW EXECUTE FUNCTION public.sync_report_legacy_status();