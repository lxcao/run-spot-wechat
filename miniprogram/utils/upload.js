// utils/upload.js
// 封装：选图 → 压缩 → 上传到云存储 → 写数据库

const TARGET_SIZE_KB = 500; // 目标压缩大小

// 压缩图片
function compressImage(src) {
  return new Promise((resolve, reject) => {
    wx.compressImage({
      src,
      quality: 80,
      success: (res) => resolve(res.tempFilePath),
      fail: (err) => reject(err),
    });
  });
}

// 上传单个文件到云存储
function uploadToCloud(cloudPath, filePath) {
  return new Promise((resolve, reject) => {
    wx.cloud.uploadFile({
      cloudPath,
      filePath,
      success: (res) => resolve(res.fileID),
      fail: (err) => reject(err),
    });
  });
}

// 获取用户信息（昵称）
function getUserProfile() {
  return new Promise((resolve) => {
    wx.getUserProfile({
      desc: '用于显示您的昵称',
      success: (res) => resolve(res.userInfo),
      fail: () => resolve({ nickName: '匿名跑友' }),
    });
  });
}

/**
 * 选择图片 → 压缩 → 上传 → 写数据库
 * @param {string} eventId - 活动 ID
 * @returns {Promise<{fileID, totalCount}>}
 */
async function chooseAndUpload(eventId) {
  // 1. 选图
  const chooseRes = await new Promise((resolve, reject) => {
    wx.chooseMedia({
      count: 9,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      sizeType: ['compressed'],
      success: resolve,
      fail: reject,
    });
  });

  const files = chooseRes.tempFiles || [];
  if (files.length === 0) {
    throw new Error('未选择图片');
  }

  // 2. 获取用户昵称
  const userInfo = await getUserProfile();
  const uploaderName = userInfo.nickName || '匿名跑友';

  // 3. 批量压缩 + 上传
  wx.showLoading({ title: `上传中 0/${files.length}` });
  const results = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    wx.showLoading({ title: `上传中 ${i + 1}/${files.length}` });

    try {
      // 3a. 压缩
      let compressedPath = file.tempFilePath;
      if (file.size > TARGET_SIZE_KB * 1024) {
        try {
          compressedPath = await compressImage(file.tempFilePath);
        } catch (e) {
          // 压缩失败就用原图
          console.warn('压缩失败，用原图', e);
        }
      }

      // 3b. 上传到云存储
      const date = new Date().toISOString().slice(0, 10);
      const randomId = Math.random().toString(36).slice(2, 8);
      const cloudPath = `events/${eventId}/${date}_${randomId}_${i + 1}.jpg`;
      const fileID = await uploadToCloud(cloudPath, compressedPath);

      // 3c. 立即把 fileID 转成可显示的 tempURL（不依赖后续加载）
      let tempURL = fileID;
      try {
        const tempRes = await wx.cloud.getTempFileURL({ fileList: [fileID] });
        if (tempRes.fileList && tempRes.fileList[0]) {
          tempURL = tempRes.fileList[0].tempFileURL;
        }
      } catch (e) {
        console.warn('getTempFileURL 失败', e);
      }

      // 3d. 写数据库
      const writeRes = await wx.cloud.callFunction({
        name: 'updateEventPhotos',
        data: {
          eventId,
          fileID,
          uploaderName,
        },
      });

      if (writeRes.result && writeRes.result.code === 0) {
        // 返回完整照片对象（含 tempURL）
        const photo = {
          ...writeRes.result.data.photo,
          tempURL, // 立即可显示的 URL
        };
        results.push(photo);
      } else {
        throw new Error(writeRes.result?.msg || '写数据库失败');
      }
    } catch (err) {
      console.error(`第 ${i + 1} 张上传失败`, err);
      // 继续上传下一张
    }
  }

  wx.hideLoading();

  if (results.length === 0) {
    throw new Error('所有照片上传失败');
  }

  return { uploaded: results };
}

module.exports = { chooseAndUpload, compressImage, uploadToCloud };