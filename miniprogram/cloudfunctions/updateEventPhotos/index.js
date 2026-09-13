// 云函数 updateEventPhotos
// 入参：{ eventId, fileID, size, uploaderName }
// 功能：把照片信息原子追加到 events.photos（用 _push 避免并发覆盖）

const cloud = require('wx-server-sdk');

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const db = cloud.database();
const _ = db.command;  // 🆕 用于原子操作

const MAX_PHOTOS_PER_EVENT = 100;     // 每个活动最多 100 张
const MAX_FILE_SIZE = 600 * 1024;     // 单张最大 600KB

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const { eventId, fileID, size, uploaderName } = event || {};
  const openid = wxContext.OPENID;

  // 入参校验
  if (!eventId) {
    return { code: -1, msg: '缺少 eventId', data: null };
  }
  if (!fileID || !fileID.startsWith('cloud://')) {
    return { code: -1, msg: 'fileID 不合法', data: null };
  }
  if (size && size > MAX_FILE_SIZE) {
    return { code: -1, msg: `图片太大（${(size/1024).toFixed(0)}KB），请压缩到 ${MAX_FILE_SIZE/1024}KB 以下` };
  }

  try {
    // 1. 查活动（只查不写，避免读写竞态）
    const eventRes = await db.collection('events').where({ id: eventId }).limit(1).get();
    if (eventRes.data.length === 0) {
      return { code: -1, msg: '活动不存在', data: null };
    }
    const e = eventRes.data[0];
    const photos = e.photos || [];

    // 限流：每个活动最多 100 张（基于当前读到的计数）
    if (photos.length >= MAX_PHOTOS_PER_EVENT) {
      return { code: -1, msg: `活动照片已达上限 ${MAX_PHOTOS_PER_EVENT} 张`, data: null };
    }

    // 限制：同一跑友每场活动最多 9 张（基于当前读到的计数）
    const myCount = photos.filter((p) => p.uploader === openid).length;
    if (myCount >= 9) {
      return { code: -1, msg: '你已经上传过 9 张了（每场活动最多 9 张）', data: null };
    }

    // 构造新照片记录
    const newPhoto = {
      fileID,
      uploader: openid,
      uploaderName: uploaderName || '匿名跑友',
      uploadedAt: new Date().toISOString(),
      size: size || 0,
    };

    // 🆕 原子 push 操作（关键修复！）
    // 之前的"先读后写"会导致并发覆盖
    // 现在用 _push 原子地往数组里追加，多用户同时上传也不会互相覆盖
    const updateRes = await db.collection('events').where({ id: eventId }).update({
      data: {
        photos: _.push([newPhoto]),  // ← 原子 push 一个数组
      },
    });

    return {
      code: 0,
      msg: 'ok',
      data: {
        photo: newPhoto,
        // 实际数据库中的 photos 数量（基于 _push 的返回值）
        updated: updateRes.updated || 1,
      },
    };
  } catch (err) {
    console.error('updateEventPhotos 失败', err);
    return {
      code: -1,
      msg: err.message || '上传失败',
      data: null,
    };
  }
};