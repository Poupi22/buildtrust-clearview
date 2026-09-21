# BuildTrust App

Using the following, extract the most appropriate information to build a mobile app named BuildTrust with the following slogan:Slogan: "Building Structures. Building Trust" and the attached Logo

Act as a senior product manager, civil engineering domain analyst, solution architect, UI/UX designer, mobile engineer, backend engineer, database architect, DevOps engineer, and QA lead.

Your task is to design and build a production-ready application called **BuildTrust**.

==================================================

1. APP CONTEXT

==================================================

BuildTrust is a digital platform for **civil engineering and construction companies** to improve **client trust, transparency, and communication** during project execution.

The main purpose of the app is to allow a construction or civil engineering company to show the client the real progress of their project through structured follow-up, reports, photos, milestones, documents, and notifications.

The app should work as a **client trust and project transparency platform**.

It must help civil engineering companies:

- document project execution professionally

- share real project progress with clients

- reduce misunderstandings

- improve client satisfaction

- centralize project monitoring

- create auditable work reports

The system should support both **internal project management follow-up** and **external client visibility**.

==================================================

2. BUSINESS PROBLEM TO SOLVE

==================================================

In many civil engineering projects, clients often complain about:

- lack of visibility into project progress

- poor communication from contractors

- uncertainty about what has been completed

- limited evidence of work done

- no centralized history of reports, photos, or site activities

- delays being communicated late or poorly

- inability to track milestones clearly

These issues reduce trust even when the technical work is correct.

BuildTrust must solve this by creating a transparent, structured, and professional digital reporting system between engineering teams and clients.

==================================================

3. PRIMARY GOAL

==================================================

Design a complete platform that allows:

- engineers and site teams to report project progress

- project managers to supervise and validate updates

- clients to follow their project in real time

- management to generate reports and demonstrate accountability

The app must be clear, professional, mobile-first, and suitable for real construction environments.

==================================================

4. USER TYPES

==================================================

The system should support at least the following roles:

1. SUPER ADMIN

- full system access

- company-level settings

- manage all users

- manage subscriptions if needed

- manage all projects

- manage global templates and report types

- full dashboards and analytics

2. COMPANY ADMIN / PROJECT DIRECTOR

- manage company users

- create and manage projects

- assign staff to projects

- view all project reports

- approve or reject submitted updates

- manage client access

- view budgets if enabled

- generate all project and company reports

3. ENGINEER / SITE SUPERVISOR

- update project progress

- submit site reports

- upload photos/videos

- update milestones

- report issues, delays, and risks

- upload technical documents

- record work completed

- propose next tasks

4. CLIENT

- view assigned project only

- view project dashboard

- see approved progress updates

- see milestone status

- access selected reports and photos

- receive notifications

- comment or acknowledge updates if enabled

- download project summaries if allowed

5. OPTIONAL: ACCOUNTANT / QS / TECHNICAL OFFICER

- view financial summaries if authorized

- upload payment certificates / BOQ updates / valuation documents

- support reporting workflows

==================================================

5. CORE MODULES

==================================================

Build the system with the following modules:

1. Authentication and authorization

2. Company and user management

3. Client management

4. Project management

5. Project stage / milestone management

6. Daily / weekly / milestone reporting

7. Site photo and media documentation

8. Issue, delay, and risk tracking

9. Task / activity tracking

10. Document management

11. Progress dashboard

12. Notification system

13. Client portal

14. PDF report generation

15. Analytics and summaries

16. Audit logs and approvals

17. Settings and templates

==================================================

6. KEY USE CASES

==================================================

The system must support these important scenarios:

A. A company creates a new civil engineering project

B. A client is linked to the project

C. Engineers submit daily or weekly updates from site

D. Project manager reviews and approves updates

E. Client sees approved updates in a transparent dashboard

F. Photos are uploaded as proof of progress

G. Delays or issues are logged with cause and action plan

H. Milestones are updated as project phases are completed

I. Reports are exported as PDF for meetings or formal submission

J. Client receives notifications when key updates are published

==================================================

7. PROJECT DATA MODEL

==================================================

Design the application around a project-centric model.

Each project should have data such as:

- project id

- project title

- project code

- client id

- company id

- project type

- location

- start date

