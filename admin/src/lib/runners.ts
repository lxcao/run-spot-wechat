import type { Runner, RunnerDrink } from '../types';

export function formatDrinkLine(drink: RunnerDrink): string {
  const parts = [drink.name, ...(drink.options || []).map((o) => o.label).filter(Boolean)];
  return parts.join(' · ');
}

export function emptyDraft(): { nickname: string; drinks: RunnerDrink[]; foods: Runner['foods'] } {
  return { nickname: '', drinks: [], foods: [] };
}

export function formatPreviewLines(runner: Pick<Runner, 'drinks' | 'foods'>, limit = 4): string[] {
  const drinks = (runner.drinks || []).map(formatDrinkLine);
  const foods = (runner.foods || []).map((food) => food.name).filter(Boolean);
  return [...drinks, ...foods].slice(0, limit);
}
