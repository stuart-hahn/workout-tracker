import type { Metadata } from "next";
import { requireUser } from "@/lib/auth/requireUser";
import { PageIntro } from "@/components/ui/page-intro";
import VolumeClient from "./ui";

export const metadata: Metadata = {
  title: "Weekly volume",
};

export default async function VolumeAnalyticsPage() {
  await requireUser();
  return (
    <div className="flex flex-col gap-4 pb-2">
      <PageIntro
        title="Weekly volume"
        description="Sets per muscle group from completed logs (with optional tonnage)."
      />

      <VolumeClient />
    </div>
  );
}