- planned end date

- actual end date

- contract value optional

- project description

- status

- current phase

- overall completion percentage

- assigned engineers/supervisors

- created_at

- updated_at

Possible project types:

- residential construction

- commercial building

- road works

- drainage works

- bridge works

- renovation

- foundation works

- structural works

- finishing works

- infrastructure project

==================================================

8. PROJECT STAGES / MILESTONES

==================================================

Support milestone-based tracking.

Examples:

- mobilization completed

- site clearing completed

- excavation completed

- foundation completed

- substructure completed

- superstructure completed

- roofing completed

- electrical rough-in completed

- plumbing rough-in completed

- plastering completed

- finishing completed

- external works completed

- handover completed

Each milestone should include:

- id

- project_id

- title

- description

- planned_date

- actual_date

- status

- progress_percentage

- evidence_media_count

- notes

- approved_by

- approved_at

==================================================

9. REPORTING WORKFLOWS

==================================================

The platform must support multiple report types.

A. DAILY SITE REPORT

Fields may include:

- date

- weather

- workforce on site

- tasks completed

- materials used

- equipment used

- issues encountered

- safety incidents

- photos

- next planned work

- author

- approval status

B. WEEKLY PROGRESS REPORT

Fields may include:

- week start and end

- summary of work done

- percentage progress

- key achievements

- challenges

- delays and causes

- mitigation actions

- photos

- next week plan

- prepared by

- approved by

C. MILESTONE REPORT

Fields may include:

- milestone name

- completion date

- description of completed work

- evidence

- approvals

- client-facing notes

D. ISSUE / DELAY REPORT

Fields may include:

- issue type

- severity

- description

- date identified

- impact on schedule/cost/quality

- responsible party

- corrective action

- status

==================================================

10. CLIENT TRUST FEATURES

==================================================

This part is critical.

The platform must specifically enhance trust through:

- clear project dashboard

- project completion percentage

- verified and timestamped updates

- before/after site photos

- milestone visibility

- delay transparency

- structured explanations of issues

- downloadable reports

- notification of major changes

- approval workflow so only validated information reaches client

- audit trail of who posted what and when

The product is not just a project management app.

It is a **trust-building transparency platform for construction clients**.

==================================================

11. DASHBOARDS

==================================================

Create role-specific dashboards.

A. CLIENT DASHBOARD

- project overview

- current progress %

- latest approved update

- milestone tracker

- recent site photos

- project timeline

- issues/delays summary

- next planned activity

- downloadable reports

- notifications

B. ENGINEER DASHBOARD

- assigned projects

- pending reports to submit

- overdue updates

- today’s tasks

- recent issues

- milestone status

- upload shortcuts

C. PROJECT MANAGER DASHBOARD

- all active projects

- delayed projects

- pending approvals

- latest site activity

- milestone completion trends

- risk alerts

- report generation shortcut

D. COMPANY ADMIN DASHBOARD

- total projects

- active projects

- completed projects

- delayed projects

- client engagement summary

- staff activity summary

- most active sites

- reporting compliance rate

==================================================

12. DOCUMENT AND MEDIA MANAGEMENT

==================================================

Support upload and organization of:

- project photos

- videos

- engineering drawings

- technical reports

- permits

- BOQ/estimates if allowed

- inspection reports

- safety reports

- milestone certificates

For every file:

- store metadata

- uploader

- project association

- upload date

- category

- visibility level (internal only / client-visible)

==================================================

13. APPROVAL AND PUBLISHING MODEL

==================================================

Important requirement:

Not every site update should automatically be visible to the client.

Design workflow such as:

- Draft

- Submitted

- Under Review

- Approved

- Rejected

- Published to Client

A site engineer submits an update.

A project manager or admin reviews it.

Once approved/published, the client can see it.

This preserves professionalism and data quality.

==================================================

14. NOTIFICATION SYSTEM

==================================================

Support notifications for:

- new approved report published

- milestone achieved

- issue or delay reported

- document uploaded

- client comment received

- report rejected and needs correction

- project nearing deadline

- overdue report reminder

Channels can include:

- in-app notifications

- email notifications

- optional SMS / WhatsApp integration later

==================================================

15. FINANCIAL / COMMERCIAL OPTIONAL MODULE

