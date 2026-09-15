// 云函数 adminGetStats
// 返回：{ code: 0, data: { totalEvents, totalPhotos, totalAdmins, ... } }

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
  if (!(await checkAdmin())) {
    return { code: -1, msg: '未授权' };
  }

  try {
    // 1. 活动统计
    const eventsRes = await db.collection('events').get();
    const events = eventsRes.data;
    const totalEvents = events.length;
    const upcomingEvents = events.filter((e) => e.status === 'upcoming').length;
    const pastEvents = events.filter((e) => e.status === 'past').length;
    const totalPhotos = events.reduce((sum, e) => sum + (e.photos?.length || 0), 0);

    // 2. 跑团信息
    const teamRes = await db.collection('team').where({ id: 'meta' }).limit(1).get();
    const team = teamRes.data[0] || {};
    const totalAdmins = (team.admins || []).length;

    // 3. 最新活动
    const sortedEvents = [...events].sort((a, b) =>
      (b.date || '').localeCompare(a.date || '')
    );
    const latestEvent = sortedEvents[0] || null;
    const latestEventDate = latestEvent?.date || null;

    return {
      code: 0,
      data: {
        totalEvents,
        upcomingEvents,
        pastEvents,
        totalPhotos,
        totalAdmins,
        latestEventDate,
        teamName: team.name || '甲骨文魔都跑团',
        teamSlogan: team.slogan || '',
        city: team.city || '上海',
      },
    };
  } catch (err) {
    console.error('adminGetStats 失败', err);
    return { code: -1, msg: err.message || '统计失败' };
  }
};
