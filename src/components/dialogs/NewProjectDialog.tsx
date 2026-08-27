import { useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useCreateProject, useIsAdmin, useClientUsers, useAllProfiles } from "@/hooks/useBuildTrust";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, FileUp, X, Check, ChevronLeft, ChevronRight, Info, Users, UserRound, FolderOpen, ClipboardCheck, Search } from "lucide-react";
import { cn } from "@/lib/utils";

type DocEntry = { file: File; title: string };
type MemberRole = "manager" | "engineer" | "technician" | "client";
type Member = { user_id: string; role: MemberRole };

const STEPS = [
  { key: "details", label: "Project details", icon: Info },
  { key: "client", label: "Client", icon: UserRound },
  { key: "team", label: "Team", icon: Users },
  { key: "docs", label: "Documents", icon: FolderOpen },
  { key: "review", label: "Review", icon: ClipboardCheck },
] as const;

const ROLE_LABELS: Record<MemberRole, string> = {
  manager: "Manager",
  engineer: "Engineer",
  technician: "Technician",
  client: "Client",
};

export function NewProjectDialog() {
  const isAdmin = useIsAdmin();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({ title: "", type: "", location: "", start_date: "", client_full_name: "", client_email: "" });
  const [creds, setCreds] = useState<{ email: string; password: string | null; created: boolean } | null>(null);

  const [members, setMembers] = useState<Member[]>([]);
  const [memberSearch, setMemberSearch] = useState("");
  const [docs, setDocs] = useState<DocEntry[]>([]);
  const createProject = useCreateProject();
  const { data: clients = [] } = useClientUsers();
  const { data: profiles = [] } = useAllProfiles();

  const clientIds = useMemo(() => new Set(clients.map((c) => c.user_id)), [clients]);

  const teamCandidates = useMemo(() => {
    const q = memberSearch.trim().toLowerCase();
    return (profiles as any[])
      .filter((p) => p.is_active !== false && !clientIds.has(p.user_id))
      .filter((p) => !q || (p.full_name ?? "").toLowerCase().includes(q) || (p.company ?? "").toLowerCase().includes(q))
      .sort((a, b) => (a.full_name ?? "").localeCompare(b.full_name ?? ""));
  }, [profiles, clientIds, memberSearch]);

  const nameOf = (userId: string) => {
    const p = (profiles as any[]).find((x) => x.user_id === userId);
    return p?.full_name || clients.find((c) => c.user_id === userId)?.full_name || userId.slice(0, 8);
  };

  if (!isAdmin) return null;

  const reset = () => {
    setStep(0);
    setForm({ title: "", type: "", location: "", start_date: "", client_full_name: "", client_email: "" });
    setMembers([]);
    setDocs([]);
    setMemberSearch("");
    setCreds(null);
  };

  const addFiles = (list: FileList | null) => {
    if (!list) return;
    setDocs((prev) => [...prev, ...Array.from(list).map((f) => ({ file: f, title: f.name.replace(/\.[^.]+$/, "") }))]);
  };

  const toggleMember = (userId: string) => {
    setMembers((prev) =>
      prev.some((m) => m.user_id === userId)
        ? prev.filter((m) => m.user_id !== userId)
        : [...prev, { user_id: userId, role: "technician" }]
    );
  };

  const setMemberRole = (userId: string, role: MemberRole) =>
    setMembers((prev) => prev.map((m) => (m.user_id === userId ? { ...m, role } : m)));

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.client_email.trim());

  const stepValid = (index: number) => {
    if (index === 0) return form.title.trim().length > 0;
    if (index === 1) return form.client_full_name.trim().length > 0 && emailValid;
    if (index === 3) return docs.every((d) => d.title.trim().length > 0);
    return true;
  };

  const stepError = (index: number) =>
    index === 0
      ? "Project title is required"
      : index === 1
        ? "Client full name and a valid email are required"
        : "Each document needs a title";

  const next = () => {
    if (!stepValid(step)) {
      toast.error(stepError(step));
      return;
    }
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };

  const submit = async () => {
    for (const i of [0, 1, 3]) {
      if (!stepValid(i)) {
        toast.error(stepError(i));
        setStep(i);
        return;
      }
    }
    try {
      const created: any = await createProject.mutateAsync({
        title: form.title.trim(),
        type: form.type || undefined,
        location: form.location || undefined,
        start_date: form.start_date || null,
        client: { email: form.client_email.trim(), full_name: form.client_full_name.trim() },
        members,
        documents: docs.map((d) => ({ file: d.file, title: d.title.trim() })),
      });
      toast.success("Project created");
      if (created?.client_credentials) {
        setCreds(created.client_credentials);
      } else {
        setOpen(false);
        reset();
      }
    } catch (err: any) {
      toast.error(err.message ?? "Failed to create project");
    }
  };


  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) reset(); }}>
      <DialogTrigger asChild>
        <button className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-accent-foreground hover:bg-accent/90 transition-colors">
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">New Project</span>
        </button>
      </DialogTrigger>

      <DialogContent className="max-w-3xl max-h-[92vh] overflow-hidden p-0 gap-0">
        <div className="border-b px-6 py-4">
          <DialogHeader>
            <DialogTitle className="font-display">Create a new project</DialogTitle>
            <DialogDescription>
              Step {step + 1} of {STEPS.length} — {STEPS[step].label}. The project ID is generated automatically.
            </DialogDescription>
          </DialogHeader>
        </div>

        {/* Stepper */}
        <div className="flex items-center gap-1 overflow-x-auto border-b bg-muted/30 px-4 py-3">
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            const done = i < step;
            const active = i === step;
            return (
              <button
                key={s.key}
                type="button"
                onClick={() => (i <= step || stepValid(step) ? setStep(i) : null)}
                className={cn(
                  "flex shrink-0 items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                  active
                    ? "bg-primary text-primary-foreground"
                    : done
                      ? "text-primary hover:bg-primary/10"
                      : "text-muted-foreground hover:bg-muted"
                )}
              >
                <span className={cn("flex h-5 w-5 items-center justify-center rounded-full border text-[10px]", active ? "border-primary-foreground/40" : done ? "border-primary bg-primary/10" : "border-border")}>
                  {done ? <Check className="h-3 w-3" /> : <Icon className="h-3 w-3" />}
                </span>
                <span className="whitespace-nowrap">{s.label}</span>
              </button>
            );
          })}
        </div>

        <div className="max-h-[55vh] overflow-y-auto px-6 py-5">
          {step === 0 && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Project title *</Label>
                <Input id="title" placeholder="e.g. Riverside Bridge Rehabilitation" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="type">Type</Label>
                  <Input id="type" placeholder="Residential, Bridge..." value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} />
                </div>
                <div>
                  <Label htmlFor="start_date">Expected start date</Label>
                  <Input id="start_date" type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} />
                </div>
              </div>
              <div>
                <Label htmlFor="location">Location</Label>
                <Input id="location" placeholder="City, site address" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <div>
                <Label className="flex items-center gap-1.5"><UserRound className="h-4 w-4" /> Client account</Label>
                <p className="mt-1 text-xs text-muted-foreground">
                  A client account is created for this project. If the email already exists, that account is linked instead.
                </p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="client_name">Client full name *</Label>
                  <Input id="client_name" placeholder="Jane Doe" value={form.client_full_name} onChange={(e) => setForm({ ...form, client_full_name: e.target.value })} />
                </div>
                <div>
                  <Label htmlFor="client_email">Client email *</Label>
                  <Input id="client_email" type="email" placeholder="client@company.com" value={form.client_email} onChange={(e) => setForm({ ...form, client_email: e.target.value })} />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                A temporary password is generated at creation and shown once. The client gets read-only access to approved and published data only.
              </p>
            </div>
          )}


          {step === 2 && (
            <div className="space-y-4">
              <div>
                <Label className="flex items-center gap-1.5"><Users className="h-4 w-4" /> Team members</Label>
                <p className="mt-1 text-xs text-muted-foreground">You are added as manager automatically. Select who else works on this project and set their role.</p>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input className="pl-9" placeholder="Search people..." value={memberSearch} onChange={(e) => setMemberSearch(e.target.value)} />
              </div>
              {teamCandidates.length === 0 ? (
                <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                  No team accounts found. Create users from Settings → Users first.
                </div>
              ) : (
                <ul className="divide-y rounded-lg border">
                  {teamCandidates.map((p: any) => {
                    const selected = members.find((m) => m.user_id === p.user_id);
                    return (
                      <li key={p.user_id} className="flex items-center gap-3 p-3">
                        <button
                          type="button"
                          onClick={() => toggleMember(p.user_id)}
                          className={cn(
                            "flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-colors",
                            selected ? "border-primary bg-primary text-primary-foreground" : "border-border"
                          )}
                          aria-label={selected ? "Remove member" : "Add member"}
                        >
                          {selected && <Check className="h-3.5 w-3.5" />}
                        </button>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">{p.full_name || p.user_id.slice(0, 8)}</p>
                          {p.company && <p className="truncate text-xs text-muted-foreground">{p.company}</p>}
                        </div>
                        {selected && (
                          <Select value={selected.role} onValueChange={(v) => setMemberRole(p.user_id, v as MemberRole)}>
                            <SelectTrigger className="h-8 w-36 text-xs"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {(Object.keys(ROLE_LABELS) as MemberRole[]).map((r) => (
                                <SelectItem key={r} value={r}>{ROLE_LABELS[r]}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          )}

          {step === 3 && (
            <div className="space-y-3">
              <Label htmlFor="docs" className="flex items-center gap-1.5"><FileUp className="h-4 w-4" /> Project documents</Label>
              <Input
                id="docs"
                type="file"
                multiple
                accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx,.dwg"
                onChange={(e) => { addFiles(e.target.files); e.target.value = ""; }}
              />
              <p className="text-xs text-muted-foreground">Plans, estimates, contracts... Give each one a clear title.</p>
              {docs.length > 0 && (
                <ul className="space-y-2">
                  {docs.map((d, i) => (
                    <li key={i} className="space-y-1.5 rounded-md border bg-muted/30 p-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate text-xs text-muted-foreground">{d.file.name}</span>
                        <button type="button" onClick={() => setDocs(docs.filter((_, idx) => idx !== i))} className="shrink-0 text-muted-foreground hover:text-destructive" aria-label="Remove">
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <Input
                        placeholder="Document title (e.g. Architectural plan v2)"
                        value={d.title}
                        onChange={(e) => {
                          const next = [...docs];
                          next[i] = { ...next[i], title: e.target.value };
                          setDocs(next);
                        }}
                      />
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {step === 4 && creds && (
            <div className="space-y-4 text-sm">
              <div className="rounded-lg border bg-success/5 p-3">
                {creds.created
                  ? "Project created and client account provisioned. Share these credentials securely — the password is shown only once."
                  : "Project created. This email already had an account and has been linked to the project as client."}
              </div>
              <div className="space-y-2">
                <div>
                  <Label className="text-xs text-muted-foreground">Login URL</Label>
                  <Input readOnly value={`${window.location.origin}/login`} className="font-mono text-xs" />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Email</Label>
                  <Input readOnly value={creds.email} className="font-mono text-xs" />
                </div>
                {creds.password && (
                  <div>
                    <Label className="text-xs text-muted-foreground">Temporary password</Label>
                    <Input readOnly value={creds.password} className="font-mono text-xs" />
                  </div>
                )}
              </div>
            </div>
          )}

          {step === 4 && !creds && (
            <div className="space-y-4 text-sm">
              <section className="rounded-lg border p-4">
                <h3 className="mb-2 font-display font-semibold">Project details</h3>
                <dl className="grid gap-2 sm:grid-cols-2">
                  <div><dt className="text-xs text-muted-foreground">Title</dt><dd>{form.title || "—"}</dd></div>
                  <div><dt className="text-xs text-muted-foreground">Type</dt><dd>{form.type || "—"}</dd></div>
                  <div><dt className="text-xs text-muted-foreground">Location</dt><dd>{form.location || "—"}</dd></div>
                  <div><dt className="text-xs text-muted-foreground">Start date</dt><dd>{form.start_date || "—"}</dd></div>
                </dl>
              </section>
              <section className="rounded-lg border p-4">
                <h3 className="mb-2 font-display font-semibold">Client</h3>
                <p>{form.client_full_name || "—"}</p>
                <p className="text-xs text-muted-foreground">{form.client_email || "—"}</p>
              </section>

              <section className="rounded-lg border p-4">
                <h3 className="mb-2 font-display font-semibold">Team ({members.length + 1})</h3>
                <ul className="space-y-1">
                  <li className="flex justify-between"><span>You</span><span className="text-muted-foreground">Manager</span></li>
                  {members.map((m) => (
                    <li key={m.user_id} className="flex justify-between">
                      <span>{nameOf(m.user_id)}</span>
                      <span className="text-muted-foreground">{ROLE_LABELS[m.role]}</span>
                    </li>
                  ))}
                </ul>
              </section>
              <section className="rounded-lg border p-4">
                <h3 className="mb-2 font-display font-semibold">Documents ({docs.length})</h3>
                {docs.length === 0 ? (
                  <p className="text-muted-foreground">No documents attached</p>
                ) : (
                  <ul className="space-y-1">
                    {docs.map((d, i) => (
                      <li key={i} className="flex justify-between gap-3">
                        <span className="truncate">{d.title}</span>
                        <span className="shrink-0 text-xs text-muted-foreground">{(d.file.size / 1024).toFixed(0)} KB</span>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between gap-3 border-t bg-muted/30 px-6 py-4">
          {creds ? (
            <>
              <span className="text-xs text-muted-foreground">Client access created</span>
              <Button type="button" onClick={() => { setOpen(false); reset(); }}>Done</Button>
            </>
          ) : (
            <>
              <Button type="button" variant="ghost" onClick={() => (step === 0 ? setOpen(false) : setStep(step - 1))}>
                {step === 0 ? "Cancel" : <><ChevronLeft className="mr-1 h-4 w-4" /> Back</>}
              </Button>
              {step < STEPS.length - 1 ? (
                <Button type="button" onClick={next}>Next <ChevronRight className="ml-1 h-4 w-4" /></Button>
              ) : (
                <Button type="button" onClick={submit} disabled={createProject.isPending}>
                  {createProject.isPending ? "Creating..." : "Create project"}
                </Button>
              )}
            </>
          )}
        </div>

      </DialogContent>
    </Dialog>
  );
}
