import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useProjects } from "@/hooks/useBuildTrust";
import { toast } from "sonner";
import { UserPlus, Copy, Check, KeyRound, Mail, Loader2 } from "lucide-react";

type AppRole = "super-admin" | "company-admin" | "engineer" | "technician" | "client";

export function CreateUserDialog() {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<AppRole>("technician");
  const [projectId, setProjectId] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [creds, setCreds] = useState<{ email: string; password: string | null; created: boolean; role: string } | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const { data: projects = [] } = useProjects();

  const reset = () => {
    setEmail(""); setFullName(""); setRole("technician"); setProjectId(""); setCreds(null); setCopied(null);
  };
  const close = (v: boolean) => { setOpen(v); if (!v) setTimeout(reset, 200); };

  const submit = async () => {
    if (!email) { toast.error("Email is required"); return; }
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-user", {
        body: {
          email,
          full_name: fullName,
          role,
          project_id: projectId || undefined,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setCreds({ email: data.email, password: data.password, created: !!data.created, role: data.role });
      toast.success(data.created ? "User account created" : "Existing user updated");
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to create user");
    } finally {
      setLoading(false);
    }
  };

  const copy = async (kind: string, text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(kind);
    setTimeout(() => setCopied(null), 1500);
  };

  const loginUrl = `${window.location.origin}/login`;
  const summary = creds
    ? `BuildTrust access\nRole: ${creds.role}\nLogin: ${loginUrl}\nEmail: ${creds.email}${creds.password ? `\nPassword: ${creds.password}` : ""}`
    : "";

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogTrigger asChild>
        <Button size="sm"><UserPlus className="h-4 w-4 mr-1" />Create user</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create a new user</DialogTitle>
          <DialogDescription>
            Assign a role and optionally attach them to a project.
          </DialogDescription>
        </DialogHeader>

        {!creds ? (
          <div className="space-y-4">
            <div>
              <Label htmlFor="cu-name">Full name</Label>
              <Input id="cu-name" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Jane Doe" />
            </div>
            <div>
              <Label htmlFor="cu-email">Email *</Label>
              <Input id="cu-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="user@company.com" />
            </div>
            <div>
              <Label>Role *</Label>
              <Select value={role} onValueChange={(v) => setRole(v as AppRole)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="technician">Technician — field reports only</SelectItem>
                  <SelectItem value="engineer">Engineer — full project work</SelectItem>
                  <SelectItem value="company-admin">Company admin — manages everything</SelectItem>
                  <SelectItem value="client">Client — read-only portal</SelectItem>
                  <SelectItem value="super-admin">Super admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Assign to project (optional)</Label>
              <Select value={projectId || "none"} onValueChange={(v) => setProjectId(v === "none" ? "" : v)}>
                <SelectTrigger><SelectValue placeholder="No project" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No project</SelectItem>
                  {projects.map((p: any) => (
                    <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <p className="text-xs text-muted-foreground">A temporary password is generated. You'll see it once — share it securely.</p>
            <DialogFooter>
              <Button variant="outline" onClick={() => close(false)}>Cancel</Button>
              <Button onClick={submit} disabled={loading || !email}>
                {loading && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
                Create user
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="rounded-lg border bg-success/5 p-3 text-sm">
              {creds.created
                ? `Account created with role "${creds.role}". Share these credentials — the password won't be shown again.`
                : `User already existed. Role/assignments updated. Their existing password still works.`}
            </div>
            <div className="space-y-2">
              <div>
                <Label className="text-xs text-muted-foreground">Login URL</Label>
                <div className="flex gap-2">
                  <Input readOnly value={loginUrl} className="font-mono text-xs" />
                  <Button size="icon" variant="outline" onClick={() => copy("url", loginUrl)}>
                    {copied === "url" ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground flex items-center gap-1"><Mail className="h-3 w-3" />Email</Label>
                <Input readOnly value={creds.email} className="font-mono text-xs" />
              </div>
              {creds.password && (
                <div>
                  <Label className="text-xs text-muted-foreground flex items-center gap-1"><KeyRound className="h-3 w-3" />Temporary password</Label>
                  <div className="flex gap-2">
                    <Input readOnly value={creds.password} className="font-mono text-xs" />
                    <Button size="icon" variant="outline" onClick={() => copy("pwd", creds.password!)}>
                      {copied === "pwd" ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              )}
            </div>
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => copy("all", summary)}>
                {copied === "all" ? <Check className="h-4 w-4 mr-1 text-success" /> : <Copy className="h-4 w-4 mr-1" />}
                Copy all
              </Button>
              <Button onClick={() => close(false)}>Done</Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
