// 云函数 adminDeleteEvent（普通云函数版）
// 入参：{ openid, id }
// 功能：删除活动 + 清理云存储所有照片 + 数据库记录

const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

exports.main = async (event, context) => {
  const { openid, id } = event || {};

  if (!openid) return { code: -1, msg: '缺少 openid' };

  // 权限校验
  const teamRes = await db.collection('team').where({ id: 'meta' }).limit(1).get();
  const admins = teamRes.data[0]?.admins || [];
  if (!admins.includes(openid)) return { code: -1, msg: '未授权' };

  if (!id) return { code: -1, msg: '缺少 id 参数' };

  try {
    // 1. 查活动
    const eventRes = await db.collection('events').where({ id }).limit(1).get();
    if (eventRes.data.length === 0) {
      return { code: -1, msg: '活动不存在' };
    }
    const e = eventRes.data[0];

    // 2. 删除云存储中的所有照片
    let deletedFiles = 0;
    if (e.photos && e.photos.length > 0) {
      const fileList = e.photos.map((p) => p.fileID);
      try {
        const deleteRes = await cloud.deleteFile({ fileList });
        if (deleteRes.fileList) {
          deletedFiles = deleteRes.fileList.filter((f) => f.status === 'success').length;
        }
      } catch (err) {
        console.warn('云存储照片删除失败，继续删除数据库', err);
      }
    }

    // 3. 删除数据库记录
    const deleteDbRes = await db.collection('events').where({ id }).remove();

    return {
      code: 0,
      msg: 'ok',
      data: {
        removed: deleteDbRes.removed || 1,
        deletedFiles,
        eventTitle: e.title || e.meet?.name,
      },
    };
  } catch (err) {
    console.error('adminDeleteEvent 失败', err);
    return { code: -1, msg: err.message || '删除失败' };
  }
};