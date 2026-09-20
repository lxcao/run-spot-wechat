const { test } = require('node:test');
const assert = require('node:assert/strict');
const { loadSeedMenu, findDrink, findFood, sanitizeOptions } = require('./menu');

const menu = loadSeedMenu();

test('seed has drinks and foods', () => {
  assert.ok(menu.drinks.length > 80);
  assert.ok(menu.foods.length > 20);
  assert.equal(menu.drinks[0].price, undefined);
});

test('findDrink by id', () => {
  const d = findDrink(menu, 'd-latte');
  assert.equal(d.name, '拿铁');
});

test('findDrink unknown is null', () => {
  assert.equal(findDrink(menu, 'nope'), null);
});

test('findFood by id', () => {
  const f = findFood(menu, 'f-croissant');
  assert.equal(f.name, '法式香酥可颂');
});

test('findFood black truffle chicken sandwich', () => {
  const f = findFood(menu, 'f-black-truffle-chicken-sandwich');
  assert.equal(f.name, '黑松露鸡肉三明治');
  assert.equal(f.category, '早餐三明治');
});

test('findFood yunnan mushroom beef baguette', () => {
  const f = findFood(menu, 'f-yunnan-mushroom-beef-baguette');
  assert.equal(f.name, '滇香菌菇牛肉法棍三明治');
  assert.equal(f.category, '午餐精选');
});

test('findFood unknown is null', () => {
  assert.equal(findFood(menu, 'nope'), null);
});

test('sanitizeOptions fills labels and drops unknown', () => {
  const opts = sanitizeOptions(menu.customizations, [
    { group: 'cupSize', id: 'grande' },
    { group: 'temperature', id: 'iced' },
    { group: 'milk', id: 'oat' },
    { group: 'hack', id: 'x' },
  ]);
  assert.deepEqual(opts.map((o) => o.label), ['大杯', '冰', '燕麦奶']);
});

test('espressoShots and storeCup', () => {
  const opts = sanitizeOptions(menu.customizations, [
    { group: 'espressoShots', id: '2' },
    { group: 'storeCup', id: 'store-cup' },
  ]);
  assert.equal(opts[0].label, '浓缩 2 份');
  assert.equal(opts[1].label, '优先使用店内用杯');
});

test('sanitizeOptions nested sugarFreeFlavor', () => {
  const opts = sanitizeOptions(menu.customizations, [
    { group: 'sugarFreeFlavor', id: 'vanilla' },
  ]);
  assert.equal(opts[0].label, '香草风味');
});
