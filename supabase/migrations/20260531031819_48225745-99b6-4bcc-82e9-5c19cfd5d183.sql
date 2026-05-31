
-- Auto-publish media attached to a progress report when the report is approved & published
CREATE OR REPLACE FUNCTION public.trg_progress_reports_publish_media()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.status = 'approved' AND NEW.is_published = true THEN
    UPDATE public.media_files
       SET is_published = true
     WHERE progress_report_id = NEW.id
       AND is_published = false;
  ELSIF (NEW.status IS DISTINCT FROM 'approved') OR NEW.is_published = false THEN
    UPDATE public.media_files
       SET is_published = false
     WHERE progress_report_id = NEW.id
       AND is_published = true;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS progress_reports_publish_media ON public.progress_reports;
CREATE TRIGGER progress_reports_publish_media
AFTER INSERT OR UPDATE OF status, is_published ON public.progress_reports
FOR EACH ROW EXECUTE FUNCTION public.trg_progress_reports_publish_media();

-- Backfill: publish photos for already approved & published reports
UPDATE public.media_files mf
   SET is_published = true
  FROM public.progress_reports pr
 WHERE mf.progress_report_id = pr.id
   AND pr.status = 'approved'
   AND pr.is_published = true
   AND mf.is_published = false;
