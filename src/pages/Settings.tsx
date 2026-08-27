import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useIsAdmin, useIsSuperAdmin } from "@/hooks/useBuildTrust";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Loader2, Download, Shield, Bell, User, Building2, Workflow, FileText, Users as UsersIcon, ScrollText, Languages, Globe, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { UserManagementSection } from "./Team";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { loadTranslationOverrides } from "@/i18n";
import { useTranslation } from "react-i18next";

export default function Settings() {
  const isAdmin = useIsAdmin();
  const isSuperAdmin = useIsSuperAdmin();
  const { t } = useTranslation();
  const tabs = useMemo(() => {
    const base = [
      { v: "profile", label: t("settings.profile"), icon: User },
      { v: "security", label: t("settings.security"), icon: Shield },
      { v: "notifications", label: t("settings.notifications"), icon: Bell },
      { v: "language", label: t("settings.language"), icon: Languages },
    ];
    const admin = [
      { v: "company", label: t("settings.company"), icon: Building2 },
      { v: "workflow", label: t("settings.workflow"), icon: Workflow },
      { v: "signature", label: t("settings.signature"), icon: FileText },
      { v: "users", label: t("settings.users"), icon: UsersIcon },
      { v: "audit", label: t("settings.audit"), icon: ScrollText },
      { v: "export", label: t("settings.export"), icon: Download },
    ];
    const superAdmin = [{ v: "translations", label: t("settings.translations"), icon: Globe }];
    const out = [...base];
    if (!isAdmin) out.push({ v: "signature", label: t("settings.signature"), icon: FileText });
    if (isAdmin) out.push(...admin);
    if (isSuperAdmin) out.push(...superAdmin);
    return out;
  }, [isAdmin, isSuperAdmin, t]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold">{t("settings.title")}</h1>
        <p className="text-muted-foreground text-sm mt-1">{t("settings.subtitle")}</p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="flex flex-wrap h-auto justify-start">
          {tabs.map((t) => (
            <TabsTrigger key={t.v} value={t.v} className="gap-2">
              <t.icon className="h-4 w-4" />
              {t.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="profile"><ProfileSection /></TabsContent>
        <TabsContent value="security"><SecuritySection /></TabsContent>
        <TabsContent value="notifications"><NotificationsSection /></TabsContent>
        <TabsContent value="language"><LanguageSection /></TabsContent>
        <TabsContent value="signature"><SignatureSection /></TabsContent>
        {isAdmin && (
          <>
            <TabsContent value="company"><CompanySection /></TabsContent>
            <TabsContent value="workflow"><WorkflowSection /></TabsContent>
            <TabsContent value="users"><UserManagementSection /></TabsContent>
            <TabsContent value="audit"><AuditLogSection /></TabsContent>
            <TabsContent value="export"><DataExportSection /></TabsContent>
          </>
        )}
        {isSuperAdmin && (
          <TabsContent value="translations"><TranslationsSection /></TabsContent>
        )}
      </Tabs>
    </div>
  );
}

/* -------------------- Language (all users) -------------------- */
function LanguageSection() {
  const { t } = useTranslation();
  return (
    <div className="metric-card max-w-2xl space-y-4">
      <div>
        <h3 className="font-display font-bold">{t("settings.languageTitle")}</h3>
        <p className="text-sm text-muted-foreground">{t("settings.languageDesc")}</p>
      </div>
      <LanguageSwitcher />
    </div>
  );
}

/* -------------------- Translations (super-admin) -------------------- */
function TranslationsSection() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["translations"],
    queryFn: async () => {
      const { data, error } = await supabase.from("translations").select("*").order("key");
      if (error) throw error;
      return data ?? [];
    },
  });
  const [newKey, setNewKey] = useState("");
  const [newEn, setNewEn] = useState("");
  const [newFr, setNewFr] = useState("");
  const [edits, setEdits] = useState<Record<string, { en: string; fr: string }>>({});
  const [busy, setBusy] = useState<string | null>(null);

  const refresh = async () => {
    await qc.invalidateQueries({ queryKey: ["translations"] });
    await loadTranslationOverrides();
  };

  const add = async () => {
    const key = newKey.trim();
    if (!key || !newEn.trim() || !newFr.trim()) return toast.error("Key, English and French are required");
    setBusy("add");
    try {
      const { error } = await supabase.from("translations").insert({ key, en: newEn.trim(), fr: newFr.trim() });
      if (error) throw error;
      setNewKey(""); setNewEn(""); setNewFr("");
      toast.success("Translation added");
      await refresh();
    } catch (e: any) { toast.error(e.message ?? "Failed"); }
    finally { setBusy(null); }
  };

  const save = async (id: string) => {
    const v = edits[id]; if (!v) return;
    setBusy(id);
    try {
      const { error } = await supabase.from("translations").update({ en: v.en, fr: v.fr }).eq("id", id);
      if (error) throw error;
      toast.success("Saved");
      setEdits((prev) => { const n = { ...prev }; delete n[id]; return n; });
      await refresh();
    } catch (e: any) { toast.error(e.message ?? "Failed"); }
    finally { setBusy(null); }
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this translation entry?")) return;
    setBusy(id);
    try {
      const { error } = await supabase.from("translations").delete().eq("id", id);
      if (error) throw error;
      toast.success("Deleted");
      await refresh();
    } catch (e: any) { toast.error(e.message ?? "Failed"); }
    finally { setBusy(null); }
  };

  return (
    <div className="space-y-3 max-w-4xl">
      <div className="metric-card">
        <h3 className="font-display font-bold">{t("settings.translationsTitle")}</h3>
        <p className="text-sm text-muted-foreground">{t("settings.translationsDesc")}</p>
      </div>

      <div className="metric-card grid gap-3 sm:grid-cols-[1fr,1fr,1fr,auto] items-end">
        <div className="space-y-2">
          <Label>{t("settings.keyLabel")}</Label>
          <Input value={newKey} onChange={(e) => setNewKey(e.target.value)} placeholder="nav.projects" />
        </div>
        <div className="space-y-2">
          <Label>English</Label>
          <Input value={newEn} onChange={(e) => setNewEn(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Français</Label>
          <Input value={newFr} onChange={(e) => setNewFr(e.target.value)} />
        </div>
        <Button onClick={add} disabled={busy === "add"}>
          {busy === "add" && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          {t("settings.addEntry")}
        </Button>
      </div>

      {isLoading ? (
        <div className="metric-card text-center py-10"><Loader2 className="h-5 w-5 mx-auto animate-spin" /></div>
      ) : rows.length === 0 ? (
        <div className="metric-card text-sm text-muted-foreground text-center py-6">No custom translations yet.</div>
      ) : (
        rows.map((r: any) => {
          const v = edits[r.id] ?? { en: r.en, fr: r.fr };
          const dirty = v.en !== r.en || v.fr !== r.fr;
          return (
            <div key={r.id} className="metric-card grid gap-3 sm:grid-cols-[200px,1fr,1fr,auto,auto] items-end">
              <div className="text-xs font-mono text-muted-foreground break-all">{r.key}</div>
              <Input value={v.en} onChange={(e) => setEdits({ ...edits, [r.id]: { ...v, en: e.target.value } })} />
              <Input value={v.fr} onChange={(e) => setEdits({ ...edits, [r.id]: { ...v, fr: e.target.value } })} />
              <Button size="sm" onClick={() => save(r.id)} disabled={!dirty || busy === r.id}>
                {busy === r.id ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
              </Button>
              <Button size="sm" variant="outline" onClick={() => remove(r.id)} disabled={busy === r.id}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          );
        })
      )}
    </div>
  );
}


/* -------------------- Profile -------------------- */
function ProfileSection() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [fullName, setFullName] = useState("");
  const [company, setCompany] = useState("");
  const [initials, setInitials] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase.from("profiles").select("full_name, company, avatar_initials").eq("user_id", user.id).maybeSingle();
      if (data) {
        setFullName(data.full_name ?? "");
        setCompany(data.company ?? "");
        setInitials(data.avatar_initials ?? "");
      }
    })();
  }, [user]);

  const save = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const { error } = await supabase.from("profiles").update({
        full_name: fullName.trim() || null,
        company: company.trim() || null,
        avatar_initials: (initials.trim() || fullName.trim().split(" ").map((n) => n[0]).slice(0, 2).join("")).toUpperCase().slice(0, 3) || null,
      }).eq("user_id", user.id);
      if (error) throw error;
      toast.success("Profile saved");
      qc.invalidateQueries({ queryKey: ["profiles"] });
    } catch (e: any) {
      toast.error(e.message ?? "Failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="metric-card max-w-2xl space-y-4">
      <div>
        <h3 className="font-display font-bold">Profile</h3>
        <p className="text-sm text-muted-foreground">Your name and how teammates see you.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <Label>Full name</Label>
          <Input value={fullName} onChange={(e) => setFullName(e.target.value)} maxLength={120} />
        </div>
        <div className="space-y-2">
          <Label>Company</Label>
          <Input value={company} onChange={(e) => setCompany(e.target.value)} maxLength={120} />
        </div>
        <div className="space-y-2">
          <Label>Avatar initials</Label>
          <Input value={initials} onChange={(e) => setInitials(e.target.value.toUpperCase())} maxLength={3} placeholder="Auto" />
        </div>
      </div>
      <div className="flex justify-end">
        <Button onClick={save} disabled={saving}>{saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Save</Button>
      </div>
    </div>
  );
}

/* -------------------- Security (password) -------------------- */
function SecuritySection() {
  const [pw, setPw] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (pw.length < 8) return toast.error("Password must be at least 8 characters");
    if (pw !== confirm) return toast.error("Passwords do not match");
    setBusy(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: pw });
      if (error) throw error;
      toast.success("Password updated");
      setPw(""); setConfirm("");
    } catch (e: any) {
      toast.error(e.message ?? "Failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="metric-card max-w-lg space-y-4">
      <div>
        <h3 className="font-display font-bold">Password & security</h3>
        <p className="text-sm text-muted-foreground">Change your sign-in password.</p>
      </div>
      <div className="space-y-2">
        <Label>New password</Label>
        <Input type="password" value={pw} onChange={(e) => setPw(e.target.value)} autoComplete="new-password" />
      </div>
      <div className="space-y-2">
        <Label>Confirm new password</Label>
        <Input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password" />
      </div>
      <div className="flex justify-end">
        <Button onClick={submit} disabled={busy}>{busy && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Update password</Button>
      </div>
    </div>
  );
}

/* -------------------- Notification preferences -------------------- */
const NOTIF_FIELDS: { key: string; label: string; desc: string }[] = [
  { key: "notify_report_approved", label: "Report approved", desc: "When one of your reports is approved" },
  { key: "notify_report_rejected", label: "Report rejected", desc: "When one of your reports is rejected" },
  { key: "notify_new_issue", label: "New issue", desc: "When an issue is raised on your projects" },
  { key: "notify_milestone_updated", label: "Milestone updated", desc: "When a milestone changes status" },
  { key: "notify_task_assigned", label: "Task assigned", desc: "When a task is assigned to you" },
  { key: "notify_media_published", label: "Media published", desc: "When new photos or documents are published" },
];

function NotificationsSection() {
  const { user } = useAuth();
  const [prefs, setPrefs] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase.from("user_preferences").select("*").eq("user_id", user.id).maybeSingle();
      const next: Record<string, boolean> = {};
      NOTIF_FIELDS.forEach((f) => { next[f.key] = data ? !!(data as any)[f.key] : true; });
      setPrefs(next);
      setLoading(false);
    })();
  }, [user]);

  const save = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const { error } = await supabase.from("user_preferences").upsert({ user_id: user.id, ...prefs });
      if (error) throw error;
      toast.success("Preferences saved");
    } catch (e: any) {
      toast.error(e.message ?? "Failed");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="metric-card text-center py-10"><Loader2 className="h-5 w-5 mx-auto animate-spin text-muted-foreground" /></div>;

  return (
    <div className="metric-card max-w-2xl space-y-4">
      <div>
        <h3 className="font-display font-bold">Notification preferences</h3>
        <p className="text-sm text-muted-foreground">Choose which events trigger an alert.</p>
      </div>
      <div className="divide-y">
        {NOTIF_FIELDS.map((f) => (
          <div key={f.key} className="flex items-center justify-between py-3 gap-4">
            <div>
              <p className="text-sm font-medium">{f.label}</p>
              <p className="text-xs text-muted-foreground">{f.desc}</p>
            </div>
            <Switch checked={!!prefs[f.key]} onCheckedChange={(v) => setPrefs({ ...prefs, [f.key]: v })} />
          </div>
        ))}
      </div>
      <div className="flex justify-end">
        <Button onClick={save} disabled={saving}>{saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Save</Button>
      </div>
    </div>
  );
}

/* -------------------- Registered signature (versioned, stamped on approvals) -------------------- */
function SignatureSection() {
  const { data: current, isLoading } = useSignatureProfile();
  const register = useRegisterSignature();
  const [initials, setInitials] = useState("");

  const save = async () => {
    if (!initials.trim()) { toast.error("Enter your initials"); return; }
    try {
      await register.mutateAsync({ kind: "initials", initials: initials.trim().toUpperCase() });
      toast.success("Signature registered — it will be stamped on your future reports and approvals");
      setInitials("");
    } catch (e: any) {
      toast.error(e.message ?? "Failed");
    }
  };

  return (
    <div className="metric-card max-w-2xl space-y-4">
      <div>
        <h3 className="font-display font-bold">Registered signature</h3>
        <p className="text-sm text-muted-foreground">
          Your registered signature is snapshotted onto every report you submit or approve. Re-registering creates a new version; past reports keep the signature that was current at the time.
        </p>
      </div>
      {isLoading ? (
        <div className="flex justify-center py-4"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
      ) : current ? (
        <div className="rounded-lg border bg-muted/40 p-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Current signature (v{(current as any).version ?? 1})</p>
            <p className="text-xs text-muted-foreground">Registered {(current as any).created_at ? new Date((current as any).created_at).toLocaleDateString() : ""}</p>
          </div>
          <span className="font-display text-2xl font-bold tracking-widest text-primary">{(current as any).initials ?? "—"}</span>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground rounded-lg border border-dashed p-4">No signature registered yet. Register one to sign reports and approvals.</p>
      )}
      <div className="space-y-2">
        <Label htmlFor="sig-initials">{current ? "Re-register (new version)" : "Your initials"}</Label>
        <Input id="sig-initials" value={initials} onChange={(e) => setInitials(e.target.value)} maxLength={6} placeholder="e.g. A.P." className="max-w-[200px] uppercase" />
      </div>
      <div className="flex justify-end">
        <Button onClick={save} disabled={register.isPending}>{register.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}{current ? "Register new version" : "Register signature"}</Button>
      </div>
    </div>
  );
}

/* -------------------- Company info (admin) -------------------- */
function CompanySection() {
  const qc = useQueryClient();
  const { data: companies = [], isLoading } = useQuery({
    queryKey: ["companies"],
    queryFn: async () => {
      const { data, error } = await supabase.from("companies").select("*").order("created_at");
      if (error) throw error;
      return data ?? [];
    },
  });
  const [edits, setEdits] = useState<Record<string, { name: string; country: string }>>({});
  const [savingId, setSavingId] = useState<string | null>(null);

  const save = async (id: string) => {
    const e = edits[id]; if (!e) return;
    setSavingId(id);
    try {
      const { error } = await supabase.from("companies").update({ name: e.name.trim(), country: e.country.trim() || null }).eq("id", id);
      if (error) throw error;
      toast.success("Company saved");
      qc.invalidateQueries({ queryKey: ["companies"] });
    } catch (err: any) {
      toast.error(err.message ?? "Failed");
    } finally { setSavingId(null); }
  };

  if (isLoading) return <div className="metric-card text-center py-10"><Loader2 className="h-5 w-5 mx-auto animate-spin" /></div>;

  return (
    <div className="space-y-3 max-w-3xl">
      <div className="metric-card">
        <h3 className="font-display font-bold">Companies</h3>
        <p className="text-sm text-muted-foreground">Edit company name and country.</p>
      </div>
      {companies.length === 0 && <div className="metric-card text-sm text-muted-foreground">No companies yet.</div>}
      {companies.map((c: any) => {
        const v = edits[c.id] ?? { name: c.name ?? "", country: c.country ?? "" };
        return (
          <div key={c.id} className="metric-card grid gap-3 sm:grid-cols-[1fr,200px,auto] items-end">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input value={v.name} onChange={(e) => setEdits({ ...edits, [c.id]: { ...v, name: e.target.value } })} />
            </div>
            <div className="space-y-2">
              <Label>Country</Label>
              <Input value={v.country} onChange={(e) => setEdits({ ...edits, [c.id]: { ...v, country: e.target.value } })} />
            </div>
            <Button onClick={() => save(c.id)} disabled={savingId === c.id}>
              {savingId === c.id && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Save
            </Button>
          </div>
        );
      })}
    </div>
  );
}

/* -------------------- Workflow rules + project defaults (admin) -------------------- */
function WorkflowSection() {
  const qc = useQueryClient();
  const { data: companies = [] } = useQuery({
    queryKey: ["companies"],
    queryFn: async () => (await supabase.from("companies").select("*").order("created_at")).data ?? [],
  });
  const [selectedId, setSelectedId] = useState<string>("");
  const companyId = selectedId || companies[0]?.id;
  const { data: settings, isLoading } = useQuery({
    queryKey: ["company_settings", companyId],
    enabled: !!companyId,
    queryFn: async () => {
      const { data } = await supabase.from("company_settings").select("*").eq("company_id", companyId).maybeSingle();
      return data;
    },
  });
  const [form, setForm] = useState<any>({
    auto_publish_on_approval: true,
    require_dual_approval: false,
    default_report_template: "",
    default_milestone_template: "",
  });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (settings) setForm({
      auto_publish_on_approval: settings.auto_publish_on_approval,
      require_dual_approval: settings.require_dual_approval,
      default_report_template: settings.default_report_template ?? "",
      default_milestone_template: settings.default_milestone_template ?? "",
    });
  }, [settings]);

  const save = async () => {
    if (!companyId) return;
    setBusy(true);
    try {
      const { error } = await supabase.from("company_settings").upsert({ company_id: companyId, ...form });
      if (error) throw error;
      toast.success("Settings saved");
      qc.invalidateQueries({ queryKey: ["company_settings", companyId] });
    } catch (e: any) { toast.error(e.message ?? "Failed"); }
    finally { setBusy(false); }
  };

  if (!companies.length) return <div className="metric-card text-sm text-muted-foreground">Create a company first.</div>;

  return (
    <div className="metric-card max-w-2xl space-y-4">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h3 className="font-display font-bold">Workflow & project defaults</h3>
          <p className="text-sm text-muted-foreground">Approval rules and templates per company.</p>
        </div>
        <select className="text-sm border rounded-md px-3 py-2 bg-background" value={companyId ?? ""} onChange={(e) => setSelectedId(e.target.value)}>
          {companies.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : (
        <>
          <div className="flex items-center justify-between py-3 border-t gap-4">
            <div>
              <p className="text-sm font-medium">Auto-publish after approval</p>
              <p className="text-xs text-muted-foreground">Approved reports are immediately visible in the client portal.</p>
            </div>
            <Switch checked={form.auto_publish_on_approval} onCheckedChange={(v) => setForm({ ...form, auto_publish_on_approval: v })} />
          </div>
          <div className="flex items-center justify-between py-3 border-t gap-4">
            <div>
              <p className="text-sm font-medium">Require dual approval</p>
              <p className="text-xs text-muted-foreground">Two reviewers must approve before publishing.</p>
            </div>
            <Switch checked={form.require_dual_approval} onCheckedChange={(v) => setForm({ ...form, require_dual_approval: v })} />
          </div>
          <div className="space-y-2 pt-3 border-t">
            <Label>Default report template</Label>
            <Textarea rows={3} value={form.default_report_template} onChange={(e) => setForm({ ...form, default_report_template: e.target.value })} placeholder="Boilerplate text inserted into new reports" />
          </div>
          <div className="space-y-2">
            <Label>Default milestone structure</Label>
            <Textarea rows={3} value={form.default_milestone_template} onChange={(e) => setForm({ ...form, default_milestone_template: e.target.value })} placeholder="One milestone per line" />
          </div>
          <div className="flex justify-end">
            <Button onClick={save} disabled={busy}>{busy && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Save</Button>
          </div>
        </>
      )}
    </div>
  );
}

/* -------------------- Audit log (admin) -------------------- */
function AuditLogSection() {
  const { data: logs = [], isLoading } = useQuery({
    queryKey: ["audit_log"],
    queryFn: async () => {
      const { data, error } = await supabase.from("audit_log").select("*").order("created_at", { ascending: false }).limit(200);
      if (error) throw error;
      return data ?? [];
    },
  });

  return (
    <div className="space-y-3">
      <div className="metric-card">
        <h3 className="font-display font-bold">Audit log</h3>
        <p className="text-sm text-muted-foreground">Most recent 200 events.</p>
      </div>
      {isLoading ? (
        <div className="metric-card text-center py-10"><Loader2 className="h-5 w-5 mx-auto animate-spin" /></div>
      ) : logs.length === 0 ? (
        <div className="metric-card text-sm text-muted-foreground text-center py-10">No events yet.</div>
      ) : (
        <div className="metric-card overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
              <tr><th className="text-left p-3">When</th><th className="text-left p-3">Action</th><th className="text-left p-3">Entity</th><th className="text-left p-3">Actor</th></tr>
            </thead>
            <tbody>
              {logs.map((l: any) => (
                <tr key={l.id} className="border-t">
                  <td className="p-3 whitespace-nowrap">{new Date(l.created_at).toLocaleString()}</td>
                  <td className="p-3 font-medium">{l.action}</td>
                  <td className="p-3 text-muted-foreground">{l.entity_type ?? "—"}{l.entity_id ? ` · ${String(l.entity_id).slice(0, 8)}` : ""}</td>
                  <td className="p-3 text-muted-foreground">{l.actor_id ? String(l.actor_id).slice(0, 8) : "system"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* -------------------- Data export (admin) -------------------- */
function DataExportSection() {
  const [busy, setBusy] = useState<string | null>(null);

  const exportTable = async (table: "projects" | "progress_reports" | "report_issues" | "milestones" | "daily_reports") => {
    setBusy(table);
    try {
      const { data, error } = await supabase.from(table).select("*").limit(1000);
      if (error) throw error;
      const rows = data ?? [];
      if (!rows.length) { toast.info("Nothing to export"); return; }
      const headers = Object.keys(rows[0]);
      const escape = (v: any) => {
        if (v == null) return "";
        const s = typeof v === "object" ? JSON.stringify(v) : String(v);
        return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
      };
      const csv = [headers.join(","), ...rows.map((r: any) => headers.map((h) => escape(r[h])).join(","))].join("\n");
      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = `${table}-${new Date().toISOString().slice(0, 10)}.csv`; a.click();
      URL.revokeObjectURL(url);
      toast.success(`Exported ${rows.length} row${rows.length === 1 ? "" : "s"}`);
    } catch (e: any) {
      toast.error(e.message ?? "Failed");
    } finally { setBusy(null); }
  };

  const items: { key: any; label: string; desc: string }[] = [
    { key: "projects", label: "Projects", desc: "All project records" },
    { key: "progress_reports", label: "Weekly reports", desc: "All submitted weekly reports" },
    { key: "daily_reports", label: "Daily reports", desc: "All submitted daily reports" },
    { key: "milestones", label: "Milestones", desc: "Milestones with status and progress" },
    { key: "report_issues", label: "Issues", desc: "Issues raised in the field" },
  ];

  return (
    <div className="space-y-3 max-w-2xl">
      <div className="metric-card">
        <h3 className="font-display font-bold">Data export</h3>
        <p className="text-sm text-muted-foreground">Download CSV snapshots of your operational data.</p>
      </div>
      {items.map((i) => (
        <div key={i.key} className="metric-card flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium">{i.label}</p>
            <p className="text-xs text-muted-foreground">{i.desc}</p>
          </div>
          <Button variant="outline" onClick={() => exportTable(i.key)} disabled={busy === i.key}>
            {busy === i.key ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}CSV
          </Button>
        </div>
      ))}
    </div>
  );
}
