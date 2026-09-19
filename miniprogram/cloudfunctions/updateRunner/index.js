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
