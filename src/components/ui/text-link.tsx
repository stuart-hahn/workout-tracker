import Link from "next/link";
import type { ComponentProps } from "react";

const base =
  "text-sm font-medium text-zinc-900 underline underline-offset-4 outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 rounded-sm dark:text-zinc-50";

export function TextLink({
  className = "",
  ...rest
}: ComponentProps<typeof Link>) {
  return <Link className={[base, className].filter(Boolean).join(" ")} {...rest} />;
}
