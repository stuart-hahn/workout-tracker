import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col gap-4 pb-2">
      <section className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-white/5">
        <h1 className="text-lg font-semibold tracking-tight">
          Your training, simplified.
        </h1>
        <p className="mt-1 text-sm leading-6 text-zinc-600 dark:text-zinc-300">
          Log sets fast, follow double progression, and see weekly volume by
          muscle group.
        </p>
        <div className="mt-4 flex gap-2">
          <Link
            href="/today"
            className="flex-1 rounded-xl bg-zinc-900 px-4 py-2.5 text-center text-sm font-medium text-white hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
          >
            Start today’s workout
          </Link>
          <Link
            href="/program"
            className="flex-1 rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-center text-sm font-medium text-zinc-900 hover:bg-zinc-50 dark:border-white/10 dark:bg-transparent dark:text-zinc-50 dark:hover:bg-white/10"
          >
            Edit program
          </Link>
        </div>
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-white/5">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
          Next steps
        </h2>
        <ul className="mt-2 space-y-2 text-sm text-zinc-700 dark:text-zinc-200">
          <li className="flex items-start gap-2">
            <span className="mt-1 inline-block h-1.5 w-1.5 rounded-full bg-zinc-400" />
            Create an account (required in v1).
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-1 inline-block h-1.5 w-1.5 rounded-full bg-zinc-400" />
            Seed sample data to see the template and example logs.
          </li>
        </ul>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <Link
            href="/register"
            className="rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-center text-sm font-medium text-zinc-900 hover:bg-zinc-50 dark:border-white/10 dark:bg-transparent dark:text-zinc-50 dark:hover:bg-white/10"
          >
            Register
          </Link>
          <Link
            href="/login"
            className="rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-center text-sm font-medium text-zinc-900 hover:bg-zinc-50 dark:border-white/10 dark:bg-transparent dark:text-zinc-50 dark:hover:bg-white/10"
          >
            Login
          </Link>
        </div>
      </section>
    </div>
  );
}
