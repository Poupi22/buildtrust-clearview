# BuildTrust Public Business Homepage

## Goal
Add a polished public homepage before sign-in that presents BuildTrust as NED’s construction transparency platform and guides existing users to the secure login.

## What will be built
- Make `/` a public marketing homepage while keeping `/login` as the secure account entry.
- Preserve role-based destinations after authentication: administrators, project teams, technicians, and clients still reach their existing workspaces.
- Add a focused navigation with Product, Workflow, For clients, and Sign in.
- Build an image-led first screen featuring the BuildTrust name, its trust-focused promise, and clear sign-in/contact actions.
- Present the core commercial value: planning control, field reporting, approvals, client visibility, compliance, and auditable project journals.
- Show the professional workflow: Baseline Plan → Weekly Plan → Daily Journals → Approval → Client Portal.
- Add audience sections for construction companies, field teams, and clients, followed by a strong closing action and NED attribution.
- Support English and French on the public page without requiring an account.

## Visual direction
- Extend the existing BuildTrust identity: Trust Blue, Safety Orange, Montserrat headings, and Inter body text.
- Use authentic construction/project-control imagery and structured editorial layouts rather than generic software cards.
- Keep the page bright, authoritative, and commercial, with restrained motion and strong mobile readability.
- Take brand cues from NED’s official site—planning, precision, delivery, durable structures—while giving BuildTrust its own product identity.

## Technical details
- Add a dedicated homepage and public route handling without weakening protected routes.
- Reuse the existing design tokens, buttons, logo, language system, and animation library.
- Add locally stored visual assets for the homepage; no hotlinked media.
- Update page metadata to describe BuildTrust accurately for search and sharing.
- Verify signed-out homepage-to-login navigation, signed-in redirects, desktop layout, mobile layout, and preview errors.
