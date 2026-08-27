import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/AuthContext";
import { Input } from "@/components/ui/input";
import { BookOpen, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

type Section = {
  id: string;
  title: { en: string; fr: string };
  intro?: { en: string; fr: string };
  subsections?: { heading: { en: string; fr: string }; body: { en: string; fr: string } }[];
  body?: { en: string; fr: string };
  roles: string[];
};

const SECTIONS: Section[] = [
  {
    id: "introduction",
    roles: ["all"],
    title: { en: "1. Introduction to BuildTrust", fr: "1. Introduction à BuildTrust" },
    intro: {
      en: "BuildTrust is a construction transparency platform that connects engineering teams, field technicians, project managers and clients around a single source of truth. It ensures every site update is traceable, reviewed and intentionally published — eliminating the information gap that historically separates contractors from the people funding the work.",
      fr: "BuildTrust est une plateforme de transparence pour la construction qui réunit ingénieurs, techniciens de terrain, chefs de projet et clients autour d'une source unique de vérité. Chaque mise à jour de chantier est tracée, revue et publiée intentionnellement, supprimant l'écart d'information qui sépare habituellement les entreprises des donneurs d'ordre.",
    },
    subsections: [
      {
        heading: { en: "Who this manual is for", fr: "À qui s'adresse ce manuel" },
        body: {
          en: "This manual is written for every user of the platform — administrators, engineers, technicians and clients. Sections are filtered based on your role, so you only see procedures that apply to your daily work.",
          fr: "Ce manuel s'adresse à tous les utilisateurs de la plateforme — administrateurs, ingénieurs, techniciens et clients. Les sections sont filtrées selon votre rôle pour n'afficher que les procédures pertinentes pour votre activité.",
        },
      },
      {
        heading: { en: "Key principles", fr: "Principes fondamentaux" },
        body: {
          en: "1) Nothing is shown to the client unless it has been explicitly approved and published. 2) Every action is logged with an author, a timestamp and a role. 3) Field data is captured at source, on mobile, then reviewed by the office. 4) Bilingual interface (English / French) is available to every user.",
          fr: "1) Rien n'est visible par le client tant que cela n'a pas été explicitement approuvé et publié. 2) Toute action est journalisée avec un auteur, un horodatage et un rôle. 3) Les données terrain sont saisies à la source, sur mobile, puis revues par le bureau. 4) L'interface bilingue (français / anglais) est disponible pour tous.",
        },
      },
    ],
  },
  {
    id: "getting-started",
    roles: ["all"],
    title: { en: "2. Getting started", fr: "2. Premiers pas" },
    subsections: [
      {
        heading: { en: "Signing in", fr: "Connexion" },
        body: {
          en: "Open the application URL provided by your administrator and sign in with the email and password you received in your invitation. If you forget your password, use the 'Reset password' link on the login screen — a secure reset link is emailed to you.",
          fr: "Ouvrez l'URL de l'application fournie par votre administrateur et connectez-vous avec l'e-mail et le mot de passe reçus dans votre invitation. En cas d'oubli, utilisez le lien « Réinitialiser le mot de passe » sur l'écran de connexion — un lien sécurisé vous est envoyé par e-mail.",
        },
      },
      {
        heading: { en: "Choosing your language", fr: "Choisir votre langue" },
        body: {
          en: "Open Settings → Language and pick English or French. The choice is saved to your profile and applied on every device you sign into. You can also toggle the language from the small EN / FR switch in the sidebar or the top bar.",
          fr: "Ouvrez Paramètres → Langue et choisissez le français ou l'anglais. Le choix est enregistré dans votre profil et appliqué sur chaque appareil. Vous pouvez aussi basculer la langue via le sélecteur EN / FR dans la barre latérale ou la barre supérieure.",
        },
      },
      {
        heading: { en: "Profile, security and notifications", fr: "Profil, sécurité et notifications" },
        body: {
          en: "Settings → Profile lets you edit your name, photo, phone and company. Settings → Security allows password change and active-session review. Settings → Notifications controls which events trigger an email or in-app alert (new report, approval needed, issue raised, document published).",
          fr: "Paramètres → Profil permet de modifier votre nom, photo, téléphone et entreprise. Paramètres → Sécurité permet de changer le mot de passe et de revoir les sessions actives. Paramètres → Notifications contrôle les événements déclenchant un e-mail ou une alerte (nouveau rapport, approbation requise, incident, document publié).",
        },
      },
    ],
  },
  {
    id: "roles",
    roles: ["all"],
    title: { en: "3. Roles & permissions", fr: "3. Rôles et permissions" },
    intro: {
      en: "BuildTrust uses five roles. Each role sees a tailored navigation and only the data it is authorized to access.",
      fr: "BuildTrust utilise cinq rôles. Chaque rôle dispose d'une navigation adaptée et n'accède qu'aux données qu'il est autorisé à consulter.",
    },
    subsections: [
      {
        heading: { en: "Super-admin", fr: "Super-admin" },
        body: {
          en: "Platform-wide owner. Manages companies, global translations, audit logs and feature toggles.",
          fr: "Propriétaire de la plateforme. Gère les entreprises, les traductions globales, le journal d'audit et les fonctionnalités.",
        },
      },
      {
        heading: { en: "Company admin", fr: "Administrateur d'entreprise" },
        body: {
          en: "Manages users and projects inside their company, configures workflow and branding, invites clients.",
          fr: "Gère les utilisateurs et projets de son entreprise, configure le flux de travail et la charte, invite les clients.",
        },
      },
      {
        heading: { en: "Engineer / Manager", fr: "Ingénieur / Chef de projet" },
        body: {
          en: "Plans projects, reviews reports, approves and publishes content to the client portal, manages issues.",
          fr: "Planifie les projets, revoit les rapports, approuve et publie les contenus dans le portail client, gère les incidents.",
        },
      },
      {
        heading: { en: "Technician (field)", fr: "Technicien (terrain)" },
        body: {
          en: "Mobile-first user. Updates task status, uploads photos, and submits daily progress from the site.",
          fr: "Utilisateur mobile. Met à jour le statut des tâches, téléverse des photos et soumet l'avancement quotidien depuis le chantier.",
        },
      },
      {
        heading: { en: "Client", fr: "Client" },
        body: {
          en: "Read-only access to a dedicated portal showing only approved and published progress, photos and documents.",
          fr: "Accès en lecture seule à un portail dédié n'affichant que l'avancement, les photos et les documents approuvés et publiés.",
        },
      },
    ],
  },
  {
    id: "dashboard",
    roles: ["super-admin", "company-admin", "manager", "engineer"],
    title: { en: "4. Dashboard", fr: "4. Tableau de bord" },
    intro: {
      en: "The dashboard is your daily cockpit. It aggregates KPIs across every project you can access.",
      fr: "Le tableau de bord est votre cockpit quotidien. Il agrège les KPI de tous les projets auxquels vous avez accès.",
    },
    subsections: [
      {
        heading: { en: "Key indicators", fr: "Indicateurs clés" },
        body: {
          en: "• Completion %: weighted average of all milestones.\n• Compliance rate: ratio of approved reports vs. expected reports.\n• Delay rate: ratio of milestones past their target date.\n• Active issues: open incidents by severity.",
          fr: "• Avancement % : moyenne pondérée de tous les jalons.\n• Taux de conformité : rapports approuvés sur rapports attendus.\n• Taux de retard : jalons dépassant leur date cible.\n• Incidents actifs : incidents ouverts par gravité.",
        },
      },
      {
        heading: { en: "Activity feed", fr: "Flux d'activité" },
        body: {
          en: "Lists the most recent submissions, approvals, publications and issues so you can act without searching.",
          fr: "Liste les dernières soumissions, approbations, publications et incidents pour agir sans recherche.",
        },
      },
    ],
  },
  {
    id: "projects",
    roles: ["super-admin", "company-admin", "manager", "engineer"],
    title: { en: "5. Managing projects", fr: "5. Gérer les projets" },
    subsections: [
      {
        heading: { en: "Creating a project (step-by-step wizard)", fr: "Créer un projet (assistant pas à pas)" },
        body: {
          en: "Projects → New project opens a five-step wizard: 1) Project details (name, location, start and target end date). 2) Client — the client account is created here directly: full name and email are required, phone, address and company are optional; a temporary password and portal link are displayed at the end. 3) Team — add engineers, technicians and managers. 4) Documents — upload initial contractual documents. 5) Review and validate to create the project.",
          fr: "Projets → Nouveau projet ouvre un assistant en cinq étapes : 1) Détails du projet (nom, lieu, dates de début et de fin cible). 2) Client — le compte client est créé ici directement : nom complet et e-mail obligatoires, téléphone, adresse et entreprise facultatifs ; un mot de passe temporaire et le lien du portail sont affichés à la fin. 3) Équipe — ajoutez ingénieurs, techniciens et chefs de projet. 4) Documents — téléversez les documents contractuels initiaux. 5) Récapitulatif et validation pour créer le projet.",
        },
      },

      {
        heading: { en: "Milestones and sub-milestones", fr: "Jalons et sous-jalons" },
        body: {
          en: "Open the project, go to Milestones, and add a hierarchical breakdown of the work. Each milestone has a weight (used to compute completion %), a target date and an owner. You can bulk-import via CSV.",
          fr: "Ouvrez le projet, allez dans Jalons, et ajoutez la décomposition hiérarchique des travaux. Chaque jalon a un poids (utilisé pour l'avancement %), une date cible et un responsable. L'import CSV en masse est disponible.",
        },
      },
      {
        heading: { en: "Team assignments", fr: "Affectations de l'équipe" },
        body: {
          en: "In the Team tab of the project, assign engineers, technicians and managers. Assignments control who can submit reports, approve content and receive notifications.",
          fr: "Dans l'onglet Équipe du projet, affectez ingénieurs, techniciens et chefs de projet. Les affectations conditionnent qui peut soumettre des rapports, approuver et recevoir les notifications.",
        },
      },
    ],
  },
  {
    id: "planning",
    roles: ["super-admin", "company-admin", "manager", "engineer", "project-lead", "technician", "client"],
    title: { en: "6. Baseline plan & weekly work plan", fr: "6. Plan de référence et plan hebdomadaire" },
    intro: {
      en: "Execution in BuildTrust is planning-driven. Nothing can be reported that has not first been planned: the Baseline Plan defines the contractual scope, and the Weekly Work Plan turns it into dated obligations for the field.",
      fr: "L'exécution dans BuildTrust est pilotée par la planification. Rien ne peut être rapporté sans avoir été planifié : le Plan de référence définit le périmètre contractuel, et le Plan hebdomadaire le traduit en obligations datées pour le terrain.",
    },
    subsections: [
      {
        heading: { en: "Creating a baseline version", fr: "Créer une version de référence" },
        body: {
          en: "Open Planning → Baseline plan. Create a version (V1, V2, …), list the planned activities with quantities, units, planned start/end dates and the linked milestone, and attach the signed planning document (PDF, schedule export). Submit the version for activation.",
          fr: "Ouvrez Planification → Plan de référence. Créez une version (V1, V2, …), listez les activités planifiées avec quantités, unités, dates prévues de début/fin et le jalon associé, puis joignez le document de planification signé (PDF, export de planning). Soumettez la version pour activation.",
        },
      },
      {
        heading: { en: "Activation and immutability", fr: "Activation et immuabilité" },
        body: {
          en: "Only a Super Admin activates a baseline version. Once active, the version becomes immutable — it can never be edited or deleted. Any change of scope requires creating a new version, which keeps the full contractual history auditable. The previously active version is archived, not overwritten.",
          fr: "Seul un Super Admin active une version de référence. Une fois active, la version devient immuable — elle ne peut plus être modifiée ni supprimée. Tout changement de périmètre impose la création d'une nouvelle version, ce qui préserve un historique contractuel auditable. La version précédente est archivée, jamais écrasée.",
        },
      },
      {
        heading: { en: "Building the weekly work plan", fr: "Construire le plan hebdomadaire" },
        body: {
          en: "In Planning → Weekly work plan, choose the week, tick the working days (non-working days are excluded from all obligations), then add the activities planned for each day with the responsible team member and the planned quantity. Activities must reference the active baseline.",
          fr: "Dans Planification → Plan hebdomadaire, choisissez la semaine, cochez les jours travaillés (les jours non travaillés sont exclus de toute obligation), puis ajoutez les activités prévues pour chaque jour avec le responsable et la quantité planifiée. Les activités doivent référencer le plan de référence actif.",
        },
      },
      {
        heading: { en: "Locking the week", fr: "Verrouillage de la semaine" },
        body: {
          en: "Activating the weekly plan locks the calendar for that week and automatically generates the reporting obligations: one Daily Journal per working day per responsible technician, plus one Weekly Report at the end of the week. Locked weeks cannot be re-planned retroactively.",
          fr: "L'activation du plan hebdomadaire verrouille le calendrier de la semaine et génère automatiquement les obligations de reporting : un Journal de chantier par jour travaillé et par technicien responsable, plus un Rapport hebdomadaire en fin de semaine. Une semaine verrouillée ne peut pas être replanifiée rétroactivement.",
        },
      },
    ],
  },
  {
    id: "reporting",
    roles: ["engineer", "technician", "manager", "project-lead", "company-admin", "super-admin"],
    title: { en: "7. Daily & weekly Journal de Chantier", fr: "7. Journal de chantier quotidien et hebdomadaire" },
    intro: {
      en: "BuildTrust uses one official site-journal template. The daily journal and the weekly journal share exactly the same structure — only the period and the name differ. Journals are written records: text and structured tables, no attachments. They constitute the legal journal of the project and are exportable as a chronological PDF.",
      fr: "BuildTrust utilise un modèle officiel unique de journal de chantier. Le journal quotidien et le journal hebdomadaire partagent exactement la même structure — seuls la période et le nom changent. Les journaux sont des écrits : texte et tableaux structurés, sans pièces jointes. Ils constituent le journal officiel du projet et sont exportables en PDF chronologique.",
    },
    subsections: [
      {
        heading: { en: "Official template sections", fr: "Sections du modèle officiel" },
        body: {
          en: "Header (project, site, date, company, control mission, weather, working hours) · Personnel (position / headcount) · Equipment (designation, running / idle / breakdown) · Works executed (designation, observations) · Materials (designation, morning stock, delivery, consumption, evening stock) · Instructions from the owner and the control mission · HSE and technical observations · Corrective actions and delays · Visas and signatures.",
          fr: "En-tête (projet, chantier, date, entreprise, mission de contrôle, météo, horaires) · Personnel (poste / nombre) · Matériel (désignation, marche / immobilisé / panne) · Travaux exécutés (désignation, observations) · Matériaux (désignation, stock matin, approvisionnement, consommé, stock soir) · Instructions du maître d'ouvrage et de la mission de contrôle · Observations HSE et techniques · Actions correctives et retards · Visas et signatures.",
        },
      },
      {
        heading: { en: "Daily journal (internal)", fr: "Journal quotidien (interne)" },
        body: {
          en: "Submitted every working day by the responsible technician, before the deadline set by the workflow settings (server time). Daily journals are visible to engineers, project leads and administrators — never to the client. They can be saved as a draft and completed later, as long as the deadline has not passed.",
          fr: "Soumis chaque jour travaillé par le technicien responsable, avant l'échéance définie dans les paramètres du flux (heure serveur). Les journaux quotidiens sont visibles par les ingénieurs, chefs de projet et administrateurs — jamais par le client. Ils peuvent être enregistrés en brouillon et complétés plus tard, tant que l'échéance n'est pas dépassée.",
        },
      },
      {
        heading: { en: "Weekly report (client-facing)", fr: "Rapport hebdomadaire (destiné au client)" },
        body: {
          en: "Submitted at the end of each planned week, using the same journal template with a week start and end date. It consolidates the week's execution, compares planned versus actual quantities and states delays and corrective actions. Engineers and administrators may edit it before approval; once approved and published it becomes visible in the client portal.",
          fr: "Soumis à la fin de chaque semaine planifiée, avec le même modèle de journal et des dates de début et de fin de semaine. Il consolide l'exécution de la semaine, compare quantités prévues et réalisées et précise retards et actions correctives. Les ingénieurs et administrateurs peuvent le modifier avant approbation ; une fois approuvé et publié, il devient visible dans le portail client.",
        },
      },
      {
        heading: { en: "Anti-backdating rules", fr: "Règles anti-antidatage" },
        body: {
          en: "The report date can never be in the future, and the submission timestamp is taken from the server, not from your device. A journal submitted after its deadline is flagged as late; a journal never submitted becomes a permanent ABSENT compliance event that cannot be removed.",
          fr: "La date d'un rapport ne peut jamais être dans le futur, et l'horodatage de soumission provient du serveur, non de votre appareil. Un journal soumis après l'échéance est marqué en retard ; un journal jamais soumis devient un événement de conformité ABSENT permanent et ineffaçable.",
        },
      },
      {
        heading: { en: "PDF journal export", fr: "Export PDF du journal" },
        body: {
          en: "From Reports, export the project journal as a PDF. Entries are printed in chronological order with the official layout, author, role, timestamps, signature snapshots and page numbering. You may include or exclude internal notes depending on the recipient.",
          fr: "Depuis Rapports, exportez le journal du projet en PDF. Les entrées sont imprimées dans l'ordre chronologique avec la mise en page officielle, l'auteur, le rôle, les horodatages, les signatures enregistrées et la pagination. Vous pouvez inclure ou exclure les notes internes selon le destinataire.",
        },
      },
    ],
  },
  {
    id: "compliance",
    roles: ["super-admin", "company-admin", "manager", "engineer", "project-lead", "technician"],
    title: { en: "8. Obligations & compliance", fr: "8. Obligations et conformité" },
    intro: {
      en: "Compliance measures whether the reporting duties generated by the plan were actually honoured, on time.",
      fr: "La conformité mesure si les obligations de reporting générées par le plan ont réellement été honorées, dans les délais.",
    },
    subsections: [
      {
        heading: { en: "How obligations are created", fr: "Création des obligations" },
        body: {
          en: "Obligations are never created by hand. Activating a weekly work plan generates one obligation per working day and responsible person, plus the weekly obligation. Each obligation carries a due date and time computed on the server.",
          fr: "Les obligations ne sont jamais créées manuellement. L'activation d'un plan hebdomadaire génère une obligation par jour travaillé et par responsable, plus l'obligation hebdomadaire. Chaque obligation porte une date et une heure d'échéance calculées côté serveur.",
        },
      },
      {
        heading: { en: "Statuses", fr: "Statuts" },
        body: {
          en: "PENDING (not yet due) · SUBMITTED (fulfilled on time) · LATE (fulfilled after the deadline) · ABSENT (deadline passed with no submission). ABSENT is terminal and irreversible — it remains in the record even if a report is written afterwards.",
          fr: "EN ATTENTE (échéance non atteinte) · SOUMIS (rempli à temps) · EN RETARD (rempli après l'échéance) · ABSENT (échéance dépassée sans soumission). ABSENT est terminal et irréversible — il reste au dossier même si un rapport est rédigé ensuite.",
        },
      },
      {
        heading: { en: "Compliance dashboard", fr: "Tableau de bord de conformité" },
        body: {
          en: "Compliance shows, per project and per person, the reporting rate, the number of late and absent entries and the trend over time. Use it in weekly coordination meetings and for contractual evidence.",
          fr: "La page Conformité affiche, par projet et par personne, le taux de reporting, le nombre de retards et d'absences et la tendance dans le temps. Utilisez-la en réunion hebdomadaire de coordination et comme preuve contractuelle.",
        },
      },
      {
        heading: { en: "Planned vs actual", fr: "Prévu / réalisé" },
        body: {
          en: "Quantities declared in journals are compared with the quantities planned in the weekly plan and the baseline. Deviations feed the completion percentage, the delay rate and the client-facing progress indicators.",
          fr: "Les quantités déclarées dans les journaux sont comparées aux quantités prévues dans le plan hebdomadaire et le plan de référence. Les écarts alimentent le pourcentage d'avancement, le taux de retard et les indicateurs d'avancement présentés au client.",
        },
      },
    ],
  },

  {
    id: "approvals",
    roles: ["super-admin", "company-admin", "manager", "engineer"],
    title: { en: "9. Approval workflow", fr: "9. Flux d'approbation" },
    intro: {
      en: "Every piece of content visible to the client passes through a controlled multi-stage workflow.",
      fr: "Tout contenu visible par le client suit un flux multi-étapes contrôlé.",
    },
    subsections: [
      {
        heading: { en: "Stages", fr: "Étapes" },
        body: {
          en: "Draft → Pending review → Approved → Published. A rejected report is sent back to the author with comments. Only Published items reach the client portal.",
          fr: "Brouillon → En attente de revue → Approuvé → Publié. Un rapport refusé est renvoyé à l'auteur avec commentaires. Seuls les éléments Publiés apparaissent dans le portail client.",
        },
      },
      {
        heading: { en: "Dual approval & auto-publish", fr: "Double approbation et publication automatique" },
        body: {
          en: "In Settings → Workflow you can require two approvers for high-impact content (financial documents, formal acceptance) and enable auto-publish for routine daily reports.",
          fr: "Dans Paramètres → Flux de travail, exigez deux approbateurs pour les contenus sensibles (documents financiers, réception formelle) et activez la publication automatique pour les rapports journaliers routiniers.",
        },
      },
      {
        heading: { en: "Audit log", fr: "Journal d'audit" },
        body: {
          en: "Every approval, rejection and publication is permanently logged with author, date and previous state. Super-admins can export the log as PDF or CSV.",
          fr: "Chaque approbation, refus et publication est journalisé de manière permanente avec auteur, date et état précédent. Les super-admins peuvent exporter le journal en PDF ou CSV.",
        },
      },
    ],
  },
  {
    id: "client-portal",
    roles: ["client", "super-admin", "company-admin", "manager", "engineer"],
    title: { en: "10. Client portal", fr: "10. Portail client" },
    subsections: [
      {
        heading: { en: "What clients see", fr: "Ce que voient les clients" },
        body: {
          en: "A simplified, read-only interface listing your projects, progress %, milestones, approved photos, weekly summaries and downloadable PDF reports. No drafts, no internal notes, no financial details unless explicitly published.",
          fr: "Une interface simplifiée en lecture seule listant vos projets, l'avancement, les jalons, les photos approuvées, les synthèses hebdomadaires et les rapports PDF téléchargeables. Aucun brouillon, aucune note interne, aucune donnée financière sauf publication explicite.",
        },
      },
      {
        heading: { en: "Notifications", fr: "Notifications" },
        body: {
          en: "Clients receive an e-mail (and an in-app bell alert) whenever a new content is published. Frequency can be set to instant, daily digest or weekly digest in Settings → Notifications.",
          fr: "Les clients reçoivent un e-mail (et une notification dans l'application) à chaque nouvelle publication. La fréquence est paramétrable en instantané, résumé quotidien ou hebdomadaire dans Paramètres → Notifications.",
        },
      },
      {
        heading: { en: "Acknowledging documents", fr: "Accuser réception de documents" },
        body: {
          en: "Some documents request a digital acknowledgement. Open the document, review it, and tap 'Acknowledge'. Your signature, date and IP are recorded for the audit log.",
          fr: "Certains documents demandent un accusé de réception numérique. Ouvrez le document, consultez-le, puis appuyez sur « Accuser réception ». Votre signature, la date et l'IP sont enregistrées dans le journal d'audit.",
        },
      },
    ],
  },
  {
    id: "technician",
    roles: ["technician", "super-admin", "company-admin", "manager", "engineer"],
    title: { en: "11. Field technician portal", fr: "11. Portail technicien terrain" },
    subsections: [
      {
        heading: { en: "Tasks", fr: "Tâches" },
        body: {
          en: "Your day starts here. Tap a task to update its status (To do → In progress → Done), add a photo and write a short comment. Updates sync as soon as you regain connectivity.",
          fr: "Votre journée commence ici. Appuyez sur une tâche pour mettre à jour son statut (À faire → En cours → Terminée), ajouter une photo et un court commentaire. Les mises à jour se synchronisent dès le retour de la connectivité.",
        },
      },
      {
        heading: { en: "Daily report", fr: "Rapport journalier" },
        body: {
          en: "At the end of the day, open Report and run through the four-step wizard. Submit before leaving the site so your engineer can review the same evening.",
          fr: "En fin de journée, ouvrez Rapport et déroulez l'assistant en quatre étapes. Soumettez avant de quitter le site pour permettre la revue le soir même.",
        },
      },
      {
        heading: { en: "Offline mode", fr: "Mode hors ligne" },
        body: {
          en: "The technician portal works without network. Photos, status updates and reports are queued locally and synchronised automatically when connectivity returns.",
          fr: "Le portail technicien fonctionne sans réseau. Photos, statuts et rapports sont mis en file localement puis synchronisés automatiquement au retour du réseau.",
        },
      },
    ],
  },
  {
    id: "issues",
    roles: ["super-admin", "company-admin", "manager", "engineer", "technician"],
    title: { en: "12. Issues & incidents", fr: "12. Incidents et alertes" },
    subsections: [
      {
        heading: { en: "Raising an issue", fr: "Signaler un incident" },
        body: {
          en: "From any project tap New issue, choose a category (safety, quality, delay, environment), severity (low / medium / high / critical), description and attach photos. High and critical issues trigger an immediate notification to the project manager.",
          fr: "Depuis un projet, appuyez sur Nouvel incident, choisissez une catégorie (sécurité, qualité, retard, environnement), une gravité (faible / moyenne / élevée / critique), une description et joignez des photos. Les incidents élevés et critiques déclenchent une notification immédiate au chef de projet.",
        },
      },
      {
        heading: { en: "Resolution flow", fr: "Flux de résolution" },
        body: {
          en: "An issue moves Open → Assigned → In progress → Resolved → Closed. Each transition is logged. Critical issues require a written root-cause analysis before they can be closed.",
          fr: "Un incident passe Ouvert → Assigné → En cours → Résolu → Clôturé. Chaque transition est journalisée. Les incidents critiques exigent une analyse de cause racine écrite avant clôture.",
        },
      },
    ],
  },
  {
    id: "admin",
    roles: ["super-admin", "company-admin"],
    title: { en: "13. Administration", fr: "13. Administration" },
    subsections: [
      {
        heading: { en: "Users and invitations", fr: "Utilisateurs et invitations" },
        body: {
          en: "Settings → Users lists every user in your company. Invite a new user by e-mail, assign a role, and optionally restrict their access to specific projects.",
          fr: "Paramètres → Utilisateurs liste tous les utilisateurs de votre entreprise. Invitez un nouvel utilisateur par e-mail, attribuez un rôle, et restreignez si besoin l'accès à certains projets.",
        },
      },
      {
        heading: { en: "Company branding", fr: "Charte de l'entreprise" },
        body: {
          en: "Settings → Company lets you upload your logo, set your primary colour and contact details. These are used in PDF reports and on the client portal.",
          fr: "Paramètres → Entreprise permet de téléverser votre logo, définir votre couleur principale et vos coordonnées. Ces éléments apparaissent dans les rapports PDF et le portail client.",
        },
      },
      {
        heading: { en: "Translations (super-admin)", fr: "Traductions (super-admin)" },
        body: {
          en: "Settings → Translations exposes every interface key with its English and French value. Edit, add or delete entries — changes take effect on next page load. Use this to fine-tune wording or add a sector-specific vocabulary.",
          fr: "Paramètres → Traductions expose chaque clé d'interface avec sa valeur anglaise et française. Modifiez, ajoutez ou supprimez des entrées — les changements prennent effet au prochain chargement. Utilisez cet outil pour affiner le vocabulaire ou ajouter un lexique sectoriel.",
        },
      },
      {
        heading: { en: "Audit log", fr: "Journal d'audit" },
        body: {
          en: "Super-admins can browse a chronological log of every sensitive action: user creation, role change, approval, publication, document download. Exportable for compliance reviews.",
          fr: "Les super-admins consultent un journal chronologique de toutes les actions sensibles : création d'utilisateur, changement de rôle, approbation, publication, téléchargement de document. Exportable pour les audits de conformité.",
        },
      },
    ],
  },
  {
    id: "security",
    roles: ["all"],
    title: { en: "14. Security & data privacy", fr: "14. Sécurité et confidentialité" },
    subsections: [
      {
        heading: { en: "Access control", fr: "Contrôle d'accès" },
        body: {
          en: "All data access is enforced at the database level by row-level security policies. A client can never query another client's project, even by manipulating the URL.",
          fr: "Tout accès aux données est contrôlé au niveau base par des politiques de sécurité au niveau ligne. Un client ne peut jamais accéder au projet d'un autre client, même en manipulant l'URL.",
        },
      },
      {
        heading: { en: "Data residency and backups", fr: "Hébergement et sauvegardes" },
        body: {
          en: "Data is hosted on managed infrastructure with encrypted storage at rest and TLS in transit. Daily backups are retained for 30 days; point-in-time recovery is available on request.",
          fr: "Les données sont hébergées sur une infrastructure managée, avec chiffrement au repos et TLS en transit. Sauvegardes quotidiennes conservées 30 jours ; restauration à un instant T disponible sur demande.",
        },
      },
      {
        heading: { en: "Best practices", fr: "Bonnes pratiques" },
        body: {
          en: "Use a unique strong password, never share your account, sign out from shared devices, and report any suspicious activity to your administrator immediately.",
          fr: "Utilisez un mot de passe unique et robuste, ne partagez jamais votre compte, déconnectez-vous des appareils partagés et signalez immédiatement à votre administrateur toute activité suspecte.",
        },
      },
    ],
  },
  {
    id: "faq",
    roles: ["all"],
    title: { en: "15. Frequently asked questions", fr: "15. Questions fréquentes" },
    subsections: [
      {
        heading: { en: "Why can't my client see a photo I just uploaded?", fr: "Pourquoi mon client ne voit-il pas une photo que je viens de téléverser ?" },
        body: {
          en: "Photos and reports are private by default. They appear in the client portal only after they have been Approved AND Published. Check the Approvals queue.",
          fr: "Les photos et rapports sont privés par défaut. Ils n'apparaissent dans le portail client qu'après avoir été Approuvés ET Publiés. Vérifiez la file d'approbation.",
        },
      },
      {
        heading: { en: "How do I switch the interface to French?", fr: "Comment basculer l'interface en français ?" },
        body: {
          en: "Use the EN / FR switch in the sidebar, or open Settings → Language. The choice follows your profile across all your devices.",
          fr: "Utilisez le sélecteur EN / FR de la barre latérale, ou ouvrez Paramètres → Langue. Le choix suit votre profil sur tous vos appareils.",
        },
      },
      {
        heading: { en: "I lost connectivity in the field. Did I lose my data?", fr: "J'ai perdu la connexion sur le terrain. Mes données sont-elles perdues ?" },
        body: {
          en: "No. The technician portal saves drafts locally and synchronises them automatically when the network returns. Keep the browser tab open until sync completes.",
          fr: "Non. Le portail technicien enregistre les brouillons localement et les synchronise automatiquement au retour du réseau. Gardez l'onglet ouvert jusqu'à la fin de la synchronisation.",
        },
      },
    ],
  },
  {
    id: "support",
    roles: ["all"],
    title: { en: "16. Support", fr: "16. Assistance" },
    body: {
      en: "First line of support is your company administrator — they can reset passwords, change roles and reassign projects. For platform-level issues, your administrator can escalate to the BuildTrust team using the contact details provided during onboarding. Please include your project name, the time of the issue and a screenshot whenever possible.",
      fr: "Votre premier contact est l'administrateur de votre entreprise — il peut réinitialiser les mots de passe, modifier les rôles et réassigner les projets. Pour un problème de plateforme, votre administrateur peut escalader à l'équipe BuildTrust via les coordonnées fournies lors de votre intégration. Merci d'indiquer le nom du projet, l'heure de l'incident et une capture d'écran si possible.",
    },
  },
];

export default function Manual({ embedded = false }: { embedded?: boolean }) {
  const { t, i18n } = useTranslation();
  const { role } = useAuth();
  const lang = (i18n.language?.startsWith("fr") ? "fr" : "en") as "en" | "fr";
  const [q, setQ] = useState("");

  const visible = useMemo(() => {
    const r = role ?? "engineer";
    const needle = q.trim().toLowerCase();
    return SECTIONS.filter((s) => s.roles.includes("all") || s.roles.includes(r)).filter((s) => {
      if (!needle) return true;
      const hay = [
        s.title[lang],
        s.intro?.[lang] ?? "",
        s.body?.[lang] ?? "",
        ...(s.subsections?.flatMap((ss) => [ss.heading[lang], ss.body[lang]]) ?? []),
      ]
        .join(" ")
        .toLowerCase();
      return hay.includes(needle);
    });
  }, [role, q, lang]);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          {embedded ? (
            <h2 className="text-lg font-display font-bold flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              {t("manual.title")}
            </h2>
          ) : (
            <h1 className="text-2xl font-display font-bold flex items-center gap-2">
              <BookOpen className="h-6 w-6 text-primary" />
              {t("manual.title")}
            </h1>
          )}

          <p className="text-muted-foreground text-sm mt-1">
            {lang === "fr"
              ? "Guide complet de la plateforme BuildTrust — adapté à votre rôle."
              : "Complete guide to the BuildTrust platform — tailored to your role."}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => window.print()} className="gap-2">
          <Printer className="h-4 w-4" />
          {t("manual.printable")}
        </Button>
      </div>

      <Input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder={t("manual.searchPlaceholder")}
        className="max-w-md"
      />

      <div className="grid gap-6 lg:grid-cols-[240px,1fr]">
        <aside className="hidden lg:block">
          <div className="metric-card sticky top-20">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
              {t("manual.toc")}
            </p>
            <ul className="space-y-1 text-sm">
              {visible.map((s) => (
                <li key={s.id}>
                  <a href={`#${s.id}`} className="text-muted-foreground hover:text-foreground">
                    {s.title[lang]}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </aside>

        <div className="space-y-5">
          {visible.map((s) => (
            <section key={s.id} id={s.id} className="metric-card scroll-mt-24 space-y-4">
              <h2 className="font-display font-bold text-xl">{s.title[lang]}</h2>
              {s.intro && (
                <p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-line">{s.intro[lang]}</p>
              )}
              {s.body && (
                <p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-line">{s.body[lang]}</p>
              )}
              {s.subsections && (
                <div className="space-y-4">
                  {s.subsections.map((ss, i) => (
                    <div key={i} className="space-y-1.5">
                      <h3 className="font-semibold text-sm text-foreground">{ss.heading[lang]}</h3>
                      <p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-line">
                        {ss.body[lang]}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </section>
          ))}
          {visible.length === 0 && (
            <div className="metric-card text-sm text-muted-foreground text-center py-10">
              {lang === "fr" ? "Aucun résultat." : "No results."}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
