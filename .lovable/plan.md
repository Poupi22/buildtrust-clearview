# BuildTrust — Planning-Driven Execution Control Upgrade

Only one official template was supplied: **Journal de Chantier (MOUBARAKA)** — it defines the Daily Report. No weekly template was provided, so the Weekly Report will be built from your section-10 field list and will reuse the daily template's terminology. Send the weekly template and I will align it.

## 1. Current-system assumptions

- Existing: `projects`, `milestones` (steps), `sub_milestones` (sub-steps), `progress_reports` (quantity evidence), `daily_reports` (already holds daily + weekly via `report_type`), `media_files`, `report_issues`, `approvals`, `audit_log`, `notifications`, `project_members`, `user_roles`, `user_preferences.approval_signature`, `companies`, `company_settings`, `translations`.
- Roles today: super-admin, company-admin, engineer, client, technician. Missing: **project-lead**, **client-assistant**.
- No baseline plan, no weekly work plan, no reporting obligations, no server deadline engine, no report versioning, no document versioning, no comments.
- Reporting is currently voluntary and quantity-driven; nothing enforces "what was planned".

## 2. Refined architecture (one workflow, no parallel modules)

```text
Baseline Plan (versioned, Super-Admin activated)
        |
Weekly Work Plan (week, locked working days, planned activities -> steps/sub-steps)
        |            \
Daily Report Obligation (per working day)   Weekly Report Obligation (per week)
        |                                        |
Daily Report (Journal de Chantier template)  Weekly Report (auto-aggregated from dailies)
        |                                        |
     Review / Approval + signature snapshot -----+
        |
Client & Client-Assistant visibility  ->  Project Journal (PDF)
```

`daily_reports` is **evolved**, not replaced: it becomes the report table for both types, linked to an obligation, versioned, signature-stamped. `progress_reports` stays as the quantity/evidence record and gets linked to daily reports instead of being a competing report system.

## 3. Role / permission matrix (summary)

| Action | Super Admin | Company Mgr | PM/Engineer | Project Lead | Technician | Client | Client Assistant |
|---|---|---|---|---|---|---|---|
| Submit baseline plan (draft) | Y | Y | Y | – | – | – | – |
| Activate / archive baseline version | **Y only** | – | – | – | – | – | – |
| Create/activate Weekly Work Plan | Y | Y | Y | – | – | – | – |
| Submit Daily Report | Y | – | Y | Y | Y | – | – |
| Submit Weekly Report | Y | – | Y | Y | – | – | – |
| Review / approve reports | Y | Y (if configured) | Y | – | – | – | – |
| Manual progress override (reason required) | Y | Y | Y | – | – | – | – |
| View approved reports & plans | Y | Y | Y | Y | Y | Y | Y |
| Comment on reports | Y | Y | Y | Y | Y | Y | Y |
| Upload client documents | Y | Y | Y | – | – | Y | Y |
| Invite Client Assistant | Y | Y | – | – | – | Y | – |
| Delete audit / absence records | **nobody** | – | – | – | – | – | – |

## 4. Database changes

New enums: `plan_status`, `weekly_plan_status`, `obligation_status`, `report_state`, `weekly_cycle_status`, `activity_status`; extend `app_role` and `project_member_role` with `project-lead`, `client-assistant`.

New tables (all with GRANTs + RLS):
- `project_plans` / `project_plan_versions` — version no, period, planned start/end, file, submitted_by, reason for revision, previous version, activated/archived at, admin note. One ACTIVE per project (partial unique index).
- `plan_activities` — activity, milestone/sub-milestone link, planned dates, dependency.
- `weekly_work_plans` — project, week no, start/end, plan version, status, created_by, activation timestamp.
- `weekly_work_days` — one row per selected day, locked flag, exception records.
- `planned_activities` — per day: activity, step/sub-step, responsible member, planned quantity, expected outcome.
- `daily_report_obligations`, `weekly_report_obligations` — due_at (server, project TZ), status Pending/Submitted/Approved/Absent, resolved_at.
- `report_versions` — immutable snapshots, revision no, links to previous.
- `report_approvals` — reviewer, decision, reason, signature snapshot, timestamps.
- `signature_profiles` — image/initials, version, registered_at; approvals store the version used.
- `project_documents` / `document_versions` — title, category, uploader role, visibility, version chain.
- `report_comments` / `project_comments` — author, role, timestamp, target.
- `client_assistant_access` — client, assistant, project, active flag.
- `compliance_events` — immutable absence/void records.

