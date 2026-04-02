import { redirect } from "next/navigation";
import { Suspense } from "react";
import { getCurrentUser } from "@/lib/auth/session";
import { LoginLinkWithNext } from "./login-link";
import RegisterForm from "./ui";

export const metadata = {
  title: "Register",
};

function RegisterFormFallback() {
  return <div className="h-32 animate-pulse rounded-xl bg-zinc-100 dark:bg-white/10" aria-hidden />;
}

export default async function RegisterPage() {
  const user = await getCurrentUser();
  if (user) redirect("/");

  return (
    <div className="flex flex-col gap-4">
      <section className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-white/5">
        <h1 className="text-lg font-semibold tracking-tight">Register</h1>
        <p className="mt-1 text-sm leading-6 text-zinc-600 dark:text-zinc-300">
          Create your account to start tracking workouts and progression.
        </p>
        <div className="mt-4">
          <Suspense fallback={<RegisterFormFallback />}>
            <RegisterForm />
          </Suspense>
        </div>
        <div className="mt-4">
          <Suspense
            fallback={
              <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                Login link…
              </span>
            }
          >
            <LoginLinkWithNext />
          </Suspense>
        </div>
      </section>
    </div>
  );
}
