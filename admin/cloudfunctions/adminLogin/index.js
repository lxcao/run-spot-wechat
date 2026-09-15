// 云函数 adminLogin（普通云函数版）
// 支持两种调用：
//   1. 小程序端：wx.cloud.callFunction({ name: 'adminLogin', data: { openid } })
//   2. 网页端：app.callFunction({ name: 'adminLogin', data: { openid } })

const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const db = cloud.database();

exports.main = async (event, context) => {
  // 优先用 wx 上下文的 OPENID（小程序端）
  // 退而求其次用前端传入的 openid（网页端用 anonymous uid）
  let openid = '';
  try {
    const wxContext = cloud.getWXContext();
    if (wxContext && wxContext.OPENID) {
      openid = wxContext.OPENID;
    }
  } catch (e) {
    // 忽略错误
  }
  if (!openid && event && event.openid) {
    openid = event.openid;
  }

  if (!openid) {
    return { code: -1, msg: '缺少 openid 参数' };
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