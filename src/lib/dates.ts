/** 游戏时间轴：1934-10 ～ 1936-10（含），共 25 个刻度，索引 0..24 */
export const TIMELINE_START = { y: 1934, m: 10 };
export const TIMELINE_END = { y: 1936, m: 10 };
export const TIMELINE_MONTH_COUNT = 25;

export function monthIndexToIso(index: number): string {
  const clamped = Math.max(0, Math.min(TIMELINE_MONTH_COUNT - 1, index));
  const total = TIMELINE_START.y * 12 + (TIMELINE_START.m - 1) + clamped;
  const y = Math.floor(total / 12);
  const m = (total % 12) + 1;
  return `${y}-${String(m).padStart(2, "0")}`;
}

export function parseYearMonth(iso: string): { y: number; m: number } {
  const [ys, ms] = iso.split("-");
  const y = Number(ys);
  const m = Number(ms);
  if (!Number.isFinite(y) || !Number.isFinite(m)) {
    throw new Error(`Invalid date: ${iso}`);
  }
  return { y, m };
}

export function monthsSinceEpoch1934(iso: string): number {
  const { y, m } = parseYearMonth(iso);
  return y * 12 + (m - 1);
}

/** 两个 YYYY-MM 之间的月份差（绝对值） */
export function monthDiff(aIso: string, bIso: string): number {
  return Math.abs(monthsSinceEpoch1934(aIso) - monthsSinceEpoch1934(bIso));
}

export function isoToMonthIndex(iso: string): number {
  const t = monthsSinceEpoch1934(iso);
  const start = monthsSinceEpoch1934(
    `${TIMELINE_START.y}-${String(TIMELINE_START.m).padStart(2, "0")}`
  );
  const idx = t - start;
  return Math.max(0, Math.min(TIMELINE_MONTH_COUNT - 1, idx));
}
