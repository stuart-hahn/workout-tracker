"use client";

import { Card } from "@/components/ui/card";
import { useCallback, useEffect, useState } from "react";

type Row = { muscleGroup: string; hardSets: number; tonnage: number };

const focusRing =
  "outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-zinc-950";

function startOfWeek(date: Date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = (day === 0 ? -6 : 1) - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function fmtDate(d: Date) {
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export default function VolumeClient() {
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()));
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const res = await fetch(
        `/api/analytics/volume?weekStart=${encodeURIComponent(weekStart.toISOString())}`,
        { cache: "no-store" },
      );
      if (!res.ok) {
        setFetchError("Could not load volume. Check your connection and try again.");
        setRows([]);
        return;
      }
      const data = (await res.json().catch(() => null)) as { volume?: Row[] } | null;
      setRows(data?.volume ?? []);
    } catch {
      setFetchError("Could not load volume. Check your connection and try again.");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [weekStart]);

  useEffect(() => {
    void load();
  }, [load]);

  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);

  return (
    <Card>
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => {
            const d = new Date(weekStart);
            d.setDate(d.getDate() - 7);
            setWeekStart(d);
          }}
          className={`h-9 rounded-lg border border-zinc-200 bg-white px-3 text-sm font-medium text-zinc-900 hover:bg-zinc-50 dark:border-white/10 dark:bg-transparent dark:text-zinc-50 dark:hover:bg-white/10 ${focusRing}`}
        >
          Prev
        </button>
        <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
          {fmtDate(weekStart)}–{fmtDate(weekEnd)}
        </div>
        <button
          type="button"
          onClick={() => {
            const d = new Date(weekStart);
            d.setDate(d.getDate() + 7);
            setWeekStart(d);
          }}
          className={`h-9 rounded-lg border border-zinc-200 bg-white px-3 text-sm font-medium text-zinc-900 hover:bg-zinc-50 dark:border-white/10 dark:bg-transparent dark:text-zinc-50 dark:hover:bg-white/10 ${focusRing}`}
        >
          Next
        </button>
      </div>

      <div className="mt-4 flex flex-col gap-2">
        {loading ? (
          <p className="text-sm text-zinc-600 dark:text-zinc-300">Loading…</p>
        ) : fetchError ? (
          <div className="rounded-xl border border-red-200/80 bg-red-50/80 p-3 dark:border-red-900/50 dark:bg-red-950/30">
            <p className="text-sm text-red-800 dark:text-red-200" role="alert">
              {fetchError}
            </p>
            <button
              type="button"
              onClick={() => void load()}
              className={`mt-2 h-9 rounded-lg border border-zinc-200 bg-white px-3 text-sm font-medium text-zinc-900 hover:bg-zinc-50 dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-50 dark:hover:bg-zinc-800 ${focusRing}`}
            >
              Retry
            </button>
          </div>
        ) : rows.length === 0 ? (
          <p className="text-sm text-zinc-600 dark:text-zinc-300">
            No completed sets logged this week yet.
          </p>
        ) : (
          rows.map((r) => (
            <div
              key={r.muscleGroup}
              className="flex items-center justify-between gap-3 rounded-xl border border-zinc-200 p-3 dark:border-white/10"
            >
              <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                {r.muscleGroup}
              </div>
              <div className="text-right text-xs text-zinc-600 dark:text-zinc-300">
                <div>{r.hardSets} sets</div>
                {r.tonnage > 0 ? <div>{Math.round(r.tonnage)} tonnage</div> : null}
              </div>
            </div>
          ))
        )}
      </div>
    </Card>
  );
}
