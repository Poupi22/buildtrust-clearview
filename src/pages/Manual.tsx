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
        heading: { en: "Creating a project", fr: "Créer un projet" },
        body: {
          en: "From Projects → New project, fill in name, location, start and target end date, owning company and a client contact. The client contact is automatically invited to the client portal.",
          fr: "Depuis Projets → Nouveau projet, renseignez le nom, le lieu, les dates de début et de fin cible, l'entreprise propriétaire et un contact client. Le contact client est automatiquement invité au portail.",
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
    id: "reporting",
    roles: ["engineer", "technician", "manager"],
    title: { en: "6. Submitting reports", fr: "6. Soumettre des rapports" },
    intro: {
      en: "Reports are the heart of the platform. They feed the dashboard, the client portal and the audit log.",
      fr: "Les rapports sont au cœur de la plateforme. Ils alimentent le tableau de bord, le portail client et le journal d'audit.",
    },
    subsections: [
      {
        heading: { en: "The wizard, step by step", fr: "L'assistant, étape par étape" },
        body: {
          en: "1) Weather: temperature, conditions, wind. 2) Activities: tasks performed, % completed, photos. 3) Manpower & equipment: workers on site, machinery used. 4) Issues: any blocker, incident or safety event with severity. Each step auto-saves a local draft so you do not lose data if the connection drops.",
          fr: "1) Météo : température, conditions, vent. 2) Activités : tâches réalisées, % d'avancement, photos. 3) Effectifs et matériel : personnel présent, engins utilisés. 4) Incidents : tout blocage, événement ou alerte sécurité avec gravité. Chaque étape enregistre un brouillon local pour éviter toute perte en cas de coupure réseau.",
        },
      },
      {
        heading: { en: "Photos and attachments", fr: "Photos et pièces jointes" },
        body: {
          en: "Photos taken from a mobile device are uploaded with GPS and timestamp metadata. They remain private until the report is approved and published. PDFs and other documents can be attached the same way.",
          fr: "Les photos prises depuis un mobile sont téléversées avec leurs métadonnées GPS et horodatage. Elles restent privées jusqu'à l'approbation et la publication. Les PDF et autres documents peuvent être joints de la même façon.",
        },
      },
      {
        heading: { en: "Submitting", fr: "Soumission" },
        body: {
          en: "When complete, tap Submit. The report enters the approval queue and your site engineer is notified immediately.",
          fr: "Une fois complet, appuyez sur Soumettre. Le rapport entre dans la file d'approbation et votre ingénieur de site est notifié immédiatement.",
        },
      },
    ],
  },
  {
    id: "approvals",
    roles: ["super-admin", "company-admin", "manager", "engineer"],
    title: { en: "7. Approval workflow", fr: "7. Flux d'approbation" },
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
    title: { en: "8. Client portal", fr: "8. Portail client" },
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
    title: { en: "9. Field technician portal", fr: "9. Portail technicien terrain" },
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
    title: { en: "10. Issues & incidents", fr: "10. Incidents et alertes" },
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
    title: { en: "11. Administration", fr: "11. Administration" },
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
    title: { en: "12. Security & data privacy", fr: "12. Sécurité et confidentialité" },
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
    title: { en: "13. Frequently asked questions", fr: "13. Questions fréquentes" },
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
    title: { en: "14. Support", fr: "14. Assistance" },
    body: {
      en: "First line of support is your company administrator — they can reset passwords, change roles and reassign projects. For platform-level issues, your administrator can escalate to the BuildTrust team using the contact details provided during onboarding. Please include your project name, the time of the issue and a screenshot whenever possible.",
      fr: "Votre premier contact est l'administrateur de votre entreprise — il peut réinitialiser les mots de passe, modifier les rôles et réassigner les projets. Pour un problème de plateforme, votre administrateur peut escalader à l'équipe BuildTrust via les coordonnées fournies lors de votre intégration. Merci d'indiquer le nom du projet, l'heure de l'incident et une capture d'écran si possible.",
    },
  },
];

export default function Manual() {
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
          <h1 className="text-2xl font-display font-bold flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-primary" />
            {t("manual.title")}
          </h1>
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
