import type { Runner, RunnerDrink } from '../types';

export function formatDrinkLine(drink: RunnerDrink): string {
  const parts = [drink.name, ...(drink.options || []).map((o) => o.label).filter(Boolean)];
  return parts.join(' · ');
}

export function emptyDraft(): { nickname: string; drinks: RunnerDrink[]; foods: Runner['foods'] } {
  return { nickname: '', drinks: [], foods: [] };
}