==================================================

Design the system so that finance-related features can be optional.

Possible optional financial fields:

- contract amount

- certified work amount

- invoice status

- payment certificate

- retention

- outstanding payment

These may be visible only to internal users or selected clients.

Make the architecture modular so this feature can be enabled later.

==================================================

16. CORE DATABASE TABLES

==================================================

Design a relational database schema using PostgreSQL.

Suggested core tables:

- companies

- users

- roles

- clients

- projects

- project_team_members

- project_stages

- project_milestones

- daily_reports

- weekly_reports

- milestone_reports

- issues

- tasks

- project_documents

- media_files

- notifications

- comments

- approvals

- audit_logs

- settings

- report_templates

For each table provide:

- columns

- data types

- primary keys

- foreign keys

- indexes

- validation constraints

==================================================

17. API DESIGN

==================================================

Design a production-ready REST API.

Examples:

AUTH

- POST /auth/login

- POST /auth/logout

- POST /auth/refresh-token

- POST /auth/forgot-password

COMPANIES

- GET /companies

- POST /companies

- GET /companies/:id

- PATCH /companies/:id

USERS

- GET /users

- POST /users

- GET /users/:id

- PATCH /users/:id

- DELETE /users/:id

CLIENTS

- GET /clients

- POST /clients

- GET /clients/:id

- PATCH /clients/:id

PROJECTS

- GET /projects

- POST /projects

- GET /projects/:id

- PATCH /projects/:id

- GET /projects/:id/dashboard

- POST /projects/:id/assign-team

- POST /projects/:id/assign-client

MILESTONES

- GET /projects/:id/milestones

- POST /projects/:id/milestones

- PATCH /milestones/:id

- POST /milestones/:id/approve

REPORTS

- GET /projects/:id/daily-reports

- POST /projects/:id/daily-reports

- GET /projects/:id/weekly-reports

- POST /projects/:id/weekly-reports

- GET /projects/:id/milestone-reports

- POST /projects/:id/milestone-reports

ISSUES

- GET /projects/:id/issues

- POST /projects/:id/issues

- PATCH /issues/:id

MEDIA

- POST /projects/:id/media

- GET /projects/:id/media

- DELETE /media/:id

DOCUMENTS

- POST /projects/:id/documents

- GET /projects/:id/documents

APPROVALS

- POST /reports/:id/submit

- POST /reports/:id/approve

- POST /reports/:id/reject

- POST /reports/:id/publish

COMMENTS

- GET /projects/:id/comments

- POST /projects/:id/comments

NOTIFICATIONS

- GET /notifications

- PATCH /notifications/:id/read

PDF REPORTS

- GET /projects/:id/export/summary-pdf

- GET /projects/:id/export/weekly-report-pdf

- GET /projects/:id/export/milestone-pdf

- GET /projects/:id/export/client-progress-pdf

For each endpoint provide:

- purpose

- request body

- validation rules

- access control

- response format

- error cases

==================================================

18. MOBILE APP / WEB APP UX REQUIREMENTS

==================================================

The system should be mobile-first because engineers and supervisors often work on site.

Recommend:

- mobile app for engineers/site supervisors

- client web portal or mobile app for clients

- web admin panel for managers/admins

Design screens such as:

AUTH

- splash

- login

- forgot password

PROJECTS

- projects list

- project detail

- project dashboard

- project timeline

- milestone tracker

REPORTS

- create daily report

- create weekly report

- report details

- draft reports

- pending approval reports

MEDIA

- upload site photos

- media gallery

- photo timeline

ISSUES

- issue list

- issue detail

- create issue

- corrective action update

CLIENT VIEW

- client dashboard

- milestone progress

- approved report history

- project photo feed

- download reports

ADMIN VIEW

- approval queue

- user management

- analytics dashboard

- company settings

- report templates

UI expectations:

- clean

- professional

- easy to navigate

- low learning curve

- optimized for field usage

- support weak network conditions

- draft save if network drops

- structured forms with validation

==================================================

19. BUSINESS RULES

==================================================

Do not miss these rules:

1. Every project belongs to a company.

2. Every project can have one or more internal team members.

3. A project must be linked to at least one client contact.

