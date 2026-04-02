export default function ProgramPage() {
  return (
    <div className="flex flex-col gap-4">
      <section className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-white/5">
        <h1 className="text-lg font-semibold tracking-tight">Program</h1>
        <p className="mt-1 text-sm leading-6 text-zinc-600 dark:text-zinc-300">
          This page will show the Upper/Lower 4-day template and allow edits
          (exercises, sets, rep ranges, rest, and notes).
        </p>
      </section>
    </div>
  );
}

