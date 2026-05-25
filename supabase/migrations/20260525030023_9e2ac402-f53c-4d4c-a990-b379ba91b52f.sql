CREATE OR REPLACE FUNCTION public.trg_progress_reports_before_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _target numeric;
  _used numeric;
  _remaining numeric;
BEGIN
  SELECT target_quantity INTO _target FROM public.sub_milestones WHERE id = NEW.sub_milestone_id;
  IF _target IS NULL THEN
    RAISE EXCEPTION 'Sub-milestone not found';
  END IF;

  SELECT COALESCE(SUM(quantity), 0) INTO _used
    FROM public.progress_reports
    WHERE sub_milestone_id = NEW.sub_milestone_id
      AND status IN ('submitted', 'approved');

  _remaining := _target - _used;

  IF _remaining <= 0 THEN
    RAISE EXCEPTION 'Sub-milestone target already reached or pending — no remaining quantity to report';
  END IF;

  IF NEW.quantity > _remaining + 0.0001 THEN
    RAISE EXCEPTION 'Reported quantity (%) exceeds remaining quantity (%) for this sub-milestone', NEW.quantity, _remaining;
  END IF;

  RETURN NEW;
END;
$$;