# 跑友星巴克口味备忘录 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 管理员在网页后台按群昵称代填跑友星巴克癖好（多杯咖啡带配置、多份餐），小程序免登录只读展示。

**Architecture:** 菜单种子 `data/starbucks-menu.json` 导入集合 `starbucksMenu`（`id: "current"`）。跑友存在 `runners`。写操作云函数走 `assertAdmin` 且必须 `kind === 'web'`。读操作 `getStarbucksMenu` / `listRunners` 不鉴权。浏览器不直接写 NoSQL。

**Tech Stack:** 现有微信云函数（`wx-server-sdk` + `_shared` 纯逻辑 `node:test`）；网页后台 Vite + React + TS + Vitest；小程序原生页。

**Spec:** `docs/superpowers/specs/2026-09-18-starbucks-preferences-design.md`

---

## File map

| 路径 | 职责 |
|---|---|
| `data/starbucks-menu.json` | 已有菜单种子（无价格、无库存） |
| `data/starbucksimages/` | 截图原件，不参与运行时 |
| `miniprogram/cloudfunctions/_shared/menu.js` | 查品名、清洗配置、填 label |
| `miniprogram/cloudfunctions/_shared/menu.test.js` | 菜单纯逻辑测试 |
| `miniprogram/cloudfunctions/_shared/runners.js` | 昵称、id、web 鉴权、payload |
| `miniprogram/cloudfunctions/_shared/runners.test.js` | 跑友纯逻辑测试 |
| `miniprogram/cloudfunctions/_shared/copy-assert-admin.sh` | 增加 create/update/deleteRunner |
| `getStarbucksMenu/` `listRunners/` | 公开读 |
| `createRunner/` `updateRunner/` `deleteRunner/` | 网页管理员写 |
| `admin/src/lib/runners.ts` | 展示行、类型 |
| `admin/src/pages/RunnerListPage.tsx` | 名单 |
| `admin/src/pages/RunnerFormPage.tsx` | 录入 |
| `admin/src/App.tsx` | `#/runners` 路由 |
| `miniprogram/pages/runners/` | 只读名单 |
| `miniprogram/pages/home/` | 入口卡片 |
| `README.md` `admin/README.md` | 文档 |

不要改 `h5/`。不要改 ⚙️ 配置页。不要做菜单 CMS、软删、openid、价格。

---

### Task 1: 菜单纯逻辑

**Files:**
- Create: `miniprogram/cloudfunctions/_shared/menu.js`
- Create: `miniprogram/cloudfunctions/_shared/menu.test.js`

- [ ] **Step 1: 写失败测试**

```js
const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
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
```

- [ ] **Step 2: 跑测试，确认失败**

```bash
node --test miniprogram/cloudfunctions/_shared/menu.test.js
```

Expected: `Cannot find module './menu'`

- [ ] **Step 3: 实现 `menu.js`**

```js
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
```

- [ ] **Step 4: 再跑测试，确认通过**

```bash
node --test miniprogram/cloudfunctions/_shared/menu.test.js
```

Expected: all pass

- [ ] **Step 5: Commit**

```bash
git add miniprogram/cloudfunctions/_shared/menu.js miniprogram/cloudfunctions/_shared/menu.test.js
git commit -m "feat(menu): parse Starbucks seed and sanitize drink options"
```

---

### Task 2: 跑友 payload 纯逻辑

**Files:**
- Create: `miniprogram/cloudfunctions/_shared/runners.js`
- Create: `miniprogram/cloudfunctions/_shared/runners.test.js`

- [ ] **Step 1: 写失败测试**

```js
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
```

- [ ] **Step 2: 跑测试，确认失败**

```bash
node --test miniprogram/cloudfunctions/_shared/runners.test.js
```

Expected: `Cannot find module './runners'`

- [ ] **Step 3: 实现 `runners.js`**

```js
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
```

- [ ] **Step 4: 再跑测试，确认通过**

```bash
node --test miniprogram/cloudfunctions/_shared/runners.test.js miniprogram/cloudfunctions/_shared/menu.test.js
```

Expected: all pass

- [ ] **Step 5: Commit**

```bash
git add miniprogram/cloudfunctions/_shared/runners.js miniprogram/cloudfunctions/_shared/runners.test.js
git commit -m "feat(runners): validate nickname, drinks, foods, and web-only admin"
```

