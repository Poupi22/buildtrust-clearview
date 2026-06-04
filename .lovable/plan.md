# Technician Role, Portal & Admin User Management

## Goal
- Introduce a **technician** access level (field worker): can submit reports, edit their rejected reports, log basic actions — but cannot approve, publish, manage members, or delete project data.
- Give technicians a dedicated **/technician** portal (simplified, focused on "My tasks" + "Submit report").
- Let admins (super-admin / company-admin) create any user with role + assign them to projects with tasks.

## 1. Database changes (one migration)

- Extend `app_role` enum: add `technician`.
- Extend `project_member_role` enum: add `technician`.
- New table `tasks`:
  - `id`, `project_id`, `milestone_id` (nullable), `sub_milestone_id` (nullable), `assigned_to` (uuid → auth user), `title`, `description`, `due_date`, `status` (`todo` | `in_progress` | `done` | `blocked`), `created_by`, timestamps.
  - GRANT + RLS:
    - Admins of the project (`is_admin` or `manager` member) can full CRUD.
    - The assignee can read their tasks and update only `status`.
- Update `handle_new_user()` to honor `technician` role from metadata.
- Update RLS on `progress_reports`:
  - Technicians (member with role `technician` OR `engineer`) can `INSERT` reports as `submitted` and `UPDATE` only their own reports while status is `draft` or `rejected`.
  - Approving / publishing remains admin/manager only.

## 2. Edge function — `create-user` (new)

Admin-only. Input: `email`, `full_name`, `role` (any app_role), optional `project_id` + `project_role`, optional `password`.
- Verifies caller is super-admin or company-admin via JWT.
- Creates auth user (auto-confirmed), assigns role in `user_roles`, optionally adds to `project_members`.
- Returns temp password to display once. Reuses pattern from `invite-client`.

## 3. Frontend

### Routing (`src/App.tsx`)
- Add `role === "technician"` branch → renders only `<TechnicianPortal />` at `/technician`, redirects everything else there.

### New pages / components
- `src/pages/TechnicianPortal.tsx`: mobile-first dashboard with:
  - Header (project picker if assigned to multiple), profile + sign out.
  - "My tasks" list (from `tasks` where `assigned_to = me`) with status toggle.
  - "My recent reports" with status badges (draft/submitted/approved/rejected) and an "Edit & resubmit" action for rejected.
  - Big primary CTA: **Submit progress report** (reuses existing `SubmitProgressReportDialog`).
- `src/components/dialogs/CreateUserDialog.tsx`: admin form (email, full name, role select incl. technician, optional project assignment + project role). Calls `create-user` edge function. Shows generated credentials once.
- `src/components/dialogs/AssignTaskDialog.tsx`: pick assignee (project members), milestone/sub-milestone, title, due date.

### Updated pages
- `src/pages/Team.tsx`: add **"Create user"** button (admins only) opening `CreateUserDialog`; add `technician` option in `AddMemberDialog`.
- `src/pages/ProjectDetail.tsx`: new **Tasks** section listing project tasks with an **"Assign task"** button for admins/managers.
- `useBuildTrust.ts`: add hooks `useTasks(projectId)`, `useMyTasks()`, `useCreateTask`, `useUpdateTaskStatus`; permission helper `canApprove` (admin/manager only).
- Hide approve/publish buttons and Approvals nav item for technicians (already non-applicable since they get a separate portal, but also guard in shared dialogs).

## Technical notes
- Keep `verify_jwt = true` for `create-user` in `supabase/config.toml`.
- `engineer` role is preserved; existing engineers keep full dashboard access. `technician` is the new restricted field role.
- All new colors/spacing reuse existing semantic tokens — no hard-coded colors.
- Task status updates by technicians limited via RLS using `assigned_to = auth.uid()` and column-level: enforced by a trigger that rejects changes to columns other than `status`/`updated_at` when caller isn't admin/manager.

## Out of scope
- Notifications/emails on task assignment (can follow later).
- Time tracking / hours logging.