4. Engineers can create reports, but client visibility depends on approval/publish workflow.

5. Every update visible to clients must be timestamped and attributable.

6. Progress percentage must be controlled to avoid inconsistent values.

7. Milestone completion should affect project progress.

8. Rejected reports should keep revision history.

9. All important actions should be logged in audit trails.

10. Sensitive documents may be internal-only.

11. Delays must allow recording of reason, impact, and mitigation.

12. Reports and media should be filterable by date and project stage.

==================================================

20. CALCULATION LOGIC

==================================================

Implement useful project metrics such as:

1. Overall project completion %

Can be computed using milestone weights or manual approved progress updates.

2. Reporting compliance rate

= submitted reports / expected reports for active projects in a period

3. Delay rate

= number of delayed milestones / total milestones

4. Project activity score

Based on number of reports, photos, tasks closed, and milestones completed

5. Client visibility score

Based on how current and complete approved updates are

You may propose the best practical formulas.

==================================================

21. PDF REPORTING REQUIREMENTS

==================================================

The system must generate PDF reports for:

- project summary

- daily report

- weekly report

- milestone completion report

- issue log summary

- client-facing project progress report

Each PDF should include:

- company logo

- project name

- client name

- location

- report title

- generated date

- author/prepared by

- photos if relevant

- tables and summaries

- milestone status

- footer and page numbering

The client-facing PDF must look professional and trustworthy.

==================================================

22. SECURITY REQUIREMENTS

==================================================

Implement:

- JWT authentication

- role-based access control

- password hashing

- secure file access

- signed URLs if needed

- audit logging

- approval traces

- per-project access control

- validation and sanitization

- rate limiting for auth endpoints

- backup and recovery considerations

==================================================

23. NON-FUNCTIONAL REQUIREMENTS

==================================================

The system should be:

- scalable

- maintainable

- secure

- responsive

- mobile-friendly

- easy to use

- suitable for low-bandwidth environments

- reliable for field teams

- modular for future expansion

Optional but valuable:

- offline-first report drafting

- background sync

- multilingual support

- English/French support

- multi-company SaaS support

==================================================

24. RECOMMENDED TECH STACK

==================================================

Recommend the best stack and justify it.

Possible direction:

Frontend mobile:

- Flutter or React Native

Frontend web:

- Next.js / React

Backend:

- NestJS or Django REST Framework

Database:

- PostgreSQL

Storage:

- S3-compatible object storage

PDF:

- server-side PDF generation

Auth:

- JWT + refresh tokens

Notifications:

- Firebase Cloud Messaging + email service

DevOps:

- Docker

- CI/CD pipeline

- cloud deployment

Choose the best stack for a construction/civil engineering business context.

==================================================

25. DELIVERABLES I NEED FROM YOU

==================================================

Respond in the following structure:

A. Executive summary

B. Product vision

C. Assumptions

D. Functional requirements

E. Non-functional requirements

F. User roles and permissions matrix

G. Core use cases

H. Database schema

I. Entity relationship explanation

J. API specification

K. Business workflows

L. Mobile/web screen architecture

M. Calculation logic

N. Reporting and PDF specs

O. Security model

P. Recommended tech stack

Q. Suggested folder structure

R. Example seed data

S. Example API payloads

T. QA test scenarios

U. MVP roadmap in phases

V. Future enhancements

==================================================

26. MVP DEFINITION

==================================================

Define a realistic MVP for BuildTrust.

The MVP must include:

- authentication

- company/project creation

- engineer reports

- photo uploads

- milestone tracking

- approval workflow

- client dashboard

- notifications

- PDF summary reports

Then define Phase 2 and Phase 3 improvements.

==================================================

27. OUTPUT QUALITY INSTRUCTIONS

==================================================

Your output must be:

- highly detailed

- implementation-ready

- specific to civil engineering workflows

- specific to trust and transparency goals

- realistic for actual construction firms

- not generic

- not shallow

At the end, also provide:

1. a draft PostgreSQL schema

2. sample JSON request/response payloads

3. 10 QA scenarios

4. a recommended MVP build sequence

5. a short product positioning statement for BuildTrust

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://buildtrust-clearview.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/4a0ba2e5-33b2-491e-bfcc-bcec7af11b8c).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
