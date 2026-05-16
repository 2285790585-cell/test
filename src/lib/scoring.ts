import { monthDiff } from "./dates";

export type RoundScore = {
  distanceKm: number;
  monthDelta: number;
  distanceScore: number;
  timeScore: number;
  total: number;
};

const DIST_WEIGHT = 0.6;
const TIME_WEIGHT = 0.4;
const DIST_PENALTY_PER_KM = 0.5;
const MONTH_PENALTY = 10;

export function scoreRound(
  distanceKm: number,
  playerMonthIso: string,
  truthMonthIso: string
): RoundScore {
  const monthDelta = monthDiff(playerMonthIso, truthMonthIso);
  const distanceScore = Math.max(0, 100 - distanceKm * DIST_PENALTY_PER_KM);
  const timeScore = Math.max(0, 100 - monthDelta * MONTH_PENALTY);
  const total = distanceScore * DIST_WEIGHT + timeScore * TIME_WEIGHT;
  return {
    distanceKm,
    monthDelta,
    distanceScore,
    timeScore,
    total,
  };
}
