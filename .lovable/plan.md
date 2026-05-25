## Goal
Extend BuildTrust with a hierarchical progress model: Project → Milestone → Sub-Milestone → Progress Reports, with automatic percentage rollup, technician/engineer approval workflow, and client visibility for approved/published work.

## Data model changes (migration)

New tables:

- **`sub_milestones`** — belongs to a milestone
  - `milestone_id`, `project_id`, `title`, `unit` (text: m², m³, ml, unit, FF, …), `target_quantity` (numeric), `contribution_pct` (numeric, % of parent milestone), `ordering`, `status` (pending/in-progress/completed), `completed_quantity` (numeric, cached), `progress_pct` (numeric, cached 0–100), `is_published`.
  - Constraint: sum of `contribution_pct` per milestone ≤ 100 (enforced via trigger, soft warning if <100).

- **`progress_reports`** — technician submissions against a sub-milestone
  - `sub_milestone_id`, `project_id`, `author_id`, `quantity` (numeric, work done in this report), `description` (text), `report_date`, `status` (submitted/approved/rejected), `review_comment`, `reviewed_by`, `reviewed_at`, `is_published`.
  - Linked photos via existing `media_files` (add nullable `progress_report_id` column).

Add columns:
- `milestones.contribution_pct` (numeric, % of project) — drives project rollup.
- `media_files.progress_report_id` (uuid, nullable).

Triggers / functions:
- `recalc_sub_milestone(sub_id)` — sums approved report quantities, updates `completed_quantity`, `progress_pct = min(100, sum/target*100)`, sets `status='completed'` at 100%.
- `recalc_milestone(milestone_id)` — weighted avg of sub-milestone `progress_pct × contribution_pct / 100`, updates `milestones.progress`.
- `recalc_project(project_id)` — weighted avg using `milestones.contribution_pct`, updates `projects.completion`.
- AFTER INSERT/UPDATE/DELETE on `progress_reports` (when status=approved) → cascade recalcs.
- BEFORE INSERT on `progress_reports`: reject if parent sub-milestone already at 100%.

RLS:
- `sub_milestones`: managers/engineers manage on their projects; clients see only `is_published=true`; admins all.
- `progress_reports`: technicians (engineers) insert/update own when `status in (draft,submitted,rejected)`; managers approve/reject; clients see only `status=approved AND is_published=true`.

## Backend hooks (`src/hooks/useBuildTrust.ts`)

Add:
- `useSubMilestones(milestoneId|projectId)`, `useCreateSubMilestone`, `useUpdateSubMilestone`, `useDeleteSubMilestone`
- `useProgressReports(filters)`, `useCreateProgressReport`, `useReviewProgressReport (approve/reject)`, `usePublishProgressReport`, `useResubmitProgressReport`, `useDeleteProgressReport`

## UI

**Engineer / Manager**

- **Milestone detail panel** (in `ProjectDetail.tsx`): add "Sub-milestones" section with list showing title, unit, target, completed, %, contribution. Buttons: New sub-milestone, Edit, Delete (locked when completed).
- **New `NewSubMilestoneDialog`**: title, unit (select), target_quantity, contribution_pct (with live "remaining %" indicator for parent milestone).
- **New `SubmitProgressReportDialog`** (technician flow): pick sub-milestone, quantity completed (with target & remaining shown), description, photo upload, submit. Block if sub at 100%.
- **Approvals page**: new section "Progress Reports" with quantity, evidence preview, Approve / Reject (with comment), and Publish toggle after approval.
- **My Reports view** (technician): list of own reports with status badges; rejected ones get Edit/Resubmit/Delete.

**Client Portal**

- Project completion % (live from `projects.completion`).
- Milestones list with progress bars (only `is_published` ones).
- Sub-milestone breakdown per milestone (published only) showing % and target/completed.
- Feed of published approved progress reports with photos, dates, descriptions.

## Calculation summary

```text
sub.progress_pct   = min(100, sum(approved.quantity) / sub.target_quantity * 100)
milestone.progress = Σ (sub.progress_pct × sub.contribution_pct) / 100
project.completion = Σ (milestone.progress × milestone.contribution_pct) / 100
```

## Out of scope (can be follow-ups)
- Re-allocating contribution % after work has started (allowed but warns).
- Multi-tenant company-level reporting changes.
- Editing approved reports (must reject first).

## Files touched

- `supabase/migrations/<new>.sql` (schema + triggers + RLS)
- `src/hooks/useBuildTrust.ts` (new hooks)
- `src/pages/ProjectDetail.tsx` (sub-milestone section)
- `src/pages/Approvals.tsx` (progress reports section)
- `src/pages/ClientPortal.tsx` (sub-milestone breakdown + feed)
- `src/pages/Reports.tsx` (technician progress reports list)
- `src/components/dialogs/NewSubMilestoneDialog.tsx` (new)
- `src/components/dialogs/SubmitProgressReportDialog.tsx` (new)
- `src/components/dialogs/NewMilestoneDialog.tsx` (add `contribution_pct` field)

Ready to implement on approval.