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
