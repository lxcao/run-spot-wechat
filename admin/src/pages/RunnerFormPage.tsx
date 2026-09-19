import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { callFn } from '../lib/api';
import { emptyDraft } from '../lib/runners';
import type { MenuItem, Runner, RunnerDrink, StarbucksMenu } from '../types';

const RADIO_GROUPS = [
  'cupSize',
  'temperature',
  'espressoBean',
  'espressoStyle',
  'milk',
  'foam',
  'sweetness',
] as const;

const GROUP_LABELS: Record<string, string> = {
  cupSize: '杯型',
  temperature: '温度',
  espressoBean: '浓缩豆',
  espressoStyle: '萃取方式',
  milk: '牛奶',
  foam: '奶泡',
  sweetness: '甜度',
  sugarFreeFlavor: '无糖风味',
  espressoShots: '浓缩份数',
};

function optionChoices(customizations: Record<string, unknown>, group: string): { id: string; label: string }[] {
  const block = customizations[group] as any;
  if (!block) return [];
  if (Array.isArray(block)) return block;
  if (Array.isArray(block.options)) return block.options;
  return [];
}

function setOption(drink: RunnerDrink, group: string, id: string, label: string): RunnerDrink {
  const rest = drink.options.filter((o) => o.group !== group);
  return { ...drink, options: [...rest, { group, id, label }] };
}

function clearOption(drink: RunnerDrink, group: string): RunnerDrink {
  return { ...drink, options: drink.options.filter((o) => o.group !== group) };
}

function selectedId(drink: RunnerDrink, group: string): string {
  return drink.options.find((o) => o.group === group)?.id || '';
}

function groupByCategory(items: MenuItem[]): [string, MenuItem[]][] {
  const map = new Map<string, MenuItem[]>();
  items.forEach((item) => {
    const list = map.get(item.category) || [];
    list.push(item);
    map.set(item.category, list);
  });
  return [...map.entries()];
}

function groupLegend(customizations: Record<string, unknown>, group: string): string {
  const block = customizations[group] as { label?: string } | unknown[] | undefined;
  if (block && !Array.isArray(block) && typeof block.label === 'string' && block.label) {
    return block.label;
  }
  return GROUP_LABELS[group] || group;
}

function storeCupChoice(customizations: Record<string, unknown>): { id: string; label: string } | null {
  const block = customizations.storeCup as { id?: string; label?: string } | undefined;
  if (!block || typeof block.id !== 'string') return null;
  return { id: block.id, label: block.label || '优先使用店内用杯' };
}

function DrinkOptions({
  drink,
  index,
  customizations,
  onChange,
}: {
  drink: RunnerDrink;
  index: number;
  customizations: Record<string, unknown>;
  onChange: (next: RunnerDrink) => void;
}) {
  const storeCup = storeCupChoice(customizations);
  const shots = selectedId(drink, 'espressoShots');
  const radioGroups = [...RADIO_GROUPS, 'sugarFreeFlavor'] as const;

  return (
    <div className="taste-options">
      {radioGroups.map((group) => {
        const choices = optionChoices(customizations, group);
        if (choices.length === 0) return null;
        return (
          <fieldset key={group}>
            <legend>{groupLegend(customizations, group)}</legend>
            <div className="option-row">
              {choices.map((choice) => (
                <label key={choice.id}>
                  <input
                    type="radio"
                    name={`drink-${index}-${group}`}
                    value={choice.id}
                    checked={selectedId(drink, group) === choice.id}
                    onChange={() => onChange(setOption(drink, group, choice.id, choice.label))}
                  />
                  {choice.label}
                </label>
              ))}
            </div>
          </fieldset>
        );
      })}
      <label>
        {groupLegend(customizations, 'espressoShots')}
        <input
          type="number"
          min={1}
          value={shots}
          onChange={(e) => {
            const n = parseInt(e.target.value, 10);
            if (!Number.isFinite(n) || n < 1) {
              onChange(clearOption(drink, 'espressoShots'));
              return;
            }
            onChange(setOption(drink, 'espressoShots', String(n), `浓缩 ${n} 份`));
          }}
        />
      </label>
      {storeCup ? (
        <label className="option-check">
          <input
            type="checkbox"
            checked={selectedId(drink, 'storeCup') === storeCup.id}
            onChange={(e) => {
              if (e.target.checked) {
                onChange(setOption(drink, 'storeCup', storeCup.id, storeCup.label));
              } else {
                onChange(clearOption(drink, 'storeCup'));
              }
            }}
          />
          {storeCup.label}
        </label>
      ) : null}
    </div>
  );
}

