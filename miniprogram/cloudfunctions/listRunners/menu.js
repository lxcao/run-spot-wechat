const fs = require('fs');
const path = require('path');

function loadSeedMenu() {
  const p = path.join(__dirname, '../../../data/starbucks-menu.json');
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

function findDrink(menu, id) {
  if (!menu || !Array.isArray(menu.drinks)) return null;
  return menu.drinks.find((d) => d.id === id) || null;
}

function findFood(menu, id) {
  if (!menu || !Array.isArray(menu.foods)) return null;
  return menu.foods.find((d) => d.id === id) || null;
}

function optionChoices(customizations, group) {
  const block = customizations && customizations[group];
  if (!block) return [];
  if (Array.isArray(block)) return block;
  if (Array.isArray(block.options)) return block.options;
  if (block.type === 'toggle' && block.id) return [block];
  return [];
}

function sanitizeOptions(customizations, raw) {
  if (!Array.isArray(raw)) return [];
  const out = [];
  for (const item of raw) {
    if (!item || typeof item.group !== 'string') continue;
    const group = item.group;
    if (group === 'espressoShots') {
      const n = parseInt(String(item.id), 10);
      if (!Number.isFinite(n) || n < 1) continue;
      out.push({ group, id: String(n), label: `浓缩 ${n} 份` });
      continue;
    }
    const hit = optionChoices(customizations, group).find((c) => c.id === item.id);
    if (!hit) continue;
    out.push({ group, id: hit.id, label: hit.label });
  }
  return out;
}

module.exports = { loadSeedMenu, findDrink, findFood, sanitizeOptions, optionChoices };
