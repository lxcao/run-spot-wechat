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
