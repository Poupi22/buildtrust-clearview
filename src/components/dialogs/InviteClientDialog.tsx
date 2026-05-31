import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { UserPlus, Copy, Check, KeyRound, Mail, Loader2 } from "lucide-react";

export function InviteClientDialog({ projectId, projectTitle }: { projectId: string; projectTitle?: string }) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [creds, setCreds] = useState<{ email: string; password: string | null; created: boolean } | null>(null);
  const [copied, setCopied] = useState<"email" | "pwd" | "all" | null>(null);

  const reset = () => {
    setEmail(""); setFullName(""); setCreds(null); setCopied(null);
  };

  const close = (v: boolean) => {
    setOpen(v);
    if (!v) setTimeout(reset, 200);
  };

  const submit = async () => {
    if (!email) { toast.error("Email is required"); return; }
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("invite-client", {
        body: { project_id: projectId, email, full_name: fullName },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setCreds({ email: data.email, password: data.password, created: !!data.created });
      toast.success(data.created ? "Client account created" : "Existing user added to the project");
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to invite client");
    } finally {
      setLoading(false);
    }
  };

  const copy = async (kind: "email" | "pwd" | "all", text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(kind);
    setTimeout(() => setCopied(null), 1500);
  };

  const loginUrl = `${window.location.origin}/login`;
  const summary = creds
    ? `BuildTrust client access\nProject: ${projectTitle ?? ""}\nLogin: ${loginUrl}\nEmail: ${creds.email}${creds.password ? `\nPassword: ${creds.password}` : ""}`
    : "";

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <UserPlus className="h-4 w-4 mr-1" />Invite client
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Invite a client to this project</DialogTitle>
          <DialogDescription>
            The client will receive read-only access to approved & published updates only.
          </DialogDescription>
        </DialogHeader>

        {!creds ? (
          <div className="space-y-4">
            <div>
              <Label htmlFor="client-name">Full name</Label>
              <Input id="client-name" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Jane Doe" />
            </div>
            <div>
              <Label htmlFor="client-email">Email *</Label>
              <Input id="client-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="client@company.com" />
            </div>
            <p className="text-xs text-muted-foreground">
              A temporary password will be generated. You'll see it once — share it securely.
            </p>
            <DialogFooter>
              <Button variant="outline" onClick={() => close(false)}>Cancel</Button>
              <Button onClick={submit} disabled={loading || !email}>
                {loading && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
                Create access
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="rounded-lg border bg-success/5 p-3 text-sm">
              {creds.created
                ? "Account created. Share these credentials with your client — the password won't be shown again."
                : "This email already had an account. It has been linked to this project as a client. Their existing password still works."}
            </div>

            <div className="space-y-2">
              <div>
                <Label className="text-xs text-muted-foreground">Login URL</Label>
                <div className="flex gap-2">
                  <Input readOnly value={loginUrl} className="font-mono text-xs" />
                  <Button size="icon" variant="outline" onClick={() => copy("email", loginUrl)}>
                    {copied === "email" ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
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
