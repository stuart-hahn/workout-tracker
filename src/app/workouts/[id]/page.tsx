import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth/requireUser";
import { PageIntro } from "@/components/ui/page-intro";
import { TextLink } from "@/components/ui/text-link";
import { prisma } from "@/lib/db";
import WorkoutLogger from "./ui";

function statusLabel(status: string) {
  return status.replaceAll("_", " ");
}

export default async function WorkoutPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser();
  const { id } = await params;

  const row = await prisma.workoutInstance.findFirst({
    where: { id, userId: user.id },
    select: {
      status: true,
      workoutDay: { select: { name: true, notes: true } },
    },
  });

  if (!row) notFound();

  return (
    <div className="flex flex-col gap-4">
      <PageIntro
        title={row.workoutDay.name}
        description={
          <div className="space-y-2">
            <p>
              <span className="mr-2 inline-flex rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-800 dark:bg-white/10 dark:text-zinc-200">
                {statusLabel(row.status)}
              </span>
              Log sets below and mark each complete when you hit your target effort.
            </p>
            {row.workoutDay.notes ? (
              <p className="text-zinc-700 dark:text-zinc-200">{row.workoutDay.notes}</p>
            ) : null}
          </div>
        }
        actions={<TextLink href="/today">Back</TextLink>}
      />

      <WorkoutLogger workoutInstanceId={id} showDayHeader={false} />
    </div>
  );
}
