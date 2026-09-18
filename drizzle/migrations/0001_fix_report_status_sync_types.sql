CREATE OR REPLACE FUNCTION public.sync_report_legacy_status()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  NEW.status := (CASE NEW.state::text
    WHEN 'pending' THEN 'draft'
    WHEN 'draft' THEN 'draft'
    WHEN 'submitted' THEN 'submitted'
    WHEN 'under_review' THEN 'under-review'
    WHEN 'approved' THEN (CASE WHEN COALESCE(NEW.is_published, false) THEN 'published' ELSE 'approved' END)
    WHEN 'archived' THEN 'approved'
    WHEN 'rejected' THEN 'rejected'
    WHEN 'absent' THEN 'rejected'
    ELSE NEW.status::text
  END)::report_status;

  IF NEW.state <> 'approved' THEN
    NEW.is_published := false;
  END IF;

  RETURN NEW;
END;
$function$;