export function RunnerFormPage({ mode }: { mode: 'create' | 'edit' }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [menu, setMenu] = useState<StarbucksMenu | null>(null);
  const [draft, setDraft] = useState(emptyDraft());
  const [error, setError] = useState('');
  const [loadError, setLoadError] = useState('');
  const [saving, setSaving] = useState(false);
  const [drinkPick, setDrinkPick] = useState('');
  const [foodPick, setFoodPick] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const menuRes = await callFn<StarbucksMenu>('getStarbucksMenu');
        if (cancelled) return;
        if (!menuRes.ok || !menuRes.data) {
          setLoadError(menuRes.msg || '菜单未导入');
          return;
        }
        setMenu(menuRes.data);
        if (mode === 'edit') {
          if (!id) {
            setLoadError('跑友不存在');
            return;
          }
          const listRes = await callFn<{ runners: Runner[] }>('listRunners');
          if (cancelled) return;
          const found = listRes.data?.runners.find((r) => r.id === id);
          if (!listRes.ok || !found) {
            setLoadError('跑友不存在');
            return;
          }
          setDraft({
            nickname: found.nickname,
            drinks: found.drinks || [],
            foods: found.foods || [],
          });
        }
      } catch {
        if (!cancelled) setLoadError('菜单未导入');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [mode, id]);

  const drinkGroups = useMemo(() => groupByCategory(menu?.drinks || []), [menu]);
  const foodGroups = useMemo(() => groupByCategory(menu?.foods || []), [menu]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    if (!draft.nickname.trim()) {
      setError('请填写群昵称');
      return;
    }
    if (draft.drinks.length === 0 && draft.foods.length === 0) {
      setError('至少添加一杯咖啡或一份餐');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        id,
        nickname: draft.nickname,
        drinks: draft.drinks.map((d) => ({ itemId: d.itemId, options: d.options })),
        foods: draft.foods.map((f) => ({ itemId: f.itemId })),
      };
      const res =
        mode === 'create'
          ? await callFn('createRunner', payload)
          : await callFn('updateRunner', payload);
      if (!res.ok) {
        setError(res.msg || '保存失败，请重试');
        return;
      }
      navigate('/dining');
    } catch {
      setError('保存失败，请重试');
    } finally {
      setSaving(false);
    }
  }

  function addDrink(itemId: string) {
    const item = menu?.drinks.find((d) => d.id === itemId);
    if (!item) return;
    setDraft((prev) => ({
      ...prev,
      drinks: [...prev.drinks, { itemId: item.id, name: item.name, options: [] }],
    }));
  }

  function addFood(itemId: string) {
    const item = menu?.foods.find((f) => f.id === itemId);
    if (!item) return;
    setDraft((prev) => ({
      ...prev,
      foods: [...prev.foods, { itemId: item.id, name: item.name }],
    }));
  }

  return (
    <main className="list-page">
      <p className="list-nav">
        <Link to="/dining">跑友口味</Link>
        <span> / {mode === 'create' ? '新增' : '编辑'}</span>
      </p>
      {loadError ? <p className="auth-error" role="alert">{loadError}</p> : null}
      {menu && !loadError ? (
        <form className="auth-card runner-form" onSubmit={onSubmit}>
          <label>
            群昵称
            <input
              value={draft.nickname}
              onChange={(e) => setDraft((prev) => ({ ...prev, nickname: e.target.value }))}
            />
          </label>

          <section>
            <h2>咖啡</h2>
            {draft.drinks.map((drink, index) => (
              <div key={`${drink.itemId}-${index}`} className="taste-item">
                <div className="taste-item-head">
                  <strong>{drink.name}</strong>
                  <button
                    type="button"
                    className="taste-remove"
                    onClick={() =>
                      setDraft((prev) => ({
                        ...prev,
                        drinks: prev.drinks.filter((_, i) => i !== index),
                      }))
                    }
                  >
                    移除
                  </button>
                </div>
                <DrinkOptions
                  drink={drink}
                  index={index}
                  customizations={menu.customizations}
                  onChange={(next) =>
                    setDraft((prev) => ({
                      ...prev,
                      drinks: prev.drinks.map((row, i) => (i === index ? next : row)),
                    }))
                  }
                />
              </div>
            ))}
            <label>
              添加咖啡
              <select
                value={drinkPick}
                onChange={(e) => {
                  const itemId = e.target.value;
                  setDrinkPick('');
                  if (itemId) addDrink(itemId);
                }}
              >
                <option value="">选择饮品</option>
                {drinkGroups.map(([category, items]) => (
                  <optgroup key={category} label={category}>
                    {items.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </label>
          </section>

          <section>
            <h2>餐食</h2>
            {draft.foods.map((food, index) => (
              <div key={`${food.itemId}-${index}`} className="taste-item">
                <div className="taste-item-head">
                  <strong>{food.name}</strong>
                  <button
                    type="button"
                    className="taste-remove"
                    onClick={() =>
                      setDraft((prev) => ({
                        ...prev,
                        foods: prev.foods.filter((_, i) => i !== index),
                      }))
                    }
                  >
                    移除
                  </button>
                </div>
              </div>
            ))}
            <label>
              添加餐食
              <select
                value={foodPick}
                onChange={(e) => {
                  const itemId = e.target.value;
                  setFoodPick('');
                  if (itemId) addFood(itemId);
                }}
              >
                <option value="">选择餐食</option>
                {foodGroups.map(([category, items]) => (
                  <optgroup key={category} label={category}>
                    {items.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </label>
          </section>

          {error ? <p className="auth-error" role="alert">{error}</p> : null}
          <button type="submit" disabled={saving}>
            {saving ? '保存中...' : '保存'}
          </button>
        </form>
      ) : null}
    </main>
  );
}
