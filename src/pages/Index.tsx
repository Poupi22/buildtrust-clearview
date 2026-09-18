import { useState } from "react";
import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  BarChart3,
  CalendarCheck2,
  Check,
  ChevronRight,
  ClipboardCheck,
  FileCheck2,
  HardHat,
  Languages,
  Menu,
  ShieldCheck,
  Users,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import logo from "@/assets/logo.jpg";
import heroImage from "@/assets/buildtrust-hero.jpg";
import clientReviewImage from "@/assets/buildtrust-client-review.jpg";

type PublicLanguage = "en" | "fr";

const copy = {
  en: {
    nav: { product: "Product", workflow: "Workflow", clients: "For clients", company: "NED website", signin: "Sign in" },
    hero: {
      eyebrow: "Construction intelligence by NED",
      title: "Every project decision. Visible. Verified.",
      body: "BuildTrust connects plans, field activity, approvals and client communication in one rigorous construction record.",
      signin: "Access BuildTrust",
      discover: "Discover the workflow",
      proof: "Built for accountable project delivery",
    },
    value: {
      eyebrow: "One source of truth",
      title: "From the baseline to the client, nothing gets lost.",
      body: "Replace scattered messages, spreadsheets and informal updates with a controlled record of what was planned, completed, reviewed and shared.",
      items: [
        { title: "Planning control", text: "Turn the approved baseline into weekly commitments and clear daily obligations." },
        { title: "Field evidence", text: "Capture structured daily and weekly site journals directly from the project team." },
        { title: "Governed approvals", text: "Review, approve and publish through a traceable process with protected records." },
        { title: "Client confidence", text: "Give clients a clear, read-only view of validated progress and published updates." },
      ],
    },
    workflow: {
      eyebrow: "A disciplined workflow",
      title: "One connected path from plan to proof.",
      body: "Each stage creates the next obligation, so reporting follows the work instead of becoming a separate administrative task.",
      steps: [
        ["01", "Baseline plan", "Approve the project structure, milestones and measurable scope."],
        ["02", "Weekly work plan", "Commit activities, dates and accountable team members."],
        ["03", "Site journals", "Record daily execution and consolidate the weekly account."],
        ["04", "Review & approval", "Validate the record before anything reaches the client."],
        ["05", "Client visibility", "Publish trusted progress into a clear project portal."],
      ],
    },
    clients: {
      eyebrow: "Designed for confidence",
      title: "Give clients clarity without exposing unfinished work.",
      body: "The client portal shows only information your team has reviewed and published: approved milestones, progress, journals, photos and project documents.",
      bullets: ["Validated progress at a glance", "Published reports and project records", "A permanent, chronological project journal"],
      action: "Sign in to your portal",
    },
    audiences: {
      eyebrow: "Built for every project role",
      title: "The right information, for the right person.",
      items: [
        ["Construction leaders", "Control projects, approvals, compliance and portfolio performance from one place."],
        ["Engineers & field teams", "Plan the week, report the day and keep execution aligned with approved scope."],
        ["Clients & partners", "Follow verified progress without navigating internal drafts or operational noise."],
      ],
    },
    cta: {
      title: "Build structures. Build trust.",
      body: "Bring planning, execution evidence and client reporting into one professional system.",
      primary: "Sign in to BuildTrust",
      secondary: "Talk to NED",
    },
    footer: { by: "A digital project-delivery platform by", rights: "All rights reserved.", privacy: "Secure access" },
  },
  fr: {
    nav: { product: "Produit", workflow: "Processus", clients: "Pour les clients", company: "Site de NED", signin: "Se connecter" },
    hero: {
      eyebrow: "L’intelligence chantier par NED",
      title: "Chaque décision. Visible. Vérifiée.",
      body: "BuildTrust réunit planification, exécution terrain, validations et communication client dans un registre de chantier rigoureux.",
      signin: "Accéder à BuildTrust",
      discover: "Découvrir le processus",
      proof: "Conçu pour une exécution responsable",
    },
    value: {
      eyebrow: "Une source unique de vérité",
      title: "Du planning de référence au client, rien ne se perd.",
      body: "Remplacez les messages dispersés, les tableaux et les mises à jour informelles par un suivi maîtrisé de ce qui a été planifié, exécuté, vérifié et partagé.",
      items: [
        { title: "Maîtrise de la planification", text: "Transformez le planning approuvé en engagements hebdomadaires et obligations quotidiennes claires." },
        { title: "Preuves terrain", text: "Renseignez des journaux de chantier quotidiens et hebdomadaires structurés." },
        { title: "Validations gouvernées", text: "Vérifiez, approuvez et publiez selon un processus traçable aux données protégées." },
        { title: "Confiance du client", text: "Offrez aux clients une vue claire et en lecture seule des progrès validés." },
      ],
    },
    workflow: {
      eyebrow: "Un processus rigoureux",
      title: "Un parcours continu, du plan à la preuve.",
      body: "Chaque étape crée l’obligation suivante, afin que le reporting suive les travaux au lieu de devenir une tâche administrative isolée.",
      steps: [
        ["01", "Planning de référence", "Approuvez la structure, les jalons et les quantités mesurables du projet."],
        ["02", "Plan de travail hebdomadaire", "Engagez les activités, les dates et les responsables."],
        ["03", "Journaux de chantier", "Consignez l’exécution quotidienne et consolidez le bilan hebdomadaire."],
        ["04", "Revue et approbation", "Validez le contenu avant toute visibilité client."],
        ["05", "Visibilité client", "Publiez une progression fiable dans un portail clair."],
      ],
    },
    clients: {
      eyebrow: "Conçu pour la confiance",
      title: "Donnez de la clarté au client sans exposer les travaux non validés.",
      body: "Le portail client affiche uniquement les informations vérifiées et publiées : jalons approuvés, avancement, journaux, photos et documents du projet.",
      bullets: ["Avancement validé en un coup d’œil", "Rapports publiés et pièces du projet", "Journal chronologique et permanent du chantier"],
      action: "Se connecter au portail",
    },
    audiences: {
      eyebrow: "Pour chaque acteur du projet",
      title: "La bonne information, à la bonne personne.",
      items: [
        ["Directions de construction", "Pilotez projets, validations, conformité et performance depuis un seul espace."],
        ["Ingénieurs et équipes terrain", "Planifiez la semaine, rapportez la journée et restez alignés sur le périmètre approuvé."],
        ["Clients et partenaires", "Suivez l’avancement vérifié sans voir les brouillons ni le bruit opérationnel."],
      ],
    },
    cta: {
      title: "Bâtir des structures. Bâtir la confiance.",
      body: "Réunissez planification, preuves d’exécution et information client dans un système professionnel.",
      primary: "Se connecter à BuildTrust",
      secondary: "Parler à NED",
    },
    footer: { by: "Une plateforme numérique de gestion de projet par", rights: "Tous droits réservés.", privacy: "Accès sécurisé" },
  },
} as const;