---

### Task 3: 公开读云函数

**Files:**
- Create: `miniprogram/cloudfunctions/getStarbucksMenu/index.js`
- Create: `miniprogram/cloudfunctions/getStarbucksMenu/package.json`
- Create: `miniprogram/cloudfunctions/listRunners/index.js`
- Create: `miniprogram/cloudfunctions/listRunners/package.json`

`package.json` 两个函数都用：

```json
{
  "name": "getStarbucksMenu",
  "version": "1.0.0",
  "main": "index.js",
  "dependencies": {
    "wx-server-sdk": "~2.6.3"
  }
}
```

`listRunners` 的 `name` 改成 `listRunners`，并依赖 `@cloudbase/node-sdk` 不是必须（不鉴权）。只要 `wx-server-sdk`。

- [ ] **Step 1: 实现 `getStarbucksMenu/index.js`**

```js
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

exports.main = async () => {
  try {
    const res = await db.collection('starbucksMenu').where({ id: 'current' }).limit(1).get();
    const doc = res.data[0];
    if (!doc) return { code: -1, msg: '菜单未导入' };
    return {
      code: 0,
      msg: 'ok',
      data: {
        id: 'current',
        customizations: doc.customizations,
        drinks: doc.drinks,
        foods: doc.foods,
      },
    };
  } catch (err) {
    return { code: -1, msg: err.message || '读取菜单失败' };
  }
};
```

- [ ] **Step 2: 实现 `listRunners/index.js`**

把 `_shared/runners.js` 和 `_shared/menu.js` 复制进函数目录太重。`listRunners` 只排序，把 `sortRunners` 内联一份会分叉。正确做法：云函数 `require('./runners')`，部署前用脚本拷贝 `_shared/runners.js` 和 `_shared/menu.js`。

扩展 copy 脚本为 `copy-shared.sh`：

```bash
#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cp "$ROOT/_shared/assertAdmin.js" "$ROOT/createEvent/assertAdmin.js"
cp "$ROOT/_shared/assertAdmin.js" "$ROOT/deleteEvent/assertAdmin.js"
cp "$ROOT/_shared/assertAdmin.js" "$ROOT/updateEventPhotos/assertAdmin.js"
cp "$ROOT/_shared/assertAdmin.js" "$ROOT/updateEvent/assertAdmin.js"
cp "$ROOT/_shared/assertAdmin.js" "$ROOT/deletePhoto/assertAdmin.js"
for fn in createRunner updateRunner deleteRunner listRunners; do
  mkdir -p "$ROOT/$fn"
  cp "$ROOT/_shared/assertAdmin.js" "$ROOT/$fn/assertAdmin.js"
  cp "$ROOT/_shared/menu.js" "$ROOT/$fn/menu.js"
  cp "$ROOT/_shared/runners.js" "$ROOT/$fn/runners.js"
done
echo "copied shared modules"
```

保留旧文件名：让 `copy-assert-admin.sh` 调用这份逻辑（覆盖原脚本内容即可，文件名不变以免断掉旧文档）。`listRunners` 不需要 assertAdmin，拷过去无妨。`getStarbucksMenu` 不拷 shared。

`listRunners/index.js`：

```js
const cloud = require('wx-server-sdk');
const { sortRunners } = require('./runners');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

exports.main = async () => {
  try {
    const res = await db.collection('runners').limit(100).get();
    const runners = sortRunners(
      (res.data || []).map((doc) => ({
        id: doc.id,
        nickname: doc.nickname,
        drinks: doc.drinks || [],
        foods: doc.foods || [],
      }))
    );
    return { code: 0, msg: 'ok', data: { runners } };
  } catch (err) {
    return { code: -1, msg: err.message || '名单暂时读不出来，请稍后重试' };
  }
};
```

- [ ] **Step 3: 跑 shared 测试，确认没被破坏**

```bash
bash miniprogram/cloudfunctions/_shared/copy-assert-admin.sh
node --test miniprogram/cloudfunctions/_shared/*.test.js
```

Expected: all pass；`listRunners/runners.js` 存在

- [ ] **Step 4: Commit**

