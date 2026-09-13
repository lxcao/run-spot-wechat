// 云函数 checkAdmin
// 检查当前用户是否是管理员

const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const db = cloud.database();

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const OPENID = wxContext.OPENID;

  try {
    // 取 team.admins
    const teamRes = await db.collection('team').where({ id: 'meta' }).limit(1).get();

    if (teamRes.data.length === 0) {
      return {
        code: -1,
        msg: 'team 集合未配置',
        data: { isAdmin: false, openid: OPENID },
      };
    }

    const admins = teamRes.data[0].admins || [];
    const isAdmin = Array.isArray(admins) && admins.includes(OPENID);

    return {
      code: isAdmin ? 0 : -1,
      msg: isAdmin ? 'ok' : '未授权：联系群主把你加入管理员列表',
      data: {
        isAdmin,
        openid: OPENID,
        city: teamRes.data[0].city,
        teamName: teamRes.data[0].name,
      },
    };
  } catch (err) {
    console.error('checkAdmin 失败', err);
    return {
      code: -1,
      msg: err.message || '检查失败',
      data: { isAdmin: false, openid: OPENID },
    };
  }
};
