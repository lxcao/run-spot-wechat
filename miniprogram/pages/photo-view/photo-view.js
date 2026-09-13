// pages/photo-view/photo-view.js
// 全屏图片预览（带返回箭头、左右切换）

Page({
  data: {
    photos: [],     // [{ fileID, tempURL, uploaderName, uploadedAt }]
    current: 0,     // 当前显示的 index
    total: 0,       // 总数
  },

  onLoad(query) {
    // 接收参数：photos=JSON, current=0
    try {
      const photos = query.photos ? JSON.parse(decodeURIComponent(query.photos)) : [];
      const current = parseInt(query.current || 0, 10);
      this.setData({ photos, current, total: photos.length });
      // 标题
      wx.setNavigationBarTitle({ title: `${current + 1} / ${photos.length}` });
      // 转换所有 fileID 为 tempURL
      this.convertAll(photos);
    } catch (e) {
      console.error('参数解析失败', e);
    }
  },

  async convertAll(photos) {
    if (photos.length === 0) return;
    try {
      const fileList = photos.map((p) => p.fileID);
      const res = await wx.cloud.getTempFileURL({ fileList });
      if (res.fileList) {
        const updated = photos.map((p, i) => {
          const info = res.fileList[i];
          return { ...p, tempURL: info ? info.tempFileURL : p.fileID };
        });
        this.setData({ photos: updated });
      }
    } catch (e) {
      console.error('getTempFileURL 失败', e);
    }
  },

  // 下一张
  onNext() {
    if (this.data.current < this.data.total - 1) {
      const next = this.data.current + 1;
      this.setData({ current: next });
      wx.setNavigationBarTitle({ title: `${next + 1} / ${this.data.total}` });
    }
  },

  // 上一张
  onPrev() {
    if (this.data.current > 0) {
      const prev = this.data.current - 1;
      this.setData({ current: prev });
      wx.setNavigationBarTitle({ title: `${prev + 1} / ${this.data.total}` });
    }
  },

  // 左右滑动
  onSwiperChange(e) {
    const current = e.detail.current;
    this.setData({ current });
    wx.setNavigationBarTitle({ title: `${current + 1} / ${this.data.total}` });
  },

  // 返回
  onBack() {
    wx.navigateBack();
  },
});
