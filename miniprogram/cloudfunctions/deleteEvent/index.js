// 云函数 deleteEvent
// 删除活动：数据库 + 云存储照片

const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const db = cloud.database();
const { assertAdmin } = require('./assertAdmin');

exports.main = async (event, context) => {
  const { id } = event || {};
  if (!id) {
    return { code: -1, msg: '缺少 id 参数' };
  }

  // 🔐 权限检查
  const gate = await assertAdmin(cloud, db);
  if (!gate.ok) {
    return { code: gate.code, msg: gate.msg };
  }

  try {
    // 1. 查活动
    const res = await db.collection('events').where({ id }).limit(1).get();
    if (res.data.length === 0) {
      return { code: -1, msg: '活动不存在' };
    }
    const e = res.data[0];

    // 2. 删除云存储中的所有照片
    let deletedFiles = 0;
    if (e.photos && e.photos.length > 0) {
      const fileList = e.photos.map((p) => p.fileID);
      try {
        const deleteRes = await cloud.deleteFile({ fileList });
        if (deleteRes.fileList) {
          deletedFiles = deleteRes.fileList.filter((f) => f.status === 'success').length;
        }
      } catch (e) {
        console.warn('云存储照片删除失败，继续删除数据库', e);
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
      },
    };
  } catch (err) {
    console.error('deleteEvent 失败', err);
    return { code: -1, msg: err.message || '删除失败' };
  }
};
