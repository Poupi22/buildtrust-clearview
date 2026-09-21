import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import logo from "@/assets/logo.jpg";
import { Loader2, ShieldCheck } from "lucide-react";

export default function OAuthConsent() {
  const [params] = useSearchParams();
  const authorizationId = params.get("authorization_id") ?? "";
  const [details, setDetails] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      if (!authorizationId) {
        setError("Missing authorization_id");
        return;
      }
      const { data: sess } = await supabase.auth.getSession();
      if (!sess.session) {
        const next = window.location.pathname + window.location.search;
        window.location.href = "/login?next=" + encodeURIComponent(next);
        return;
      }
      const { data, error } = await (supabase.auth as any).oauth.getAuthorizationDetails(authorizationId);
      if (!active) return;
      if (error) {
        setError(error.message);
        return;
      }
      const immediate = data?.redirect_url ?? data?.redirect_to;
      if (immediate && !data?.client) {
        window.location.href = immediate;
        return;
      }
      setDetails(data);
    })();
    return () => {
      active = false;
    };
  }, [authorizationId]);

  async function decide(approve: boolean) {
    setBusy(true);
    const oauth = (supabase.auth as any).oauth;
    const { data, error } = approve
      ? await oauth.approveAuthorization(authorizationId)
      : await oauth.denyAuthorization(authorizationId);
    if (error) {
      setBusy(false);
      setError(error.message);
      return;
    }
    const target = data?.redirect_url ?? data?.redirect_to;
    if (!target) {
      setBusy(false);
      setError("No redirect returned by the authorization server.");
      return;
    }
    window.location.href = target;
  }

  return (
    <main className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <img src={logo} alt="BuildTrust" className="h-14 mb-6 object-contain" />
      <div className="w-full max-w-sm metric-card text-center">
        {error ? (
          <>
            <h1 className="text-lg font-display font-bold mb-2">Authorization failed</h1>
            <p className="text-sm text-muted-foreground">{error}</p>
          </>
        ) : !details ? (
          <div className="flex items-center justify-center gap-2 py-6 text-muted-foreground text-sm">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading…
          </div>
        ) : (
          <>
            <ShieldCheck className="h-8 w-8 mx-auto mb-3 text-primary" />
            <h1 className="text-lg font-display font-bold mb-1">
              Connect {details.client?.name ?? "an app"} to BuildTrust
            </h1>
            <p className="text-sm text-muted-foreground mb-6">
              {details.client?.name ?? "This app"} will be able to read and act on BuildTrust data as you, with your
              existing permissions.
            </p>
            <div className="flex gap-2">
              <button
                disabled={busy}
                onClick={() => decide(false)}
                className="flex-1 rounded-lg border py-2.5 text-sm font-semibold hover:bg-muted transition-colors disabled:opacity-50"
              >
                Deny
              </button>
              <button
                disabled={busy}
                onClick={() => decide(true)}
                className="flex-1 rounded-lg bg-primary text-primary-foreground py-2.5 text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                Approve
              </button>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
