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
