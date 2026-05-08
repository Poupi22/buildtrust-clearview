
-- New enum
DO $$ BEGIN
  CREATE TYPE public.milestone_review_status AS ENUM ('draft','pending_review','approved','rejected');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE public.milestones
  ADD COLUMN IF NOT EXISTS review_status public.milestone_review_status NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS submitted_at timestamptz,
  ADD COLUMN IF NOT EXISTS reviewed_at timestamptz,
  ADD COLUMN IF NOT EXISTS reviewed_by uuid,
  ADD COLUMN IF NOT EXISTS review_comment text;

-- Auto-publish on approval, unpublish on non-approval
CREATE OR REPLACE FUNCTION public.sync_milestone_publish()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.review_status = 'approved' THEN
    NEW.is_published := true;
    IF NEW.reviewed_at IS NULL THEN NEW.reviewed_at := now(); END IF;
  ELSIF NEW.review_status IN ('draft','pending_review','rejected') THEN
    NEW.is_published := false;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_milestone_publish ON public.milestones;
CREATE TRIGGER trg_sync_milestone_publish
BEFORE INSERT OR UPDATE OF review_status ON public.milestones
FOR EACH ROW EXECUTE FUNCTION public.sync_milestone_publish();
