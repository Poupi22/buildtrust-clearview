
-- Create storage bucket for project media
INSERT INTO storage.buckets (id, name, public)
VALUES ('project-media', 'project-media', true)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for project-media bucket
CREATE POLICY "Project members can view media files"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'project-media'
  AND public.is_project_member(((storage.foldername(name))[1])::uuid, auth.uid())
);

CREATE POLICY "Public read for published media bucket"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'project-media');

CREATE POLICY "Engineers/managers upload to their projects"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'project-media'
  AND public.project_member_role(((storage.foldername(name))[1])::uuid, auth.uid())
      IN ('manager','engineer')
);

CREATE POLICY "Engineers/managers update their project media"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'project-media'
  AND public.project_member_role(((storage.foldername(name))[1])::uuid, auth.uid())
      IN ('manager','engineer')
);

CREATE POLICY "Engineers/managers delete their project media"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'project-media'
  AND public.project_member_role(((storage.foldername(name))[1])::uuid, auth.uid())
      IN ('manager','engineer')
);

-- Allow admins to view all project members for team management
CREATE POLICY "Admins view all project members"
ON public.project_members FOR SELECT
TO authenticated
USING (public.is_admin(auth.uid()));

-- Allow project members to see other members on their shared projects
CREATE POLICY "Members view co-members"
ON public.project_members FOR SELECT
TO authenticated
USING (public.is_project_member(project_id, auth.uid()));

-- Allow admins to view all profiles for assignment UI
CREATE POLICY "Admins view all profiles"
ON public.profiles FOR SELECT
TO authenticated
USING (public.is_admin(auth.uid()));
