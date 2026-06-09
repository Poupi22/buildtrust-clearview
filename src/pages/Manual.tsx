import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/AuthContext";
import { Input } from "@/components/ui/input";
import { BookOpen, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

type Section = { id: string; title: { en: string; fr: string }; body: { en: string; fr: string }; roles: string[] };

const SECTIONS: Section[] = [
  {
    id: "getting-started",
    roles: ["all"],
    title: { en: "Getting started", fr: "Premiers pas" },
    body: {
      en: "Sign in with the credentials provided by your administrator. Use the language switcher in Settings to change the interface to English or French. Your profile and notification preferences are managed in Settings → Profile and Settings → Notifications.",
      fr: "Connectez-vous avec les identifiants fournis par votre administrateur. Utilisez le sélecteur de langue dans Paramètres pour basculer l'interface en anglais ou en français. Votre profil et vos préférences de notification se gèrent dans Paramètres → Profil et Paramètres → Notifications.",
    },
  },
  {
    id: "dashboard",
    roles: ["super-admin", "company-admin", "manager", "engineer"],
    title: { en: "Dashboard", fr: "Tableau de bord" },
    body: {
      en: "The dashboard summarizes active projects, KPIs (completion, compliance, delays) and recent activity. Click any tile to drill into the underlying data.",
      fr: "Le tableau de bord résume les projets actifs, les indicateurs (avancement, conformité, retards) et l'activité récente. Cliquez sur une tuile pour explorer les données associées.",
    },
  },
  {
    id: "projects",
    roles: ["super-admin", "company-admin", "manager", "engineer"],
    title: { en: "Managing projects", fr: "Gérer les projets" },
    body: {
      en: "Create a project from the Projects page. Each project needs a client contact and an owning company. Inside a project you can configure milestones and sub-milestones, then assign team members.",
      fr: "Créez un projet depuis la page Projets. Chaque projet nécessite un contact client et une entreprise propriétaire. Dans un projet, configurez les jalons et sous-jalons, puis affectez les membres de l'équipe.",
    },
  },
  {
    id: "reporting",
    roles: ["engineer", "technician", "manager"],
    title: { en: "Submitting reports", fr: "Soumettre des rapports" },
    body: {
      en: "Use the Report wizard (Weather → Activities → Manpower → Issues) to submit daily or weekly progress. Drafts are saved locally — submit when complete. Photos attached to a report are published to clients only after approval.",
      fr: "Utilisez l'assistant Rapport (Météo → Activités → Effectifs → Incidents) pour soumettre l'avancement quotidien ou hebdomadaire. Les brouillons sont enregistrés localement — soumettez-les une fois complets. Les photos jointes ne sont visibles par les clients qu'après approbation.",
    },
  },
  {
    id: "approvals",
    roles: ["super-admin", "company-admin", "manager", "engineer"],
    title: { en: "Approval workflow", fr: "Flux d'approbation" },
    body: {
      en: "Reports move from Draft → Pending review → Approved or Rejected. Approved + published items appear in the client portal. Configure auto-publish and dual approval in Settings → Workflow.",
      fr: "Les rapports passent de Brouillon → En attente de revue → Approuvé ou Refusé. Les éléments approuvés et publiés apparaissent dans le portail client. Configurez la publication automatique et la double approbation dans Paramètres → Flux de travail.",
    },
  },
  {
    id: "client-portal",
    roles: ["client"],
    title: { en: "Your client portal", fr: "Votre portail client" },
    body: {
      en: "The portal shows only data your project team has explicitly approved and published: progress %, milestones, photos and documents. You will receive notifications when new content is published.",
      fr: "Le portail n'affiche que les données explicitement approuvées et publiées par l'équipe : avancement, jalons, photos et documents. Vous recevez une notification dès qu'un nouveau contenu est publié.",
    },
  },
  {
    id: "technician",
    roles: ["technician"],
    title: { en: "Field technician portal", fr: "Portail technicien terrain" },
    body: {
      en: "Use the Tasks tab to update task status from the field, and the Report tab to submit daily progress. Your submissions go to your site engineer for review.",
      fr: "Utilisez l'onglet Tâches pour mettre à jour le statut des tâches depuis le terrain, et l'onglet Rapport pour soumettre l'avancement journalier. Vos soumissions sont revues par votre ingénieur de site.",
    },
  },
  {
    id: "admin",
    roles: ["super-admin", "company-admin"],
    title: { en: "Administration", fr: "Administration" },
    body: {
      en: "In Settings → Users invite and manage team members. Settings → Company edits organization details. Super-admins can also manage interface translations (Settings → Translations) and review the Audit log.",
      fr: "Dans Paramètres → Utilisateurs, invitez et gérez les membres. Paramètres → Entreprise modifie les informations de l'organisation. Les super-admins peuvent aussi gérer les traductions de l'interface (Paramètres → Traductions) et consulter le journal d'audit.",
    },
  },
  {
    id: "support",
    roles: ["all"],
    title: { en: "Support", fr: "Assistance" },
    body: {
      en: "Need help? Contact your administrator, or reach the BuildTrust team from the contact details provided during onboarding.",
      fr: "Besoin d'aide ? Contactez votre administrateur ou l'équipe BuildTrust via les coordonnées fournies lors de votre intégration.",
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
    return SECTIONS.filter((s) => s.roles.includes("all") || s.roles.includes(r)).filter((s) => {
      if (!q.trim()) return true;
      const needle = q.toLowerCase();
      return s.title[lang].toLowerCase().includes(needle) || s.body[lang].toLowerCase().includes(needle);
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
          <p className="text-muted-foreground text-sm mt-1">{t("manual.subtitle")}</p>
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

      <div className="grid gap-6 lg:grid-cols-[220px,1fr]">
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

        <div className="space-y-4">
          {visible.map((s) => (
            <section key={s.id} id={s.id} className="metric-card scroll-mt-24">
              <h2 className="font-display font-bold text-lg mb-2">{s.title[lang]}</h2>
              <p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-line">{s.body[lang]}</p>
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
