import { redirect } from "next/navigation";
import { clearSession } from "@/lib/auth/session";

export default async function LogoutPage() {
  await clearSession();
  redirect("/");
}