```bash
git add miniprogram/cloudfunctions/getStarbucksMenu miniprogram/cloudfunctions/listRunners miniprogram/cloudfunctions/_shared/copy-assert-admin.sh
git commit -m "feat: add getStarbucksMenu and listRunners cloud functions"
```

---

### Task 4: 写云函数

**Files:**
- Create: `miniprogram/cloudfunctions/createRunner/index.js`
- Create: `miniprogram/cloudfunctions/createRunner/package.json`
- Create: `miniprogram/cloudfunctions/updateRunner/index.js`
- Create: `miniprogram/cloudfunctions/updateRunner/package.json`
- Create: `miniprogram/cloudfunctions/deleteRunner/index.js`
- Create: `miniprogram/cloudfunctions/deleteRunner/package.json`

三个 `package.json` 与 `updateEvent` 相同，只改 `name`：

```json
{
  "name": "createRunner",
  "version": "1.0.0",
  "main": "index.js",
  "dependencies": {
    "wx-server-sdk": "~2.6.3",
    "@cloudbase/node-sdk": "~3.10.0"
  }
}
```

- [ ] **Step 1: 实现 `createRunner/index.js`**

```js
const cloud = require('wx-server-sdk');
const { assertAdmin } = require('./assertAdmin');
const {
  generateRunnerId,
  requireWebKind,
  validateRunnerPayload,
  nicknameTaken,
} = require('./runners');

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

async function loadMenu() {
  const res = await db.collection('starbucksMenu').where({ id: 'current' }).limit(1).get();
  return res.data[0] || null;
}

async function loadRunners() {
  const res = await db.collection('runners').limit(100).get();
  return res.data || [];
}

exports.main = async (event) => {
  try {
    const gate = requireWebKind(await assertAdmin(cloud, db));
    if (!gate.ok) return { code: gate.code, msg: gate.msg };
    const menu = await loadMenu();
    if (!menu) return { code: -1, msg: '菜单未导入' };
    const parsed = validateRunnerPayload(menu, event || {});
    if (!parsed.ok) return { code: -1, msg: parsed.msg };
    const existing = await loadRunners();
    if (nicknameTaken(existing, parsed.nickname)) {
      return { code: -1, msg: '已有同名跑友，请改成能区分的名字' };
    }
    let id = generateRunnerId();
    for (let i = 0; i < 5 && existing.some((r) => r.id === id); i++) {
      id = generateRunnerId();
    }
    const now = new Date().toISOString();
    const doc = {
      id,
      nickname: parsed.nickname,
      drinks: parsed.drinks,
      foods: parsed.foods,
      createdAt: now,
      updatedAt: now,
    };
    await db.collection('runners').add({ data: doc });
    return { code: 0, msg: 'ok', data: { runner: doc } };
  } catch (err) {
    return { code: -1, msg: err.message || '保存失败，请重试' };
  }
};
```

- [ ] **Step 2: 实现 `updateRunner/index.js`**

```js
const cloud = require('wx-server-sdk');
const { assertAdmin } = require('./assertAdmin');
const { requireWebKind, validateRunnerPayload, nicknameTaken } = require('./runners');

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

exports.main = async (event) => {
  try {
    const gate = requireWebKind(await assertAdmin(cloud, db));
    if (!gate.ok) return { code: gate.code, msg: gate.msg };
    const id = String((event && event.id) || '');
    if (!id) return { code: -1, msg: '缺少跑友 id' };
    const menuRes = await db.collection('starbucksMenu').where({ id: 'current' }).limit(1).get();
    const menu = menuRes.data[0];
    if (!menu) return { code: -1, msg: '菜单未导入' };
    const parsed = validateRunnerPayload(menu, event || {});
    if (!parsed.ok) return { code: -1, msg: parsed.msg };
    const all = await db.collection('runners').limit(100).get();
    const doc = (all.data || []).find((r) => r.id === id);
    if (!doc) return { code: -1, msg: '跑友不存在' };
    if (nicknameTaken(all.data || [], parsed.nickname, id)) {
      return { code: -1, msg: '已有同名跑友，请改成能区分的名字' };
    }
    const patch = {
      nickname: parsed.nickname,
      drinks: parsed.drinks,
      foods: parsed.foods,
      updatedAt: new Date().toISOString(),
    };
    await db.collection('runners').doc(doc._id).update({ data: patch });
    return { code: 0, msg: 'ok', data: { runner: { ...doc, ...patch } } };
  } catch (err) {
    return { code: -1, msg: err.message || '保存失败，请重试' };
  }
};
```

