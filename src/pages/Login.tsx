import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import logo from "@/assets/logo.jpg";
import { Building2, Mail, Lock, User, ArrowRight, Loader2, HardHat, Eye } from "lucide-react";
import { toast } from "sonner";

type Mode = "login" | "signup" | "forgot";

export default function Login() {
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<"company-admin" | "engineer" | "technician" | "client">("engineer");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const rawNext = searchParams.get("next");
  const nextPath = rawNext && rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      toast.error(error.message);
    } else if (nextPath) {
      navigate(nextPath, { replace: true });
    }
    // Routing handled by App.tsx after auth state change
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName, role },
        emailRedirectTo: window.location.origin,
      },
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Account created! Check your email to confirm, or log in directly.");
      setMode("login");
    }
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Password reset link sent to your email.");
      setMode("login");
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      {/* Branding */}
      <div className="text-center mb-8 animate-fade-in">
        <img src={logo} alt="BuildTrust" className="h-16 mx-auto mb-4 object-contain" />
        <p className="text-sm text-muted-foreground font-medium tracking-wide">
          Building Structures. Building Trust.
        </p>
      </div>

      {/* Card */}
      <div className="w-full max-w-sm metric-card animate-fade-in">
        <h2 className="text-lg font-display font-bold text-center mb-1">
          {mode === "login" && "Welcome Back"}
          {mode === "signup" && "Create Account"}
          {mode === "forgot" && "Reset Password"}
        </h2>
        <p className="text-xs text-muted-foreground text-center mb-6">
          {mode === "login" && "Sign in to your BuildTrust account"}
          {mode === "signup" && "Join your construction team"}
          {mode === "forgot" && "We'll send you a reset link"}
        </p>

        <form onSubmit={mode === "login" ? handleLogin : mode === "signup" ? handleSignup : handleForgot} className="space-y-4">
          {mode === "signup" && (
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Full name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="w-full rounded-lg border bg-background pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
              />
            </div>
          )}

          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-lg border bg-background pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
            />
          </div>

          {mode !== "forgot" && (
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full rounded-lg border bg-background pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
              />
            </div>
          )}

          {mode === "signup" && (
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">I am a...</label>
              <div className="grid grid-cols-2 gap-2">
                {([
                  { value: "company-admin" as const, label: "Admin", icon: Building2 },
                  { value: "engineer" as const, label: "Engineer", icon: User },
                  { value: "technician" as const, label: "Technician", icon: HardHat },
                  { value: "client" as const, label: "Client", icon: Eye },
                ]).map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setRole(opt.value)}
                    className={`flex flex-col items-center gap-1 p-2.5 rounded-lg border text-xs font-medium transition-colors ${
                      role === opt.value
                        ? "border-primary bg-primary/5 text-primary"
                        : "border-border text-muted-foreground hover:border-primary/30"
                    }`}
                  >
                    <opt.icon className="h-4 w-4" />
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 rounded-lg bg-primary text-primary-foreground py-2.5 text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                {mode === "login" && "Sign In"}
                {mode === "signup" && "Create Account"}
                {mode === "forgot" && "Send Reset Link"}
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-4 text-center space-y-2">
          {mode === "login" && (
            <>
              <button onClick={() => setMode("forgot")} className="text-xs text-primary hover:underline">
                Forgot password?
              </button>
              <p className="text-xs text-muted-foreground">
                Accounts are created by your administrator.
              </p>
            </>
          )}
          {mode === "forgot" && (
            <p className="text-xs text-muted-foreground">
              Remembered it?{" "}
              <button onClick={() => setMode("login")} className="text-primary font-medium hover:underline">
                Sign in
              </button>
            </p>
          )}
        </div>
      </div>

      <p className="mt-8 text-xs text-muted-foreground">
        © {new Date().getFullYear()} BuildTrust. All rights reserved.
      </p>
    </div>
  );
}
