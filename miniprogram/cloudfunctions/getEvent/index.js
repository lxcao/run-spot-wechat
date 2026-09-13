// 云函数 getEvent (NoSQL 集合版 · 嵌套对象)
const cloud = require('wx-server-sdk');

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const db = cloud.database();

exports.main = async (event, context) => {
  const { id } = event || {};
  if (!id) {
    return { code: -1, msg: '缺少 id 参数', data: null };
  }

  try {
    const result = await db.collection('events').where({ id }).limit(1).get();
    if (result.data.length === 0) {
      return { code: -1, msg: '活动不存在', data: null };
    }
    return { code: 0, msg: 'ok', data: result.data[0] };
  } catch (err) {
    console.error('getEvent 失败', err);
    return {
      code: -1,
      msg: err.message || '查询失败',
      data: null,
    };
  }
};