- [ ] **Step 3: 实现 `deleteRunner/index.js`**

```js
const cloud = require('wx-server-sdk');
const { assertAdmin } = require('./assertAdmin');
const { requireWebKind } = require('./runners');

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

exports.main = async (event) => {
  try {
    const gate = requireWebKind(await assertAdmin(cloud, db));
    if (!gate.ok) return { code: gate.code, msg: gate.msg };
    const id = String((event && event.id) || '');
    if (!id) return { code: -1, msg: '缺少跑友 id' };
    const res = await db.collection('runners').where({ id }).limit(1).get();
    const doc = res.data[0];
    if (!doc) return { code: -1, msg: '跑友不存在' };
    await db.collection('runners').doc(doc._id).remove();
    return { code: 0, msg: 'ok', data: { id } };
  } catch (err) {
    return { code: -1, msg: err.message || '删除失败，请重试' };
  }
};
```

- [ ] **Step 4: 拷贝 shared 并跑测试**

```bash
bash miniprogram/cloudfunctions/_shared/copy-assert-admin.sh
node --test miniprogram/cloudfunctions/_shared/*.test.js
```

Expected: pass

- [ ] **Step 5: Commit**

```bash
git add miniprogram/cloudfunctions/createRunner miniprogram/cloudfunctions/updateRunner miniprogram/cloudfunctions/deleteRunner miniprogram/cloudfunctions/_shared/copy-assert-admin.sh
git commit -m "feat: add createRunner, updateRunner, deleteRunner cloud functions"
```

---

### Task 5: 导入菜单并部署云函数

**Files:** 无代码。操作现有环境 `run-spot-prod-d1gb2jd1j3ce2e7fb`。

- [ ] **Step 1: 确认集合**

用 MCP `readNoSqlDatabaseStructure`。若没有 `starbucksMenu` / `runners`，`writeNoSqlDatabaseStructure` 创建两个集合（权限安全规则与 `events` 只读类似：客户端不写，云函数写）。

- [ ] **Step 2: 导入菜单**

读 `data/starbucks-menu.json`，`writeNoSqlDatabaseContent`：
- 若已有 `{id:"current"}` 则 `update` `$set` `customizations`/`drinks`/`foods`
- 否则 `insert` 整份文档加上 `"id": "current"`

不要写入 `price`。截图目录 `data/starbucksimages/` 只入库外备份，不导入数据库。

- [ ] **Step 3: 部署五个函数**

```bash
bash miniprogram/cloudfunctions/_shared/copy-assert-admin.sh
```

对 `getStarbucksMenu`、`listRunners`、`createRunner`、`updateRunner`、`deleteRunner` 用 MCP `manageCloudFunction` / `createFunction`（已存在则更新代码）。`createRunner`/`updateRunner`/`deleteRunner` 需要 `@cloudbase/node-sdk`（assertAdmin 读 uid）。

- [ ] **Step 4: 冒烟**

调用 `getStarbucksMenu`，确认 `data.drinks` 含 `d-latte`。调用 `listRunners`，确认 `runners` 为数组（可为空）。

- [ ] **Step 5: Commit**（若有本地 config 变更；没有则跳过）

---

### Task 6: 后台 runners 库

**Files:**
- Modify: `admin/src/types.ts`
- Create: `admin/src/lib/runners.ts`
- Create: `admin/src/lib/runners.test.ts`

- [ ] **Step 1: 写失败测试**

```ts
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
```

- [ ] **Step 2: 跑测试，确认失败**

```bash
cd admin && npx vitest run src/lib/runners.test.ts
```

Expected: 找不到模块

- [ ] **Step 3: 实现类型和库**

`admin/src/types.ts` 追加：

```ts
export type MenuOption = { group: string; id: string; label: string };

export type RunnerDrink = {
  itemId: string;
  name: string;
  options: MenuOption[];
};

export type RunnerFood = {
  itemId: string;
  name: string;
};

export type Runner = {
  id: string;
  nickname: string;
  drinks: RunnerDrink[];
  foods: RunnerFood[];
};

export type MenuItem = { id: string; category: string; name: string; subtitle?: string; new?: boolean };

export type MenuChoice = { id: string; label: string; recommended?: boolean };

export type StarbucksMenu = {
  id: string;
  customizations: Record<string, unknown>;
  drinks: MenuItem[];
  foods: MenuItem[];
};
```

