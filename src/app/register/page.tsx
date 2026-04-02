import Link from "next/link";
import RegisterForm from "./ui";

export default function RegisterPage() {
  return (
    <div className="flex flex-col gap-4">
      <section className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-white/5">
        <h1 className="text-lg font-semibold tracking-tight">Register</h1>
        <p className="mt-1 text-sm leading-6 text-zinc-600 dark:text-zinc-300">
          Create your account to start tracking workouts and progression.
        </p>
        <div className="mt-4">
          <RegisterForm />
        </div>
        <div className="mt-4">
          <Link
            href="/login"
            className="text-sm font-medium text-zinc-900 underline underline-offset-4 dark:text-zinc-50"
          >
            Already have an account? Login
          </Link>
        </div>
      </section>
    </div>
  );
}

