
CREATE OR REPLACE FUNCTION public.recalc_milestone(_m uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _agg numeric;
BEGIN
  SELECT COALESCE(SUM(progress_pct * contribution_pct) / 100.0, 0)
    INTO _agg
    FROM public.sub_milestones WHERE milestone_id = _m;

  UPDATE public.milestones
    SET progress = ROUND(LEAST(100, COALESCE(_agg, 0)))::int,
        status = CASE WHEN _agg >= 100 THEN 'completed'::milestone_status
                      WHEN _agg > 0 THEN 'in-progress'::milestone_status
                      ELSE 'pending'::milestone_status END,
        updated_at = now()
    WHERE id = _m;
END;
$function$;

CREATE OR REPLACE FUNCTION public.recalc_project(_p uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _agg numeric;
BEGIN
  SELECT COALESCE(SUM(progress * contribution_pct) / 100.0, 0)
    INTO _agg
    FROM public.milestones WHERE project_id = _p;

  UPDATE public.projects
    SET completion = ROUND(LEAST(100, COALESCE(_agg, 0)))::int,
        updated_at = now()
    WHERE id = _p;
END;
$function$;

-- Recalculate everything with the new formula
DO $$
DECLARE r record;
BEGIN
  FOR r IN SELECT id FROM public.milestones LOOP
    PERFORM public.recalc_milestone(r.id);
  END LOOP;
  FOR r IN SELECT id FROM public.projects LOOP
    PERFORM public.recalc_project(r.id);
  END LOOP;
END $$;