`admin/src/lib/runners.ts`：

```ts
import type { Runner, RunnerDrink } from '../types';

export function formatDrinkLine(drink: RunnerDrink): string {
  const parts = [drink.name, ...(drink.options || []).map((o) => o.label).filter(Boolean)];
  return parts.join(' · ');
}

export function emptyDraft(): { nickname: string; drinks: RunnerDrink[]; foods: Runner['foods'] } {
  return { nickname: '', drinks: [], foods: [] };
}
```

- [ ] **Step 4: 再跑测试**

```bash
cd admin && npx vitest run src/lib/runners.test.ts
```

Expected: pass

- [ ] **Step 5: Commit**

```bash
git add admin/src/types.ts admin/src/lib/runners.ts admin/src/lib/runners.test.ts
git commit -m "feat(admin): add runner types and drink line formatter"
```

---

### Task 7: 后台名单页和路由

**Files:**
- Create: `admin/src/pages/RunnerListPage.tsx`
- Modify: `admin/src/App.tsx`
- Modify: `admin/src/pages/EventListPage.tsx`
- Modify: `admin/src/styles.css`

- [ ] **Step 1: `RunnerListPage.tsx`**

```tsx
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { callFn } from '../lib/api';
import { formatDrinkLine } from '../lib/runners';
import type { Runner } from '../types';

export function RunnerListPage() {
  const [runners, setRunners] = useState<Runner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  const [busyId, setBusyId] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError('');
      const res = await callFn<{ runners: Runner[] }>('listRunners');
      if (cancelled) return;
      if (!res.ok) {
        setError(res.msg);
        setRunners([]);
      } else {
        setRunners(res.data?.runners ?? []);
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [retry]);

  async function onDelete(runner: Runner) {
    if (!window.confirm(`确定删除 ${runner.nickname}？删除后需重新录入`)) return;
    setBusyId(runner.id);
    const res = await callFn('deleteRunner', { id: runner.id });
    setBusyId('');
    if (!res.ok) {
      setError(res.msg || '删除失败，请重试');
      return;
    }
    setRetry((n) => n + 1);
  }

  return (
    <main className="list-page">
      <header className="list-header">
        <div>
          <p className="list-nav">
            <Link to="/">活动</Link>
            <span> / 跑友口味</span>
          </p>
          <h1>跑友口味</h1>
        </div>
        <Link to="/runners/new" className="list-new">
          + 新跑友
        </Link>
      </header>
      {loading ? <p>加载中...</p> : null}
      {error ? (
        <section className="list-error">
          <p className="auth-error" role="alert">{error}</p>
          <button type="button" onClick={() => setRetry((n) => n + 1)}>重试</button>
        </section>
      ) : null}
      {!loading && !error && runners.length === 0 ? (
        <p className="list-empty">还没有跑友口味</p>
      ) : null}
      <ul className="event-list">
        {runners.map((runner) => (
          <li key={runner.id} className="runner-row">
            <Link to={`/runners/${runner.id}`} className="event-card">
              <strong>{runner.nickname}</strong>
              <span className="event-meta">
                咖啡 {runner.drinks.length} · 餐 {runner.foods.length}
              </span>
              {runner.drinks.slice(0, 2).map((d, i) => (
                <span key={i} className="event-meta">{formatDrinkLine(d)}</span>
              ))}
            </Link>
            <button
              type="button"
              className="runner-delete"
              disabled={busyId === runner.id}
              onClick={() => onDelete(runner)}
            >
              删除
            </button>
          </li>
        ))}
      </ul>
    </main>
  );
}
```

- [ ] **Step 2: 路由**

`App.tsx` 增加 import，在 `ProtectedLayout` 内：

```tsx
<Route path="/" element={<EventListPage />} />
<Route path="/runners" element={<RunnerListPage />} />
<Route path="/runners/new" element={<RunnerFormPage key="create" mode="create" />} />
<Route path="/runners/:id" element={<RunnerFormPage mode="edit" />} />
<Route path="/events/new" element={<EventFormPage key="create" mode="create" />} />
<Route path="/events/:id" element={<EventFormPage mode="edit" />} />
```

