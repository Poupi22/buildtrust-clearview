ALTER TABLE public.daily_reports ADD COLUMN IF NOT EXISTS review_comment text;
NOTIFY pgrst, 'reload schema';