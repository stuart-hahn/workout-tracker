import type { ReactNode } from "react";
import { Card } from "./card";

type PageIntroProps = {
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
  className?: string;
};

/** Page-level title + optional description + optional header row (e.g. links). */
export function PageIntro({ title, description, actions, className = "" }: PageIntroProps) {
  return (
    <Card className={className}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <h1 className="text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          {title}
        </h1>
        {actions ? <div className="shrink-0">{actions}</div> : null}
      </div>
      {description ? (
        <div className="mt-1 text-sm leading-6 text-zinc-600 dark:text-zinc-300">
          {description}
        </div>
      ) : null}
    </Card>
  );
}