const featureIcons = [CalendarCheck2, HardHat, ShieldCheck, Users];
const audienceIcons = [BarChart3, ClipboardCheck, FileCheck2];

export default function Index() {
  const [language, setLanguage] = useState<PublicLanguage>(() => {
    const saved = window.localStorage.getItem("buildtrust-public-language");
    return saved === "fr" ? "fr" : "en";
  });
  const [menuOpen, setMenuOpen] = useState(false);
  const reduceMotion = useReducedMotion();
  const t = copy[language];

  const changeLanguage = (next: PublicLanguage) => {
    setLanguage(next);
    window.localStorage.setItem("buildtrust-public-language", next);
  };

  const reveal = reduceMotion ? {} : { initial: { opacity: 0, y: 24 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true, amount: 0.2 }, transition: { duration: 0.55 } };

  return (
    <div className="min-h-screen overflow-x-hidden bg-background text-foreground">
      <header className="fixed inset-x-0 top-0 z-50 border-b border-primary-foreground/15 bg-foreground/80 backdrop-blur-xl">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <a href="#top" className="flex items-center" aria-label="BuildTrust home">
            <img src={logo} alt="BuildTrust" className="h-11 w-auto rounded-sm bg-card object-contain px-2" width={797} height={277} />
          </a>
          <nav className="hidden items-center gap-8 lg:flex" aria-label="Main navigation">
            <a href="#product" className="text-sm font-medium text-primary-foreground/75 transition-colors hover:text-primary-foreground">{t.nav.product}</a>
            <a href="#workflow" className="text-sm font-medium text-primary-foreground/75 transition-colors hover:text-primary-foreground">{t.nav.workflow}</a>
            <a href="#clients" className="text-sm font-medium text-primary-foreground/75 transition-colors hover:text-primary-foreground">{t.nav.clients}</a>
            <a href="https://ned-coral.vercel.app/" target="_blank" rel="noreferrer" className="text-sm font-medium text-primary-foreground/75 transition-colors hover:text-primary-foreground">{t.nav.company}</a>
          </nav>
          <div className="hidden items-center gap-3 lg:flex">
            <div className="flex items-center rounded-md border border-primary-foreground/20 p-1" aria-label="Language">
              {(["en", "fr"] as const).map((lang) => (
                <Button key={lang} variant="ghost" size="sm" onClick={() => changeLanguage(lang)} className={language === lang ? "h-7 bg-primary-foreground text-foreground hover:bg-primary-foreground/90" : "h-7 text-primary-foreground/70 hover:bg-primary-foreground/10 hover:text-primary-foreground"}>
                  {lang.toUpperCase()}
                </Button>
              ))}
            </div>
            <Button asChild className="bg-accent text-accent-foreground hover:bg-accent/90">
              <Link to="/login">{t.nav.signin}<ArrowRight /></Link>
            </Button>
          </div>
          <Button variant="ghost" size="icon" onClick={() => setMenuOpen((open) => !open)} className="text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground lg:hidden" aria-label={menuOpen ? "Close menu" : "Open menu"}>
            {menuOpen ? <X /> : <Menu />}
          </Button>
        </div>
        {menuOpen && (
          <div className="border-t border-primary-foreground/15 bg-foreground px-4 py-5 lg:hidden">
            <nav className="flex flex-col gap-1">
              {[["#product", t.nav.product], ["#workflow", t.nav.workflow], ["#clients", t.nav.clients]] .map(([href, label]) => (
                <a key={href} href={href} onClick={() => setMenuOpen(false)} className="rounded-md px-3 py-3 text-sm font-semibold text-primary-foreground/80 hover:bg-primary-foreground/10">{label}</a>
              ))}
              <div className="mt-3 flex items-center justify-between border-t border-primary-foreground/15 pt-4">
                <Button variant="ghost" size="sm" onClick={() => changeLanguage(language === "en" ? "fr" : "en")} className="text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"><Languages />{language === "en" ? "Français" : "English"}</Button>
                <Button asChild className="bg-accent text-accent-foreground hover:bg-accent/90"><Link to="/login">{t.nav.signin}<ArrowRight /></Link></Button>
              </div>
            </nav>
          </div>
        )}
      </header>

      <main>
        <section id="top" className="relative flex min-h-[min(900px,100svh)] items-end overflow-hidden pt-20">
          <img src={heroImage} alt="Engineer overseeing an active BuildTrust construction project" className="absolute inset-0 h-full w-full object-cover object-center" width={1920} height={1088} fetchPriority="high" />
          <div className="absolute inset-0 bg-gradient-to-r from-foreground via-foreground/80 to-foreground/20" />
          <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 via-transparent to-transparent" />
          <div className="relative mx-auto w-full max-w-7xl px-4 pb-16 pt-28 sm:px-6 sm:pb-20 lg:px-8 lg:pb-24">
            <motion.div initial={reduceMotion ? undefined : { opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }} className="max-w-3xl">
              <p className="mb-5 flex items-center gap-3 text-xs font-bold uppercase tracking-[0.18em] text-accent"><span className="h-px w-10 bg-accent" />{t.hero.eyebrow}</p>
              <h1 className="max-w-3xl text-4xl font-extrabold leading-[1.06] text-primary-foreground sm:text-6xl lg:text-7xl">{t.hero.title}</h1>
              <p className="mt-6 max-w-2xl text-base leading-7 text-primary-foreground/80 sm:text-xl sm:leading-8">{t.hero.body}</p>
              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <Button asChild size="lg" className="h-12 bg-accent px-6 text-accent-foreground hover:bg-accent/90"><Link to="/login">{t.hero.signin}<ArrowRight /></Link></Button>
                <Button asChild size="lg" variant="outline" className="h-12 border-primary-foreground/35 bg-transparent px-6 text-primary-foreground hover:bg-primary-foreground hover:text-foreground"><a href="#workflow">{t.hero.discover}<ChevronRight /></a></Button>
              </div>
              <div className="mt-12 flex items-center gap-3 border-t border-primary-foreground/20 pt-5 text-sm font-medium text-primary-foreground/70"><ShieldCheck className="h-5 w-5 text-accent" />{t.hero.proof}</div>
            </motion.div>
          </div>
        </section>

        <section id="product" className="border-b bg-card py-20 sm:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <motion.div {...reveal} className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:gap-20">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">{t.value.eyebrow}</p>
                <h2 className="mt-4 text-3xl font-bold leading-tight sm:text-5xl">{t.value.title}</h2>
              </div>
              <p className="self-end text-lg leading-8 text-muted-foreground">{t.value.body}</p>
            </motion.div>
            <div className="mt-14 grid border-y md:grid-cols-2 lg:grid-cols-4">
              {t.value.items.map((item, index) => {
                const Icon = featureIcons[index];
                return (
                  <motion.article {...reveal} transition={{ duration: 0.45, delay: index * 0.07 }} key={item.title} className="border-b p-6 md:nth-[2]:border-l lg:border-b-0 lg:border-l lg:first:border-l-0">
                    <div className="flex h-11 w-11 items-center justify-center rounded-md bg-primary/10 text-primary"><Icon className="h-5 w-5" /></div>
                    <h3 className="mt-6 text-lg font-bold">{item.title}</h3>
                    <p className="mt-3 text-sm leading-6 text-muted-foreground">{item.text}</p>
                  </motion.article>
                );
              })}
            </div>
          </div>
        </section>

        <section id="workflow" className="bg-secondary py-20 sm:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <motion.div {...reveal} className="max-w-3xl">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">{t.workflow.eyebrow}</p>
              <h2 className="mt-4 text-3xl font-bold leading-tight sm:text-5xl">{t.workflow.title}</h2>
              <p className="mt-5 text-lg leading-8 text-muted-foreground">{t.workflow.body}</p>
            </motion.div>
            <div className="mt-14 grid gap-px overflow-hidden rounded-lg border bg-border lg:grid-cols-5">
              {t.workflow.steps.map(([number, title, text], index) => (
                <motion.article {...reveal} transition={{ duration: 0.45, delay: index * 0.06 }} key={number} className="relative min-h-64 bg-card p-6">
                  <span className="text-sm font-bold text-accent">{number}</span>
                  <div className="absolute right-5 top-5 flex h-8 w-8 items-center justify-center rounded-full border text-muted-foreground"><ChevronRight className="h-4 w-4" /></div>
                  <h3 className="mt-20 text-lg font-bold">{title}</h3>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">{text}</p>
                </motion.article>
              ))}
            </div>
          </div>
        </section>

        <section id="clients" className="bg-foreground py-20 text-primary-foreground sm:py-28">
          <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:gap-20 lg:px-8">
            <motion.div {...reveal} className="relative overflow-hidden rounded-lg">
              <img src={clientReviewImage} alt="Construction professional reviewing verified project progress with a client" className="aspect-[7/5] h-full w-full object-cover" width={1408} height={1008} loading="lazy" />
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-foreground/90 to-transparent p-6 pt-20">
                <div className="flex items-center gap-2 text-sm font-semibold"><ShieldCheck className="h-5 w-5 text-accent" />{t.clients.bullets[0]}</div>
              </div>
            </motion.div>
            <motion.div {...reveal}>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">{t.clients.eyebrow}</p>
              <h2 className="mt-4 text-3xl font-bold leading-tight sm:text-5xl">{t.clients.title}</h2>
              <p className="mt-6 text-lg leading-8 text-primary-foreground/70">{t.clients.body}</p>
              <ul className="mt-8 space-y-4">
                {t.clients.bullets.map((bullet) => <li key={bullet} className="flex items-start gap-3 text-sm font-medium text-primary-foreground/85"><span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground"><Check className="h-3 w-3" /></span>{bullet}</li>)}
              </ul>
              <Button asChild size="lg" className="mt-9 bg-accent text-accent-foreground hover:bg-accent/90"><Link to="/login">{t.clients.action}<ArrowRight /></Link></Button>
            </motion.div>
          </div>
        </section>

        <section className="bg-background py-20 sm:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <motion.div {...reveal} className="text-center">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">{t.audiences.eyebrow}</p>
              <h2 className="mx-auto mt-4 max-w-3xl text-3xl font-bold leading-tight sm:text-5xl">{t.audiences.title}</h2>
            </motion.div>
            <div className="mt-14 grid gap-5 md:grid-cols-3">
              {t.audiences.items.map(([title, text], index) => {
                const Icon = audienceIcons[index];
                return <motion.article {...reveal} transition={{ duration: 0.45, delay: index * 0.08 }} key={title} className="rounded-lg border bg-card p-7 shadow-sm"><Icon className="h-7 w-7 text-primary" /><h3 className="mt-8 text-xl font-bold">{title}</h3><p className="mt-3 text-sm leading-6 text-muted-foreground">{text}</p></motion.article>;
              })}
            </div>
          </div>
        </section>

        <section className="border-y bg-primary py-16 text-primary-foreground sm:py-20">
          <motion.div {...reveal} className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-8 px-4 sm:px-6 lg:flex-row lg:items-center lg:px-8">
            <div className="max-w-2xl"><h2 className="text-3xl font-bold sm:text-4xl">{t.cta.title}</h2><p className="mt-3 text-base leading-7 text-primary-foreground/75">{t.cta.body}</p></div>
            <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
              <Button asChild size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90"><Link to="/login">{t.cta.primary}<ArrowRight /></Link></Button>
              <Button asChild size="lg" variant="outline" className="border-primary-foreground/30 bg-transparent text-primary-foreground hover:bg-primary-foreground hover:text-primary"><a href="https://ned-coral.vercel.app/#contact" target="_blank" rel="noreferrer">{t.cta.secondary}</a></Button>
            </div>
          </motion.div>
        </section>
      </main>

      <footer className="bg-foreground py-10 text-primary-foreground/65">
        <div className="mx-auto flex max-w-7xl flex-col gap-8 px-4 sm:px-6 md:flex-row md:items-end md:justify-between lg:px-8">
          <div><img src={logo} alt="BuildTrust" className="h-10 w-auto rounded-sm bg-card object-contain px-2" width={797} height={277} loading="lazy" /><p className="mt-4 text-sm">{t.footer.by} <a href="https://ned-coral.vercel.app/" target="_blank" rel="noreferrer" className="font-semibold text-primary-foreground hover:text-accent">NED Engineering & Design</a>.</p></div>
          <div className="flex flex-wrap items-center gap-5 text-xs"><span>© {new Date().getFullYear()} BuildTrust. {t.footer.rights}</span><span className="flex items-center gap-1.5"><ShieldCheck className="h-4 w-4 text-accent" />{t.footer.privacy}</span></div>
        </div>
      </footer>
    </div>
  );
}
