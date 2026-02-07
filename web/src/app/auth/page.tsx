"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";

type AuthTab = "login" | "signup";

export default function AuthPage() {
  const { session, isLoading, signup, login } = useAuth();
  const router = useRouter();

  const [tab, setTab] = useState<AuthTab>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // If already authed, redirect away
  useEffect(() => {
    if (!isLoading && session) {
      router.replace("/request/new");
    }
  }, [isLoading, session, router]);

  const validate = (): string | null => {
    if (!email.trim()) return "Email is required.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
      return "Enter a valid email address.";
    if (!password) return "Password is required.";
    if (password.length < 6) return "Password must be at least 6 characters.";
    if (tab === "signup" && !displayName.trim())
      return "Display name is required.";
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setSubmitting(true);
    try {
      if (tab === "signup") {
        await signup(email.trim(), password, displayName.trim());
      } else {
        await login(email.trim(), password);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading) return null;
  if (session) return null;

  return (
    <div className="max-w-md mx-auto space-y-8 animate-fadeUp">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold text-leeds-blue tracking-tight">
          Welcome to Campus<span className="text-leeds-teal">Connect</span>
        </h1>
        <p className="text-leeds-blue-dark/70">
          {tab === "login"
            ? "Sign in to continue where you left off."
            : "Create an account to get started."}
        </p>
      </div>

      {/* Card */}
      <div className="bg-white rounded-2xl shadow-lg border border-leeds-border overflow-hidden">
        {/* Tab Switcher */}
        <div className="flex border-b border-leeds-border">
          {(["login", "signup"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => {
                setTab(t);
                setError(null);
              }}
              className={`flex-1 py-3 text-sm font-semibold transition-colors ${tab === t
                  ? "text-leeds-teal border-b-2 border-leeds-teal bg-leeds-teal/5"
                  : "text-leeds-blue-dark/50 hover:text-leeds-blue-dark"
                }`}
            >
              {t === "login" ? "Log In" : "Sign Up"}
            </button>
          ))}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6">
          {tab === "signup" && (
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-leeds-blue-dark">
                Display Name
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="e.g. Alex Smith"
                className="w-full rounded-xl border border-leeds-border bg-leeds-cream/30 px-4 py-3 text-leeds-blue-dark placeholder:text-gray-400 focus:border-leeds-teal focus:ring-2 focus:ring-leeds-teal/20 transition-all outline-none"
              />
            </div>
          )}

          <div className="space-y-2">
            <label className="block text-sm font-semibold text-leeds-blue-dark">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@leeds.ac.uk"
              className="w-full rounded-xl border border-leeds-border bg-leeds-cream/30 px-4 py-3 text-leeds-blue-dark placeholder:text-gray-400 focus:border-leeds-teal focus:ring-2 focus:ring-leeds-teal/20 transition-all outline-none"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-semibold text-leeds-blue-dark">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 6 characters"
              className="w-full rounded-xl border border-leeds-border bg-leeds-cream/30 px-4 py-3 text-leeds-blue-dark placeholder:text-gray-400 focus:border-leeds-teal focus:ring-2 focus:ring-leeds-teal/20 transition-all outline-none"
            />
          </div>

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 font-medium">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-full bg-leeds-blue text-white py-3 text-sm font-bold shadow-lg shadow-leeds-blue/20 hover:bg-leeds-blue-dark hover:shadow-xl hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting
              ? tab === "login"
                ? "Signing in..."
                : "Creating account..."
              : tab === "login"
                ? "Sign In"
                : "Create Account"}
          </button>
        </form>
      </div>
    </div>
  );
}
