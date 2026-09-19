import { describe, expect, it } from 'vitest';
import { formatDrinkLine, emptyDraft } from './runners';

describe('formatDrinkLine', () => {
  it('joins name and option labels', () => {
    expect(
      formatDrinkLine({
        itemId: 'd-latte',
        name: '拿铁',
        options: [
          { group: 'cupSize', id: 'grande', label: '大杯' },
          { group: 'temperature', id: 'iced', label: '冰' },
        ],
      })
    ).toBe('拿铁 · 大杯 · 冰');
  });
});

describe('emptyDraft', () => {
  it('starts with blank nickname and no items', () => {
    const d = emptyDraft();
    expect(d.nickname).toBe('');
    expect(d.drinks).toEqual([]);
    expect(d.foods).toEqual([]);
  });
});
