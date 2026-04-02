import Link from "next/link";
import LoginForm from "./ui";

export default function LoginPage() {
  return (
    <div className="flex flex-col gap-4">
      <section className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-white/5">
        <h1 className="text-lg font-semibold tracking-tight">Login</h1>
        <p className="mt-1 text-sm leading-6 text-zinc-600 dark:text-zinc-300">
          Sign in to access your program, logs, and analytics.
        </p>
        <div className="mt-4">
          <LoginForm />
        </div>
        <div className="mt-4">
          <Link
            href="/register"
            className="text-sm font-medium text-zinc-900 underline underline-offset-4 dark:text-zinc-50"
          >
            Need an account? Register
          </Link>
        </div>
      </section>
    </div>
  );
}

