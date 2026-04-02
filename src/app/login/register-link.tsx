"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

export function RegisterLinkWithNext() {
  const searchParams = useSearchParams();
  const next = searchParams.get("next");
  const href =
    next != null && next !== ""
      ? `/register?next=${encodeURIComponent(next)}`
      : "/register";

  return (
    <Link
      href={href}
      className="text-sm font-medium text-zinc-900 underline underline-offset-4 outline-none focus-visible:rounded-sm focus-visible:ring-2 focus-visible:ring-zinc-400 dark:text-zinc-50"
    >
      Need an account? Register
    </Link>
  );
}
