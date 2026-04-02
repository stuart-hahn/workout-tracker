/**
 * Copy fragment for "last session" reps before "; try to beat that up to …".
 */
export function formatLastSessionRepsPerSet(lastLo: number, lastHi: number): string {
  if (!Number.isFinite(lastLo) || !Number.isFinite(lastHi)) {
    return "";
  }
  if (lastLo === lastHi) {
    return `${lastLo} reps per set`;
  }
  return `${lastLo}–${lastHi} reps per set`;
}
