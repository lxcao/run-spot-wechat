import { describe, expect, it } from 'vitest';
import { formatDrinkLine, emptyDraft, formatPreviewLines } from './runners';

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

describe('formatPreviewLines', () => {
  it('includes both drinks and foods', () => {
    expect(
      formatPreviewLines({
        drinks: [
          {
            itemId: 'd-blonde-americano',
            name: '金烘美式咖啡',
            options: [
              { group: 'cupSize', id: 'venti', label: '超大杯' },
              { group: 'temperature', id: 'warm', label: '微热' },
            ],
          },
        ],
        foods: [{ itemId: 'f-croissant', name: '法式香酥可颂' }],
      }),
    ).toEqual(['金烘美式咖啡 · 超大杯 · 微热', '法式香酥可颂']);
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
