// 云函数 adminLogin
// 支持两种调用方式：
//   1. 小程序端 wx.cloud.callFunction('adminLogin') → 用 wx 上下文的 OPENID
//   2. 网页端 HTTP POST /adminLogin → body 传 { openid: 'xxx' }

const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const db = cloud.database();

exports.main = async (event, context) => {
  // 1. 优先用 wx 上下文的 OPENID
  let openid = null;
  try {
    const wxContext = cloud.getWXContext();
    if (wxContext.OPENID) openid = wxContext.OPENID;
  } catch (e) {
    // HTTP 触发时 getWXContext 可能报错，忽略
  }

  // 2. 如果 wx 上下文没拿到 openid（HTTP 触发），从 event 取
  if (!openid && event && event.openid) {
    openid = event.openid;
  }

  if (!openid) {
    return { code: -1, msg: '缺少 openid（小程序调用会自动获取，网页端需要传 openid）' };
  }

  try {
    // 查 team.admins
    const teamRes = await db.collection('team').where({ id: 'meta' }).limit(1).get();
    if (teamRes.data.length === 0) {
      return { code: -1, msg: 'team 集合未配置' };
    }
    const team = teamRes.data[0];
    const admins = team.admins || [];
    const isAdmin = admins.includes(openid);

    return {
      code: isAdmin ? 0 : -1,
      msg: isAdmin ? 'ok' : '未授权：请联系群主把你加入管理员列表',
      data: {
        isAdmin,
        openid,
        teamName: team.name,
        teamSlogan: team.slogan,
        city: team.city,
        adminCount: admins.length,
      },
    };
  } catch (err) {
    console.error('adminLogin 失败', err);
    return { code: -1, msg: err.message || '登录失败' };
  }
};