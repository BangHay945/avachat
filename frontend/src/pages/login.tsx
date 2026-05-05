import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/auth-context";

export default function LoginPage() {
  const { login, isLoading, isAuthenticated, user } = useAuth();
  const router = useRouter();
  const [ssoLoading, setSSOLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isAuthenticated && user) {
      router.replace("/dashboard");
    }
  }, [isAuthenticated, user, router]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    try {
      await login(email, password);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Login failed");
    }
  };

  const handleGoogleLogin = async () => {
    setSSOLoading(true);
    setError("");
    try {
      const email = "agent@avachat.id";
      const password = "password";
      await login(email, password);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setSSOLoading(false);
    }
  };

  if (isAuthenticated) return null;

  return (
    <div className="flex min-h-screen">
      {/* Left — Branding */}
      <div className="relative hidden w-1/2 flex-col justify-between bg-gradient-to-br from-[#3B82F6] via-[#6366F1] to-[#8B5CF6] p-12 text-white lg:flex">
        <div className="absolute inset-0 opacity-[0.08]">
          <div className="absolute -left-20 -top-20 h-[500px] w-[500px] rounded-full bg-white/20 blur-3xl" />
          <div className="absolute -bottom-32 -right-32 h-[600px] w-[600px] rounded-full bg-white/10 blur-3xl" />
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <img src="/logo.svg" alt="AvaChat" className="h-12 w-12 brightness-0 invert" />
            <span className="text-xl font-bold">AvaChat</span>
          </div>
        </div>

        <div className="relative z-10 space-y-6">
          <h1 className="text-4xl font-bold leading-tight">
            Omnichannel Chat<br />Platform for<br />Modern Business
          </h1>
          <p className="max-w-md text-lg text-white/70">
            Gabungkan semua channel — WhatsApp, Instagram, Telegram, Live Chat — ke dalam satu dashboard terpusat.
          </p>
          <div className="flex gap-8 pt-4">
            <div>
              <div className="text-3xl font-bold">7+</div>
              <div className="text-sm text-white/60">Channels</div>
            </div>
            <div>
              <div className="text-3xl font-bold">AI</div>
              <div className="text-sm text-white/60">Powered</div>
            </div>
            <div>
              <div className="text-3xl font-bold">CRM</div>
              <div className="text-sm text-white/60">Built-in</div>
            </div>
          </div>
        </div>

        <div className="relative z-10 flex items-center gap-3 text-sm text-white/50">
          <span>© 2026 AvaChat</span>
          <span>·</span>
          <span>Omnichannel SaaS Platform</span>
        </div>
      </div>

      {/* Right — Form */}
      <div className="flex w-full flex-col items-center justify-center bg-background p-6 lg:w-1/2">
        <div className="w-full max-w-md space-y-8">
          {/* Mobile logo */}
          <div className="flex items-center gap-3 lg:hidden">
            <img src="/logo-icon.svg" alt="AvaChat" className="h-10 w-10" />
            <span className="text-xl font-bold">AvaChat</span>
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-bold tracking-tight">Welcome back</h2>
            <p className="text-muted-foreground">Sign in to your workspace to continue</p>
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300">
              <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              {error}
            </div>
          )}

          <button
            onClick={handleGoogleLogin}
            disabled={ssoLoading}
            className="inline-flex h-11 w-full items-center justify-center gap-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm font-medium text-zinc-700 dark:text-zinc-200 shadow-sm transition-all hover:bg-zinc-50 dark:hover:bg-zinc-800 hover:shadow disabled:opacity-50"
          >
            {ssoLoading ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-400 border-t-transparent" />
                Signing in...
              </span>
            ) : (
              <>
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Continue with Google
              </>
            )}
          </button>

          <div className="relative flex items-center">
            <div className="h-px flex-1 bg-border/60" />
            <span className="px-4 text-xs text-muted-foreground font-medium">OR</span>
            <div className="h-px flex-1 bg-border/60" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">Email</label>
              <input
                id="email"
                name="email"
                type="email"
                required
                defaultValue="agent@avachat.id"
                placeholder="you@company.com"
                className="flex h-11 w-full rounded-xl border border-input bg-background px-4 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                required
                defaultValue="password"
                placeholder="Enter your password"
                className="flex h-11 w-full rounded-xl border border-input bg-background px-4 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex h-11 w-full items-center justify-center rounded-xl bg-gradient-to-r from-[#3B82F6] to-[#8B5CF6] px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-blue-500/25 ring-offset-background transition-all hover:shadow-xl hover:shadow-blue-500/30 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Signing in...
                </span>
              ) : "Sign In"}
            </button>
          </form>

          <p className="text-center text-sm text-muted-foreground">
            Don&apos;t have a workspace?{" "}
            <button onClick={() => router.push("/register")} className="font-semibold text-[#6366F1] hover:text-[#8B5CF6] transition-colors">
              Create one free
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
