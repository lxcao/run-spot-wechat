const crypto = require('crypto');
const { findDrink, findFood, sanitizeOptions } = require('./menu');

function normalizeNickname(raw) {
  return String(raw || '').trim().toLowerCase();
}

function generateRunnerId() {
  return 'runner-' + crypto.randomBytes(4).toString('hex');
}

function requireWebKind(gate) {
  if (!gate || !gate.ok) {
    return gate && gate.ok === false
      ? gate
      : { ok: false, code: -1, msg: '未授权：请联系群主把你加入管理员列表' };
  }
  if (gate.kind !== 'web') {
    return { ok: false, code: -1, msg: '未授权：请在网页后台登录后操作' };
  }
  return gate;
}

function validateRunnerPayload(menu, input) {
  const nickname = String((input && input.nickname) || '').trim();
  if (!nickname) return { ok: false, msg: '请填写群昵称' };

  const drinksIn = Array.isArray(input.drinks) ? input.drinks : [];
  const foodsIn = Array.isArray(input.foods) ? input.foods : [];
  const drinks = [];
  for (const row of drinksIn) {
    const item = findDrink(menu, row && row.itemId);
    if (!item) return { ok: false, msg: '菜单已更新，请重新选择' };
    drinks.push({
      itemId: item.id,
      name: item.name,
      options: sanitizeOptions(menu.customizations, row.options || []),
    });
  }
  const foods = [];
  for (const row of foodsIn) {
    const item = findFood(menu, row && row.itemId);
    if (!item) return { ok: false, msg: '菜单已更新，请重新选择' };
    foods.push({ itemId: item.id, name: item.name });
  }
  if (drinks.length === 0 && foods.length === 0) {
    return { ok: false, msg: '至少添加一杯咖啡或一份餐' };
  }
  return { ok: true, nickname, drinks, foods };
}

function nicknameTaken(existing, nickname, exceptId) {
  const key = normalizeNickname(nickname);
  return existing.some((r) => r.id !== exceptId && normalizeNickname(r.nickname) === key);
}

function sortRunners(list) {
  return [...list].sort((a, b) =>
    String(a.nickname || '').localeCompare(String(b.nickname || ''), 'zh-CN')
  );
}

function formatDrinkLine(drink) {
  const parts = [drink.name, ...((drink.options || []).map((o) => o.label).filter(Boolean))];
  return parts.join(' · ');
}

module.exports = {
  normalizeNickname,
  generateRunnerId,
  requireWebKind,
  validateRunnerPayload,
  nicknameTaken,
  sortRunners,
  formatDrinkLine,
};
