// pages/event/event.js
const app = getApp();
const { openInMap } = require('../../utils/nav.js');
const { weatherEmoji } = require('../../utils/date.js');

Page({
  data: {
    event: null,
    team: null,
    center: { lat: 31.18, lng: 121.47 },
    markers: [],
    scale: 16,
    hasMap: false,
    loading: true,
  },

  onLoad(query) {
    const id = query.id;
    if (!id) {
      wx.showToast({ title: '参数错误', icon: 'none' });
      return;
    }
    this._eventId = id;
    this.loadData();
  },

  async loadData() {
    this.setData({ loading: true });

    // Plan B：直接用本地数据
    const data = await app.loadEvents();
    if (!data) {
      wx.showToast({ title: '加载失败', icon: 'none' });
      this.setData({ loading: false });
      return;
    }

    const event = data.events.find((e) => e.id === this._eventId);
    if (!event) {
      wx.showToast({ title: '活动不存在', icon: 'none' });
      this.setData({ loading: false });
      return;
    }

    event._weatherEmoji = event.weather ? weatherEmoji(event.weather) : '';
    const team = data.team;

    wx.setNavigationBarTitle({ title: event.title || event.meet.name });

    // 构建 markers + 视野中心
    const markers = [];
    let hasMap = false;
    let latSum = 0,
      lngSum = 0,
      count = 0;
    const meet = event.meet;
    const sbux = event.starbucks && event.starbucks.lng ? event.starbucks : null;
    if (meet && meet.lng && meet.lat) {
      markers.push({
        id: 1,
        latitude: Number(meet.lat),
        longitude: Number(meet.lng),
        iconPath: '/assets/icons/meet-pin.png',
        width: 48,
        height: 48,
        callout: {
          content: meet.name,
          color: '#fff',
          bgColor: '#C74634',
          padding: 8,
          borderRadius: 8,
          fontSize: 12,
          display: 'ALWAYS',
        },
      });
      latSum += Number(meet.lat);
      lngSum += Number(meet.lng);
      count++;
      hasMap = true;
    }
    if (sbux && sbux.lng && sbux.lat) {
      markers.push({
        id: 2,
        latitude: Number(sbux.lat),
        longitude: Number(sbux.lng),
        iconPath: '/assets/icons/sbux-pin.png',
        width: 48,
        height: 48,
        callout: {
          content: sbux.name,
          color: '#fff',
          bgColor: '#006241',
          padding: 8,
          borderRadius: 8,
          fontSize: 12,
          display: 'ALWAYS',
        },
      });
      latSum += Number(sbux.lat);
      lngSum += Number(sbux.lng);
      count++;
    }

    const center = count > 0
      ? { lat: latSum / count, lng: lngSum / count }
      : { lat: 31.18, lng: 121.47 };
    const scale = count === 1 ? 16 : 14;

    this.setData({ event, team, center, markers, scale, hasMap, loading: false });
  },

  // 集合点导航
  onNavMeet() {
    openInMap(this.data.event.meet);
  },

  // 星巴克导航
  onNavSbux() {
    openInMap(this.data.event.starbucks);
  },

  onMarkerTap(e) {
    const id = e.detail.markerId;
    const m = this.data.markers.find((x) => x.id === id);
    if (!m) return;
    const event = this.data.event;
    if (id === 1) {
      openInMap(event.meet);
    } else if (id === 2) {
      openInMap(event.starbucks);
    }
  },

  // 群分享
  onShareAppMessage() {
    const e = this.data.event;
    if (!e) return {};
    return {
      title: `${e.title || e.meet.name} · ${e._date.weekday} ${e.time || '07:00'}`,
      path: `/pages/event/event?id=${e.id}`,
    };
  },

  // 手动点击"分享"按钮
  onShareTap() {
    wx.showActionSheet({
      itemList: ['分享到微信', '复制链接'],
      success: (res) => {
        if (res.tapIndex === 0) {
          // 微信内显示"右上角分享"提示
          wx.showToast({
            title: '点击右上角 · · · 分享',
            icon: 'none',
            duration: 2000,
          });
        } else if (res.tapIndex === 1) {
          // 复制路径
          const e = this.data.event;
          const path = `/pages/event/event?id=${e.id}`;
          wx.setClipboardData({ data: path });
        }
      },
    });
  },
});