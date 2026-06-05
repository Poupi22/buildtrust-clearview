DROP POLICY IF EXISTS "Users create own projects" ON public.projects;
DROP POLICY IF EXISTS "Creators update own projects" ON public.projects;

CREATE POLICY "Admins create projects" ON public.projects
  FOR INSERT TO authenticated
  WITH CHECK (public.is_admin(auth.uid()) AND created_by = auth.uid());

CREATE POLICY "Admins update projects" ON public.projects
  FOR UPDATE TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));