"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { safeNextPath } from "@/lib/auth/safe-next-path";

const fieldClass =
  "h-11 rounded-xl border border-zinc-200 bg-white px-3 text-zinc-900 outline-none focus:border-zinc-400 focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2 dark:border-white/10 dark:bg-black/20 dark:text-zinc-50 dark:focus:border-white/30 dark:focus-visible:ring-offset-zinc-950";

export default function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = (await res.json().catch(() => null)) as
        | { ok?: boolean; error?: string }
        | null;

      if (!res.ok || !data?.ok) {
        setError(data?.error ?? "Registration failed.");
        return;
      }

      const nextRaw = searchParams.get("next");
      const destination = safeNextPath(nextRaw) ?? "/";
      router.replace(destination);
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  }

  const invalid = error !== null;

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3" noValidate>
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium text-zinc-900 dark:text-zinc-50">Email</span>
        <input
          name="email"
          inputMode="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={fieldClass}
          placeholder="you@example.com"
          required
          aria-invalid={invalid}
          aria-describedby={invalid ? "register-error" : undefined}
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium text-zinc-900 dark:text-zinc-50">Password</span>
        <input
          name="password"
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={fieldClass}
          placeholder="At least 8 characters"
          minLength={8}
          required
          aria-invalid={invalid}
          aria-describedby={invalid ? "register-error" : undefined}
        />
      </label>

      {error ? (
        <p id="register-error" className="text-sm text-red-600 dark:text-red-400" role="alert">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={submitting}
        className="h-11 rounded-xl bg-zinc-900 text-sm font-medium text-white outline-none hover:bg-zinc-800 focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2 disabled:opacity-60 dark:bg-white dark:text-black dark:hover:bg-zinc-200 dark:focus-visible:ring-offset-zinc-950"
      >
        {submitting ? "Creating…" : "Create account"}
      </button>
    </form>
  );
}
