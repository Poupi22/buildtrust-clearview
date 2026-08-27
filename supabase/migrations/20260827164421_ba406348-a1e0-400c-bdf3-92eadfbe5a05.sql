ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'project-lead';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'client-assistant';
ALTER TYPE public.project_member_role ADD VALUE IF NOT EXISTS 'project-lead';
ALTER TYPE public.project_member_role ADD VALUE IF NOT EXISTS 'client-assistant';