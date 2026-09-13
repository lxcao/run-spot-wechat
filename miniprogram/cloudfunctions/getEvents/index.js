// 云函数 getEvents (NoSQL 集合版 · 全部从数据库读)
const cloud = require('wx-server-sdk');

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const db = cloud.database();

// 跑团基本信息从 team 集合读取（id='meta' 单条记录）
async function getTeam() {
  try {
    const res = await db.collection('team').where({ id: 'meta' }).limit(1).get();
    if (res.data.length > 0) {
      return res.data[0];
    }
    // Fallback（如果 team 集合为空，返回默认值）
    return {
      name: '甲骨文魔都跑团',
      slogan: '每个周末做回自己，八卦别人',
      city: '上海',
      logo: null,
      default_meet_msg: '周六早上 7:00 集合，跑完一起吃早饭 ☕',
    };
  } catch (err) {
    console.error('getTeam 失败', err);
    return {
      name: '甲骨文魔都跑团',
      slogan: '每个周末做回自己，八卦别人',
      city: '上海',
    };
  }
}

exports.main = async (event, context) => {
  try {
    const [teamRes, eventsRes] = await Promise.all([
      getTeam(),
      db.collection('events').orderBy('date', 'asc').get(),
    ]);
    return {
      code: 0,
      msg: 'ok',
      data: {
        team: teamRes,
        events: eventsRes.data,
      },
    };
  } catch (err) {
    console.error('getEvents 失败', err);
    return {
      code: -1,
      msg: err.message || '查询失败',
      data: { team: null, events: [] },
    };
  }
};
