import type { HTMLAttributes } from "react";

const base =
  "rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-white/5";

export function Card({
  className = "",
  children,
  ...rest
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={[base, className].filter(Boolean).join(" ")} {...rest}>
      {children}
    </div>
  );
}
