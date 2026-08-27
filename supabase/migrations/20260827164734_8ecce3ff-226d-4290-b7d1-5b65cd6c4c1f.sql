DO $$
DECLARE f record;
BEGIN
  FOR f IN
    SELECT p.oid::regprocedure AS sig
    FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND (p.proname LIKE 'trg\_%' OR p.proname IN (
        'log_audit','enforce_report_deadlines','notify_users','notify_project_roles',
        'recalc_milestone','recalc_project','recalc_sub_milestone','handle_new_user',
        'sync_milestone_publish','update_updated_at_column'))
  LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC, anon, authenticated', f.sig);
  END LOOP;
END $$;

CREATE EXTENSION IF NOT EXISTS pg_cron;

SELECT cron.unschedule('buildtrust-enforce-report-deadlines')
WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'buildtrust-enforce-report-deadlines');

SELECT cron.schedule(
  'buildtrust-enforce-report-deadlines',
  '*/15 * * * *',
  $$SELECT public.enforce_report_deadlines();$$
);