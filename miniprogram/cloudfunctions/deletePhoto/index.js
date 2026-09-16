const cloud = require('wx-server-sdk');
const { assertAdmin } = require('./assertAdmin');

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

function removePhoto(photos, fileID) {
  if (!Array.isArray(photos)) return null;
  const next = photos.filter((p) => p.fileID !== fileID);
  if (next.length === photos.length) return null;
  return next;
}

exports.removePhoto = removePhoto;

exports.main = async (event) => {
  try {
    const { eventId, fileID } = event || {};
    if (typeof eventId !== 'string' || !eventId) return { code: -1, msg: '缺少 eventId' };
    if (typeof fileID !== 'string' || !fileID.startsWith('cloud://')) {
      return { code: -1, msg: 'fileID 不合法' };
    }

    const gate = await assertAdmin(cloud, db);
    if (!gate.ok) return { code: gate.code, msg: gate.msg };

    const res = await db.collection('events').where({ id: eventId }).limit(1).get();
    if (res.data.length === 0) return { code: -1, msg: '活动不存在' };

    const next = removePhoto(res.data[0].photos || [], fileID);
    if (!next) return { code: -1, msg: '照片不存在' };

    const _ = db.command;
    await db.collection('events').where({ id: eventId }).update({
      data: { photos: _.pull({ fileID }) },
    });

    try {
      await cloud.deleteFile({ fileList: [fileID] });
    } catch (err) {
      console.warn('云存储删除失败，数据库已更新', err);
    }

    return { code: 0, msg: 'ok', data: { photos: next } };
  } catch (err) {
    console.error('deletePhoto 失败', err);
    return { code: -1, msg: err.message || '删除失败' };
  }
};
