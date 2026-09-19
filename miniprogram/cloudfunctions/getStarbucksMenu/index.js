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
