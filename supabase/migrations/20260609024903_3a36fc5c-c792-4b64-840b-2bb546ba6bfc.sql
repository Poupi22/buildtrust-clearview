CREATE TABLE public.translations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  en text NOT NULL,
  fr text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.translations TO anon, authenticated;
GRANT ALL ON public.translations TO authenticated;
GRANT ALL ON public.translations TO service_role;

ALTER TABLE public.translations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read translations"
  ON public.translations FOR SELECT
  USING (true);

CREATE POLICY "Super-admin manages translations insert"
  ON public.translations FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'super-admin'::app_role));

CREATE POLICY "Super-admin manages translations update"
  ON public.translations FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'super-admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'super-admin'::app_role));

CREATE POLICY "Super-admin manages translations delete"
  ON public.translations FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'super-admin'::app_role));

CREATE TRIGGER translations_updated_at
  BEFORE UPDATE ON public.translations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.user_preferences
  ADD COLUMN IF NOT EXISTS language text NOT NULL DEFAULT 'en';