Changed tables:
- `projects`: `timezone` (default `Africa/Douala`-style, configurable), `active_plan_version_id`, `execution_enabled`.
- `daily_reports`: `obligation_id`, `weekly_work_plan_id`, `plan_version_id`, `state` (new state machine), `revision`, `submitted_at_server`, `signature_snapshot`, plus **Journal de Chantier fields** (see §5).
- `milestones`/`sub_milestones`: `planned_start`, `planned_end`, `actual_start`, `actual_end`, `manual_override_reason`.
- `audit_log`: `role`, `company_id`, `project_id`, `old_value`, `new_value`, `reason`; DELETE/UPDATE revoked for all roles.

## 5. Daily Report = Journal de Chantier (official structure preserved)

Header: Chantier (project), Date, Temps (weather), Horaire de travail (de … à …), Entreprise, Mission de contrôle.
- **PERSONNEL**: rows of `Poste` + `Nombre` (JSONB array).
- **MATERIEL**: rows of `Désignation` + Utilisation (`Marche` / `Immobilisé` / `Panne`).
- **TRAVAUX RÉALISÉS**: rows of `Désignation` + `Observations`, each linkable to a planned activity and step/sub-step.
- **CONSOMMATION MATÉRIAUX**: `Désignation`, `Stock matin`, `Approvisionnement`, `Consommé`, `Stock soir`.
- **Instructions du Maître de l'Ouvrage**, **Instructions de la Mission de Contrôle**.
- **Visas**: Visa de l'Entreprise / de la Mission de Contrôle / du Maître de l'Ouvrage — mapped to signature-stamped approvals.
French labels kept as the primary terminology, with EN translations through the existing i18n table.

## 6. State machines

- Plan version: `Draft → Submitted → Active → Archived` (Active↔Archived only by Super Admin; no delete).
- Weekly Work Plan: `Draft → Submitted → Active → Closed` / `Void`. Working days locked at Active; changes only via exception records.
- Report: `Pending → Draft → Submitted → Under Review → Approved | Rejected`; `Pending → Absent` (deadline engine, terminal). Rejected → new revision. Approved → immutable + `Archived`.
- Weekly cycle: `Open → Compliant | Non-Compliant | Void`.

## 7. Deadline engine (server-side, idempotent)

- pg_cron job every 15 min; a SQL function evaluates obligations whose `due_at` (computed as 23:59:59 in `projects.timezone`) has passed and no valid submission exists → set `Absent`, mark the workday `UNWORKED/UNREPORTED`, write `compliance_events` + `audit_log`, notify reporter + PM. Unique key on (obligation) prevents duplicates.
- Weekly deadline = 23:59:59 of the **last scheduled working day** of that weekly plan.
- Submission uses `now()` server time; a submit attempt after `due_at` is rejected — it can only be filed as a late explanatory attachment, never overwriting Absent.

## 8. Client & assistant

Client portal gains: baseline plan (active + archived history), current Weekly Work Plan, approved daily/weekly reports, evidence, documents with version history, comments, notifications, and **invite Client Assistant / Architect** (edge function, project-scoped, activate/deactivate). Assistant is read + comment only, enforced by RLS.

## 9. Journal & analytics

- Project Journal: chronological view over plans, weekly plans, working days, reports, absences, quantities, media, approvals, comments, documents — filters by date range, week, phase, step, reporter, type, status.
- PDF: logo, project/client/company/location, period, plan version, chronological entries, photos, signatures, page numbers, generation timestamp, unique journal reference.
- Planned-vs-actual view + compliance dashboard (daily/weekly compliance %, absences, variance days, weekly completion rate) filterable by company, project, engineer, technician, date range.

## 10. Conflicts with existing functionality & migration strategy

- Existing `daily_reports` rows are backfilled: `state` derived from current `status`, no obligation link (legacy flag), so history stays intact.
- Existing projects get a **provisional plan version V0 (Active)** so execution isn't blocked; Super Admin replaces it with the real baseline.
- Weekly obligations only start for weeks that have a Weekly Work Plan — no retroactive absences on historical data.
- `Approvals` page merges plan/report/weekly approvals into one queue (no second approval module). The current progress-report approval stays but moves under the same state machine.

## 11. Delivery phases

1. Plan versioning + locking, signatures, roles/permissions, hardened audit trail.
2. Weekly Work Plan, working-day selection & locking, planned activities.
3. Obligations, deadline engine, Journal-de-Chantier daily report, weekly report auto-aggregation, versioning, approval workflow.
4. Client Assistant, client documents + versions, comments, notifications.
5. Project Journal, PDF, compliance dashboard, planned-vs-actual analytics.

Each phase ships as its own migration + UI, so the app stays usable throughout.
