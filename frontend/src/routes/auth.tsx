import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle, Loader2, Sparkles, Mail, Lock, User, ArrowRight } from "lucide-react";
import { lovable } from "@/integrations/lovable";
import { supabase } from "@/integrations/supabase/client";
import { enableDemoMode } from "@/lib/demoData";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Logo } from "@/components/consist/Logo";

type Search = {
  redirect?: string | undefined;
  error?: string | undefined;
  error_description?: string | undefined;
};

const safe = (p?: string) => (p && p.startsWith("/") && !p.startsWith("//") ? p : "/dashboard");

export const Route = createFileRoute("/auth")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    redirect: typeof s["redirect"] === "string" ? s["redirect"] : undefined,
    error: typeof s["error"] === "string" ? s["error"] : undefined,
    error_description:
      typeof s["error_description"] === "string" ? s["error_description"] : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Sign in — CONSIST" },
      {
        name: "description",
        content: "Sign in to CONSIST with Google and continue building your consistency.",
      },
      { property: "og:title", content: "Sign in — CONSIST" },
      { property: "og:description", content: "Continue your personal growth journey." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const { redirect, error: queryError, error_description } = Route.useSearch();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Email auth mode
  const [authMode, setAuthMode] = useState<"options" | "signin" | "signup">("options");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");

  useEffect(() => {
    // 1. Check search params or hash for errors
    if (error_description || queryError) {
      setError(decodeURIComponent(error_description || queryError || "Authentication failed."));
    } else if (typeof window !== "undefined" && window.location.hash) {
      const params = new URLSearchParams(window.location.hash.replace(/^#/, ""));
      const hashErr = params.get("error_description") || params.get("error");
      if (hashErr) {
        setError(decodeURIComponent(hashErr));
      }
    }

    if (redirect) {
      sessionStorage.setItem("consist:next", safe(redirect));
    }

    // 2. Handle OAuth code exchange if returned from Supabase PKCE flow
    if (typeof window !== "undefined" && window.location.search) {
      const params = new URLSearchParams(window.location.search);
      const code = params.get("code");
      if (code) {
        supabase.auth.exchangeCodeForSession(code).then(({ error: exErr }) => {
          if (exErr) {
            setError(exErr.message);
            setChecking(false);
          } else {
            const next = sessionStorage.getItem("consist:next");
            sessionStorage.removeItem("consist:next");
            navigate({ to: safe(next ?? undefined), replace: true });
          }
        });
        return;
      }
    }

    // 3. Check existing Supabase session or demo mode
    if (typeof window !== "undefined" && localStorage.getItem("consist:demo-mode") === "true") {
      const next = sessionStorage.getItem("consist:next");
      sessionStorage.removeItem("consist:next");
      navigate({ to: safe(next ?? undefined), replace: true });
      return;
    }

    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        const next = sessionStorage.getItem("consist:next");
        sessionStorage.removeItem("consist:next");
        navigate({ to: safe(next ?? undefined), replace: true });
      } else {
        setChecking(false);
      }
    });
  }, [redirect, queryError, error_description, navigate]);

  const signInWithGoogle = async () => {
    setLoading(true);
    setError(null);

    const redirectUri = `${window.location.origin}/auth`;

    const isLovableIframe =
      typeof window !== "undefined" &&
      window.self !== window.top &&
      (window.location.hostname.endsWith(".lovable.app") ||
        window.location.hostname.endsWith(".lovableproject.com"));

    if (isLovableIframe) {
      try {
        const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: redirectUri });
        if (result && !result.error) {
          if (result.redirected) return;
          const next = sessionStorage.getItem("consist:next");
          sessionStorage.removeItem("consist:next");
          navigate({ to: safe(next ?? undefined), replace: true });
          return;
        }
      } catch {
        // Fall back to direct Supabase OAuth below
      }
    }

    // Direct Supabase Google OAuth with preflight check
    try {
      const { data, error: supaError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: redirectUri,
          skipBrowserRedirect: true,
        },
      });

      if (supaError) {
        setError(
          supaError.message ||
            "Google sign-in could not be initiated. Check your Supabase Google OAuth settings.",
        );
        setLoading(false);
        return;
      }

      if (data?.url) {
        // Preflight probe to check if Google provider is enabled in this Supabase project
        try {
          const probe = await fetch(data.url);
          if (!probe.ok) {
            const errJson = await probe.json().catch(() => null);
            if (errJson?.msg?.includes("provider is not enabled") || probe.status === 400) {
              setError(
                "Google sign-in is not enabled in your Supabase project yet. In your Supabase Dashboard, go to Authentication > Providers > Google and toggle it ON, or use Email / Demo mode below.",
              );
              setLoading(false);
              return;
            }
          }
        } catch {
          // If CORS prevents reading probe, proceed with redirect
        }

        window.location.assign(data.url);
        return;
      }

      setLoading(false);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Authentication error occurred.");
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please fill in all required fields.");
      return;
    }
    setLoading(true);
    setError(null);

    try {
      if (authMode === "signup") {
        const { data, error: signUpErr } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName.trim() || undefined },
          },
        });
        if (signUpErr) throw signUpErr;

        if (data.user && !data.session) {
          setError(
            "Account created! Please check your email inbox for the confirmation link to activate your account.",
          );
          setLoading(false);
          return;
        }
      } else {
        const { error: signInErr } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (signInErr) throw signInErr;
      }

      const next = sessionStorage.getItem("consist:next");
      sessionStorage.removeItem("consist:next");
      navigate({ to: safe(next ?? undefined), replace: true });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Authentication failed.");
      setLoading(false);
    }
  };

  const enterDemo = () => {
    enableDemoMode();
    const next = sessionStorage.getItem("consist:next");
    sessionStorage.removeItem("consist:next");
    navigate({ to: safe(next ?? undefined), replace: true });
  };

  return (
    <div className="relative grid min-h-screen place-items-center overflow-hidden px-4 py-8">
      <div className="pointer-events-none absolute inset-0 bg-hero-glow" />
      <div className="pointer-events-none absolute inset-0 grid-lines" />
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="surface-card relative w-full max-w-md p-8 text-center shadow-xl border border-border/80"
      >
        <Link to="/" className="inline-block">
          <Logo />
        </Link>
        <h1 className="mt-6 text-2xl font-semibold">Welcome back to yourself.</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Sign in or create your account — no competition, just you.
        </p>

        {checking ? (
          <div className="mt-8 flex justify-center py-6 text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin text-gold" />
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            {/* Quick Demo Mode Instant Access Button */}
            <Button
              type="button"
              variant="outline"
              size="lg"
              className="h-11 w-full border-gold/40 bg-gold/10 text-gold hover:bg-gold/20 hover:border-gold transition-colors font-medium text-sm flex items-center justify-center gap-2"
              onClick={enterDemo}
            >
              <Sparkles className="h-4 w-4 text-gold shrink-0" />
              <span>Explore Demo Account (Instant Access)</span>
              <ArrowRight className="h-4 w-4 ml-auto text-gold/70" />
            </Button>

            <div className="relative my-3 flex items-center justify-center">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border/60" />
              </div>
              <span className="relative bg-surface px-3 text-[11px] uppercase tracking-wider text-muted-foreground">
                or sign in with credentials
              </span>
            </div>

            {/* Google OAuth Button */}
            <Button
              variant="soft"
              size="lg"
              className="h-11 w-full border border-border/80 hover:border-primary/40 transition-colors"
              onClick={signInWithGoogle}
              disabled={loading}
            >
              {loading && authMode === "options" ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <GoogleG />
              )}
              <span className="ml-2 font-medium">Continue with Google</span>
            </Button>

            {/* Email / Password Accordion */}
            <AnimatePresence mode="wait">
              {authMode === "options" ? (
                <motion.div
                  key="options-toggle"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="w-full text-xs text-muted-foreground hover:text-foreground mt-1"
                    onClick={() => setAuthMode("signin")}
                  >
                    <Mail className="h-3.5 w-3.5 mr-1.5" />
                    Sign in or register with Email
                  </Button>
                </motion.div>
              ) : (
                <motion.form
                  key="email-form"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  onSubmit={handleEmailAuth}
                  className="space-y-3 pt-2 text-left"
                >
                  <div className="flex border-b border-border/60 mb-2">
                    <button
                      type="button"
                      onClick={() => {
                        setAuthMode("signin");
                        setError(null);
                      }}
                      className={`flex-1 pb-2 text-xs font-medium text-center transition-colors ${
                        authMode === "signin"
                          ? "border-b-2 border-gold text-gold"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      Sign In
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setAuthMode("signup");
                        setError(null);
                      }}
                      className={`flex-1 pb-2 text-xs font-medium text-center transition-colors ${
                        authMode === "signup"
                          ? "border-b-2 border-gold text-gold"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      Create Account
                    </button>
                  </div>

                  {authMode === "signup" && (
                    <div className="space-y-1">
                      <label className="text-[11px] font-medium text-muted-foreground">Full Name</label>
                      <div className="relative">
                        <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          type="text"
                          placeholder="Alex Rivera"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          className="pl-9 h-9 text-xs"
                        />
                      </div>
                    </div>
                  )}

                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-muted-foreground">Email</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="email"
                        required
                        placeholder="you@domain.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-9 h-9 text-xs"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-muted-foreground">Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="password"
                        required
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-9 h-9 text-xs"
                      />
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setAuthMode("options");
                        setError(null);
                      }}
                      className="text-xs flex-1"
                    >
                      Back
                    </Button>
                    <Button
                      type="submit"
                      variant="default"
                      size="sm"
                      disabled={loading}
                      className="text-xs flex-1 bg-gold hover:bg-gold/90 text-black font-semibold"
                    >
                      {loading ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin mx-auto" />
                      ) : authMode === "signup" ? (
                        "Create Account"
                      ) : (
                        "Sign In"
                      )}
                    </Button>
                  </div>
                </motion.form>
              )}
            </AnimatePresence>
          </div>
        )}

        {error && (
          <div className="mt-4 flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-left text-xs text-destructive">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="mt-6 rounded-lg border border-border/40 bg-surface/50 p-3 text-left text-[11px] text-muted-foreground">
          <div className="font-medium text-foreground mb-1">Private & Secure by Design</div>
          Your habits, progress, and goals are isolated via PostgreSQL Row Level Security.
        </div>

        <p className="mt-4 text-[11px] text-muted-foreground">
          By continuing you agree to keep showing up for yourself.
        </p>
      </motion.div>
    </div>
  );
}

function GoogleG() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
      <path
        fill="currentColor"
        d="M12 10.2v3.9h5.5c-.2 1.3-1.6 3.8-5.5 3.8-3.3 0-6-2.7-6-6.1s2.7-6.1 6-6.1c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.8 3.2 14.6 2.2 12 2.2 6.6 2.2 2.2 6.6 2.2 12s4.4 9.8 9.8 9.8c5.7 0 9.4-4 9.4-9.6 0-.6-.1-1.1-.2-1.6H12z"
      />
    </svg>
  );
}
