import { redirect } from "next/navigation";
import { Suspense } from "react";
import { getCurrentUser } from "@/lib/auth/session";
import { RegisterLinkWithNext } from "./register-link";
import LoginForm from "./ui";

export const metadata = {
  title: "Login",
};

function LoginFormFallback() {
  return <div className="h-32 animate-pulse rounded-xl bg-zinc-100 dark:bg-white/10" aria-hidden />;
}

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user) redirect("/");

  return (
    <div className="flex flex-col gap-4">
      <section className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-white/5">
        <h1 className="text-lg font-semibold tracking-tight">Login</h1>
        <p className="mt-1 text-sm leading-6 text-zinc-600 dark:text-zinc-300">
          Sign in to access your program, logs, and analytics.
        </p>
        <div className="mt-4">
          <Suspense fallback={<LoginFormFallback />}>
            <LoginForm />
          </Suspense>
        </div>
        <div className="mt-4">
          <Suspense
            fallback={
              <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                Register link…
              </span>
            }
          >
            <RegisterLinkWithNext />
          </Suspense>
        </div>
      </section>
    </div>
  );
}