本 task 若 `RunnerFormPage` 还不存在，先做占位：

```tsx
export function RunnerFormPage({ mode }: { mode: 'create' | 'edit' }) {
  return <main className="list-page"><p>表单将在下一 task 实现（{mode}）</p></main>;
}
```

放在 `admin/src/pages/RunnerFormPage.tsx`。

`EventListPage` header 增加：

```tsx
<Link to="/runners" className="list-secondary">跑友口味</Link>
```

- [ ] **Step 3: 样式**

```css
.list-nav { margin: 0 0 8px; font-size: 14px; color: #666; }
.list-secondary {
  margin-right: 12px;
  color: var(--color-sbux);
}
.runner-row { display: flex; gap: 8px; align-items: flex-start; }
.runner-row .event-card { flex: 1; }
.runner-delete {
  border: 0;
  background: transparent;
  color: #a12b1a;
  cursor: pointer;
}
```

- [ ] **Step 4: 现有 admin 测试不能挂**

```bash
cd admin && npm test
```

Expected: 原 12 个 + Task 6 的测试通过

- [ ] **Step 5: Commit**

```bash
git add admin/src/App.tsx admin/src/pages/RunnerListPage.tsx admin/src/pages/RunnerFormPage.tsx admin/src/pages/EventListPage.tsx admin/src/styles.css
git commit -m "feat(admin): add runner list route and navigation"
```

---

### Task 8: 后台录入表单

**Files:**
- Modify: `admin/src/pages/RunnerFormPage.tsx`（替换占位）

- [ ] **Step 1: 实现完整表单**

行为必须满足 spec：

- 加载 `getStarbucksMenu`
- 编辑态用 `listRunners` 找到 `id === params.id`；找不到显示错误
- 昵称 input 必填
- 「添加咖啡」：`<select>` 按 `category` 分组（`<optgroup>`），选中后追加 `{ itemId, name, options: [] }`
- 每杯咖啡展开配置：对 `customizations` 的数组字段渲染 radio；`sugarFreeFlavor.options` 同样；`espressoShots` number min=1；`storeCup` checkbox
- 「添加餐食」：foods 的 optgroup select
- 提交：create 调 `createRunner`，edit 调 `updateRunner`；成功 `navigate('/runners')`
- 空提交文案用云函数返回；本地也可先挡：无昵称 / 两边都空
- 失败时表单内容保留，`role="alert"` 显示 `保存失败，请重试` 或云函数 `msg`

配置勾选写入：

```ts
function setOption(drink: RunnerDrink, group: string, id: string, label: string): RunnerDrink {
  const rest = drink.options.filter((o) => o.group !== group);
  return { ...drink, options: [...rest, { group, id, label }] };
}
```

`storeCup` 取消勾选则去掉该 group。

关键结构（完整文件按此写，不要留占位）：

```tsx
import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { callFn } from '../lib/api';
import { emptyDraft } from '../lib/runners';
import type { Runner, RunnerDrink, StarbucksMenu } from '../types';

export function RunnerFormPage({ mode }: { mode: 'create' | 'edit' }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [menu, setMenu] = useState<StarbucksMenu | null>(null);
  const [draft, setDraft] = useState(emptyDraft());
  const [error, setError] = useState('');
  const [loadError, setLoadError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const menuRes = await callFn<StarbucksMenu>('getStarbucksMenu');
      if (cancelled) return;
      if (!menuRes.ok || !menuRes.data) {
        setLoadError(menuRes.msg || '菜单未导入');
        return;
      }
      setMenu(menuRes.data);
      if (mode === 'edit' && id) {
        const listRes = await callFn<{ runners: Runner[] }>('listRunners');
        if (cancelled) return;
        const found = listRes.data?.runners.find((r) => r.id === id);
        if (!listRes.ok || !found) {
          setLoadError('跑友不存在');
          return;
        }
        setDraft({ nickname: found.nickname, drinks: found.drinks, foods: found.foods });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [mode, id]);

  async function onSubmit(e: React.FormEvent) {
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
    setSaving(false);
    if (!res.ok) {
      setError(res.msg || '保存失败，请重试');
      return;
    }
    navigate('/runners');
  }

  return (
    <main className="list-page">
      <p className="list-nav">
        <Link to="/runners">跑友口味</Link>
        <span> / {mode === 'create' ? '新增' : '编辑'}</span>
      </p>
      {loadError ? <p className="auth-error" role="alert">{loadError}</p> : null}
      {menu && !loadError ? (
        <form className="auth-card" style={{ maxWidth: 640 }} onSubmit={onSubmit}>
          <label>
            群昵称
            <input
              value={draft.nickname}
              onChange={(e) => setDraft({ ...draft, nickname: e.target.value })}
            />
          </label>
          {/* drinks list + category optgroup select + option radios */}
          {/* foods list + optgroup select */}
          {error ? <p className="auth-error" role="alert">{error}</p> : null}
          <button type="submit" disabled={saving}>保存</button>
        </form>
      ) : null}
    </main>
  );
}
```

