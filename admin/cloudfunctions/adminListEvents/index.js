// 云函数 adminListEvents（普通云函数版）
// 入参：{ openid, status: 'upcoming'|'past'|'all' }
// 返回：{ code: 0, data: { events, total, upcoming, past } }

const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

exports.main = async (event, context) => {
  const { openid, status = 'all' } = event || {};

  if (!openid) return { code: -1, msg: '缺少 openid' };

  // 权限校验
  const teamRes = await db.collection('team').where({ id: 'meta' }).limit(1).get();
  const admins = teamRes.data[0]?.admins || [];
  if (!admins.includes(openid)) return { code: -1, msg: '未授权' };

  try {
    let query = {};
    if (status === 'upcoming' || status === 'past') query.status = status;

    const res = await db.collection('events').where(query).get();
    const events = res.data.sort((a, b) =>
      (b.date || '').localeCompare(a.date || '')
    );

    return {
      code: 0,
      data: {
        events,
        total: events.length,
        upcoming: events.filter((e) => e.status === 'upcoming').length,
        past: events.filter((e) => e.status === 'past').length,
      },
    };
  } catch (err) {
    console.error('adminListEvents 失败', err);
    return { code: -1, msg: err.message || '查询失败' };
  }
};