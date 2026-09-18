function decideAdmin({ openid, uid, team }) {
  if (!team || typeof team !== 'object') {
    return { ok: false, code: -1, msg: '未授权：请联系群主把你加入管理员列表' };
  }
  const admins = Array.isArray(team.admins) ? team.admins : [];
  const webAdmins = Array.isArray(team.webAdmins) ? team.webAdmins : [];
  if (openid && admins.includes(openid)) {
    return { ok: true, kind: 'mp', id: openid };
  }
  if (uid && webAdmins.includes(uid)) {
    return { ok: true, kind: 'web', id: uid };
  }
  return { ok: false, code: -1, msg: '未授权：请联系群主把你加入管理员列表' };
}

async function loadTeam(db) {
  const res = await db.collection('team').where({ id: 'meta' }).limit(1).get();
  return res.data[0] || {};
}

function readOpenId(cloud) {
  try {
    return cloud.getWXContext().OPENID || null;
  } catch (err) {
    return null;
  }
}

function readUid() {
  try {
    const tcb = require('@cloudbase/node-sdk');
    const app = tcb.init({ env: tcb.SYMBOL_CURRENT_ENV });
    const info = app.auth().getUserInfo() || {};
    return info.uid || null;
  } catch (err) {
    return null;
  }
}

async function assertAdmin(cloud, db) {
  let team;
  try {
    team = await loadTeam(db);
  } catch (err) {
    return { ok: false, code: -1, msg: '未授权：请联系群主把你加入管理员列表' };
  }
  return decideAdmin({
    openid: readOpenId(cloud),
    uid: readUid(),
    team,
  });
}

module.exports = { decideAdmin, assertAdmin };