实现时把注释换成真实 JSX。饮品 `optgroup`：

```tsx
const drinkGroups = useMemo(() => {
  const map = new Map<string, StarbucksMenu['drinks']>();
  (menu?.drinks || []).forEach((d) => {
    const list = map.get(d.category) || [];
    list.push(d);
    map.set(d.category, list);
  });
  return [...map.entries()];
}, [menu]);
```

- [ ] **Step 2: `cd admin && npm test` 以及 `npm run build`**

Expected: tests pass；`tsc -b && vite build` 成功

- [ ] **Step 3: Commit**

```bash
git add admin/src/pages/RunnerFormPage.tsx admin/src/styles.css
git commit -m "feat(admin): add runner taste form with menu options"
```

---

### Task 9: 小程序只读页

**Files:**
- Create: `miniprogram/pages/runners/runners.js`
- Create: `miniprogram/pages/runners/runners.wxml`
- Create: `miniprogram/pages/runners/runners.wxss`
- Create: `miniprogram/pages/runners/runners.json`
- Modify: `miniprogram/app.json`

- [ ] **Step 1: `runners.json`**

```json
{
  "navigationBarTitleText": "星巴克口味",
  "enablePullDownRefresh": true
}
```

- [ ] **Step 2: `runners.js`**

```js
function drinkLine(drink) {
  const labels = (drink.options || []).map((o) => o.label).filter(Boolean);
  return [drink.name].concat(labels).join(' · ');
}

Page({
  data: { loading: true, error: '', runners: [] },
  onLoad() { this.load(); },
  onPullDownRefresh() {
    this.load().then(() => wx.stopPullDownRefresh());
  },
  async load() {
    this.setData({ loading: true, error: '' });
    try {
      const res = await wx.cloud.callFunction({ name: 'listRunners' });
      const body = res.result || {};
      if (body.code !== 0) {
        this.setData({ loading: false, error: body.msg || '名单暂时读不出来，请稍后重试', runners: [] });
        return;
      }
      const runners = (body.data.runners || []).map((r) => ({
        ...r,
        drinkLines: (r.drinks || []).map(drinkLine),
        foodLines: (r.foods || []).map((f) => f.name),
      }));
      this.setData({ loading: false, runners });
    } catch (e) {
      this.setData({ loading: false, error: '名单暂时读不出来，请稍后重试', runners: [] });
    }
  },
});
```

- [ ] **Step 3: `runners.wxml`**

```xml
<view class="container">
  <view wx:if="{{loading}}" class="loading"><text>加载中...</text></view>
  <view wx:if="{{error}}" class="empty"><text>{{error}}</text></view>
  <view wx:if="{{!loading && !error && runners.length === 0}}" class="empty">
    <text>团长还没录入口味</text>
  </view>
  <view wx:for="{{runners}}" wx:key="id" class="card">
    <view class="name">{{item.nickname}}</view>
    <view wx:if="{{item.drinkLines.length}}" class="block">
      <view class="label">咖啡</view>
      <view wx:for="{{item.drinkLines}}" wx:for-item="line" wx:key="*this" class="line">{{line}}</view>
    </view>
    <view wx:if="{{item.foodLines.length}}" class="block">
      <view class="label">餐食</view>
      <view wx:for="{{item.foodLines}}" wx:for-item="line" wx:key="*this" class="line">{{line}}</view>
    </view>
  </view>
</view>
```

