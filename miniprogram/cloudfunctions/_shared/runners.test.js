const { test } = require('node:test');
const assert = require('node:assert/strict');
const { loadSeedMenu } = require('./menu');
const {
  normalizeNickname,
  generateRunnerId,
  requireWebKind,
  validateRunnerPayload,
  sortRunners,
  formatDrinkLine,
  nicknameTaken,
} = require('./runners');

const menu = loadSeedMenu();

test('normalizeNickname trims and lowercases for compare', () => {
  assert.equal(normalizeNickname('  老张  '), '老张');
  assert.equal(normalizeNickname('Abc'), 'abc');
});

test('generateRunnerId matches runner-xxxxxxxx', () => {
  assert.match(generateRunnerId(), /^runner-[a-f0-9]{8}$/);
});

test('requireWebKind rejects mp admin', () => {
  const r = requireWebKind({ ok: true, kind: 'mp', id: 'o1' });
  assert.equal(r.ok, false);
  assert.match(r.msg, /网页后台/);
});

test('requireWebKind passes web admin', () => {
  const r = requireWebKind({ ok: true, kind: 'web', id: 'u1' });
  assert.equal(r.ok, true);
});

test('empty nickname', () => {
  const r = validateRunnerPayload(menu, { nickname: '  ', drinks: [], foods: [] });
  assert.equal(r.ok, false);
  assert.match(r.msg, /群昵称/);
});

test('need at least one drink or food', () => {
  const r = validateRunnerPayload(menu, { nickname: '老张', drinks: [], foods: [] });
  assert.equal(r.ok, false);
  assert.match(r.msg, /至少添加/);
});

test('unknown itemId', () => {
  const r = validateRunnerPayload(menu, {
    nickname: '老张',
    drinks: [{ itemId: 'nope', options: [] }],
    foods: [],
  });
  assert.equal(r.ok, false);
  assert.match(r.msg, /菜单已更新/);
});

test('builds labeled drinks and allows two same itemIds', () => {
  const r = validateRunnerPayload(menu, {
    nickname: '老张',
    drinks: [
      { itemId: 'd-latte', options: [{ group: 'cupSize', id: 'grande' }] },
      { itemId: 'd-latte', options: [{ group: 'temperature', id: 'iced' }] },
    ],
    foods: [{ itemId: 'f-croissant' }],
  });
  assert.equal(r.ok, true);
  assert.equal(r.drinks.length, 2);
  assert.equal(r.drinks[0].name, '拿铁');
  assert.equal(r.drinks[0].options[0].label, '大杯');
  assert.equal(r.foods[0].name, '法式香酥可颂');
  assert.equal(r.foods[0].options, undefined);
});

test('sortRunners zh-CN', () => {
  const sorted = sortRunners([{ nickname: '张三' }, { nickname: '阿一' }]);
  assert.equal(sorted[0].nickname, '阿一');
});

test('formatDrinkLine', () => {
  const line = formatDrinkLine({
    name: '拿铁',
    options: [{ label: '大杯' }, { label: '冰' }],
  });
  assert.equal(line, '拿铁 · 大杯 · 冰');
});

test('nicknameTaken is case-insensitive', () => {
  const existing = [{ id: 'runner-1', nickname: '老张' }];
  assert.equal(nicknameTaken(existing, ' 老张 '), true);
  assert.equal(nicknameTaken(existing, '老张', 'runner-1'), false);
});
