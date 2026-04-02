export type VolumeRow = {
  muscleGroup: string;
  hardSets: number;
  tonnage: number;
};

export type WeeklyVolumeOptions = {
  primaryWeight?: number; // default 1.0
  secondaryWeight?: number; // default 0.5
};

export function parseSecondaryMuscles(raw: string | null | undefined): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((x) => typeof x === "string") as string[];
  } catch {
    return [];
  }
}

export function aggregateWeeklyVolume(input: {
  exercisesById: Map<
    string,
    { muscleGroupPrimary: string; muscleGroupsSecondary: string | null }
  >;
  setLogs: Array<{
    exerciseId: string;
    completed: boolean;
    reps: number | null;
    weight: number | null;
  }>;
  options?: WeeklyVolumeOptions;
}): VolumeRow[] {
  const primaryWeight = input.options?.primaryWeight ?? 1.0;
  const secondaryWeight = input.options?.secondaryWeight ?? 0.5;

  const volume = new Map<string, { hardSets: number; tonnage: number }>();

  function add(muscle: string, sets: number, tonnage: number) {
    const prev = volume.get(muscle) ?? { hardSets: 0, tonnage: 0 };
    prev.hardSets += sets;
    prev.tonnage += tonnage;
    volume.set(muscle, prev);
  }

  for (const log of input.setLogs) {
    if (!log.completed) continue;
    const ex = input.exercisesById.get(log.exerciseId);
    if (!ex) continue;

    const reps = log.reps ?? 0;
    const weight = log.weight ?? 0;
    const tonnage = reps > 0 && weight > 0 ? reps * weight : 0;

    add(ex.muscleGroupPrimary, primaryWeight, tonnage * primaryWeight);

    for (const secondary of parseSecondaryMuscles(ex.muscleGroupsSecondary)) {
      add(secondary, secondaryWeight, tonnage * secondaryWeight);
    }
  }

  return [...volume.entries()]
    .map(([muscleGroup, v]) => ({
      muscleGroup,
      hardSets: Number(v.hardSets.toFixed(2)),
      tonnage: Number(v.tonnage.toFixed(2)),
    }))
    .sort((a, b) => b.hardSets - a.hardSets || b.tonnage - a.tonnage);
}

