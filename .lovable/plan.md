# BuildTrust — Cleanup: one process per action

An audit of the whole app found that several actions can be done in more than one place, and each place saves things slightly differently. Nothing is lost today, but the records end up inconsistent, which is not acceptable for a system meant to prove what happened on site. This plan removes the duplicates and leaves exactly one way to do each thing.

## What is wrong today

1. **Approving a report happens in two places, with two different results.**
   From the Reports page, approving a weekly report publishes it but records no reviewer, no signature and no decision history. From the Approvals page, the same action records everything. So the audit trail depends on which button the person happened to use.

2. **A milestone can be shown to the client without ever being approved.**
   The project page has a "Publish / Unpublish" switch that bypasses the approval workflow completely. (Checked the live data: no milestone is currently in that bad state — so this is a rule to close, not damage to repair.)

3. **Two status fields on every report.**
   Each report carries an old status and a newer state. Both are written by hand in the code and can drift apart. Two pages already count the same figures from different fields, so Compliance and Reports can disagree.

4. **Progress approval is built twice.**
   The same approve/reject buttons and dialog exist on both the Approvals page and inside the project page.

5. **Permissions are judged differently per page.**
   Some screens check the person's role on the specific project; others check only their overall role. Result: buttons appear that the system then refuses, and newer roles (project lead, client assistant) fall through to the full admin screen.

6. **Unused leftovers.** A report-history table that nothing ever writes to, and a second set of start/end date fields on milestones that no screen reads.

## What I will change

**One approval path.** All report decisions — approve, reject, request revision, publish — go through a single routine that always writes the decision, the reviewer, the signature and the history entry, and always keeps the report's state consistent. The Reports page loses its separate shortcut and calls the same routine. Weekly reports become visible to the client only as a result of approval, never as an independent toggle.

**One publication rule for milestones.** Publishing is the consequence of approval. The manual publish switch is removed from the project page; unpublishing stays available to admins but reverts the approval state with it, so the two can never disagree. A database guard rejects any attempt to publish something unapproved.

**One status per report.** The newer state field becomes the only one the app reads and writes; the old status field is kept in step automatically by the database for records already saved, so nothing breaks, and all pages (Reports, Approvals, Compliance, portals) count from the same field.

**One review component.** A single shared review panel — details, history, approve / reject / comment — reused by the Approvals page, the Reports page and the project page, instead of three near-identical versions.

**One permission rule.** A single shared check answers "can this person manage this project?", combining their overall role and their role on that specific project, matching exactly what the database allows. Every page uses it. Project leads and client assistants get the correct restricted view instead of the admin dashboard.

**Report history actually recorded.** Every submission and every decision writes a snapshot, so the journal can show who changed what and when.

**Remove the leftovers.** Stop using the unused milestone date fields (no data is deleted), and align the duplicated planning tables so the baseline plan and the weekly plan are clearly labelled as what they are.

## What stays the same

The workflow itself, the Journal de Chantier format, the PDF, the client portal, the technician portal and all existing data. This is a consolidation, not a redesign — nobody loses a feature, some just move to a single home.

## Technical notes

- Merge `usePublishWeeklyReport` into `useReviewReport`; single mutation writing `daily_reports.state`, `is_published`, `report_approvals`, `report_versions` snapshot and `audit_log`; legacy `status` kept in sync by trigger.
- Trigger on `milestones`: recompute `is_published` from `review_status` on any update; reject `is_published = true` when `review_status <> 'approved'`. Remove `onTogglePublish` for milestones in `ProjectDetail.tsx`.
- New `src/components/review/ReviewPanel.tsx` parameterised by entity type; used by `Approvals.tsx`, `Reports.tsx`, `ProjectDetail.tsx`; delete the duplicated blocks and the one-off milestone dialog.
- New `useCanManageProject(projectId)` / `useProjectPermissions` in `useBuildTrust.ts`, mirroring `can_manage_project()` SQL. Replace inline role arrays in `Reports.tsx`, `Planning.tsx`, `Compliance.tsx`, `ProjectDetail.tsx`.
- `App.tsx`: explicit routing for `project-lead` (field view) and `client-assistant` (client portal, read+comment).
- Shared query-key factory; drop `as any` where generated types already cover the table; regenerate types.
- Compliance/report KPIs read `state` only.
- Delivered in four steps, each independently shippable: (1) approval consolidation + milestone guard, (2) shared review panel, (3) permissions unification + routing, (4) cleanup of dead fields and query keys.
