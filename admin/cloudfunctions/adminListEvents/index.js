// 云函数 adminListEvents
// 入参：可选 { status: 'upcoming'|'past'|'all' }
// 返回：{ code: 0, data: { events: [...], total } }

const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const db = cloud.database();

async function checkAdmin() {
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;
  const teamRes = await db.collection('team').where({ id: 'meta' }).limit(1).get();
  const admins = teamRes.data[0]?.admins || [];
  return admins.includes(openid);
}

exports.main = async (event, context) => {
  // 权限检查
  if (!(await checkAdmin())) {
    return { code: -1, msg: '未授权' };
  }

  const { status = 'all' } = event || {};

  try {
    let query = {};
    if (status === 'upcoming' || status === 'past') {
      query.status = status;
    }

    const res = await db.collection('events').where(query).get();
    
    // 按日期倒序
    const events = res.data.sort((a, b) => (b.date || '').localeCompare(a.date || ''));

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