- [ ] **Step 4: `runners.wxss`**

白底卡片，标题 `#C74634`，label 用 `#006241`。只有咖啡或只有餐时不要空标题（wxml 已用 `wx:if`）。

- [ ] **Step 5: `app.json` pages 数组加入 `"pages/runners/runners"`（放在 home 之后）**

- [ ] **Step 6: Commit**

```bash
git add miniprogram/pages/runners miniprogram/app.json
git commit -m "feat(mp): add read-only Starbucks taste list page"
```

---

### Task 10: 首页入口

**Files:**
- Modify: `miniprogram/pages/home/home.wxml`
- Modify: `miniprogram/pages/home/home.js`
- Modify: `miniprogram/pages/home/home.wxss`

- [ ] **Step 1: 在品牌头和「本周集合」之间加卡片**

```xml
<view class="taste-entry" bindtap="onTasteTap">
  <text class="taste-entry__title">星巴克口味</text>
  <text class="taste-entry__sub">跑完按癖好点咖啡和早餐</text>
</view>
```

- [ ] **Step 2: `home.js`**

```js
onTasteTap() {
  wx.navigateTo({ url: '/pages/runners/runners' });
},
```

- [ ] **Step 3: 卡片样式用品牌红字 + 白底圆角，与现有 `up-card` 间距一致。**

- [ ] **Step 4: Commit**

```bash
git add miniprogram/pages/home/home.wxml miniprogram/pages/home/home.js miniprogram/pages/home/home.wxss
git commit -m "feat(mp): add home entry to Starbucks taste list"
```

---

### Task 11: 文档

**Files:**
- Modify: `README.md`
- Modify: `admin/README.md`
- Modify: `docs/superpowers/specs/2026-09-18-starbucks-preferences-design.md`（状态改为实现中/完成后改为已实现——本 task 在功能落地后把状态写成「已实现」）
- Add: `data/starbucksimages/` 若尚未入库（coffee.png / config.png / food.png），作为截图来源提交

- [ ] **Step 1: README**

- 状态增加：✅ **星巴克口味备忘录**（后台代填，小程序只读）
- 结构：`data/starbucks-menu.json`、`pages/runners/`
- 云函数改为 15 个，列出 `getStarbucksMenu` / `listRunners` / `createRunner` / `updateRunner` / `deleteRunner`
- 操作流程：团长后台录入群昵称 + 咖啡配置 + 餐；到店打开小程序「星巴克口味」
- 文档表增加 spec 链接
- 版本：✅ **v6** 口味备忘录

不要写密码。不要写价格。

- [ ] **Step 2: `admin/README.md`**

补充路由 `#/runners`、`#/runners/new`、`#/runners/:id`。说明菜单来自 `starbucksMenu`，后台不编辑菜单。

- [ ] **Step 3: 全量测试**

```bash
node --test miniprogram/cloudfunctions/_shared/*.test.js
cd admin && npm test && npm run build
```

Expected: 全部通过

- [ ] **Step 4: 部署后台静态资源到 `/admin/`**（与 v5 相同：先构建 `admin/dist`，上传到托管 `admin/` 路径，禁止覆盖 H5 根）

- [ ] **Step 5: Commit**

```bash
git add README.md admin/README.md docs/superpowers/specs/2026-09-18-starbucks-preferences-design.md data/starbucksimages
git commit -m "docs: document v6 Starbucks runner tastes"
```

---

## Self-review

| Spec 条目 | Task |
|---|---|
| JSON 菜单导入、无价格库存 | 5 |
| `runners` 文档形状、label 写入、硬删 | 2, 4 |
| 昵称唯一、可两杯同品 | 2, 4 |
| 写操作仅 web 管理员 | 2, 4 |
| `getStarbucksMenu` / `listRunners` 公开读 | 3 |
| 后台列表/表单/配置 | 7, 8 |
| 小程序只读 + 中文行 | 9 |
| 首页入口 | 10 |
| 空态/错误文案 | 3, 4, 7, 8, 9 |
| 不改 H5、⚙️、不做菜单 CMS | 全任务未列入 |

无 TBD。`formatDrinkLine` 在 shared 与 admin 各一份（小程序再内联），避免小程序依赖 Node shared。
