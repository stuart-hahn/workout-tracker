import { requireUser } from "@/lib/auth/requireUser";
import VolumeClient from "./ui";

export default async function VolumeAnalyticsPage() {
  await requireUser();
  return (
    <div className="flex flex-col gap-4">
      <section className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-white/5">
        <h1 className="text-lg font-semibold tracking-tight">Weekly volume</h1>
        <p className="mt-1 text-sm leading-6 text-zinc-600 dark:text-zinc-300">
          Sets/week per muscle group from completed logs (with optional tonnage).
        </p>
      </section>

      <VolumeClient />
    </div>
  );
}

