// pages/home/home.js
const app = getApp();
const { weatherEmoji } = require('../../utils/date.js');
const { getWeekendWeather } = require('../../utils/weather.js');

Page({
  data: {
    team: null,
    hero: null,
    upcomingList: [],
    historyList: [],
    weekendWeather: { sat: null, sun: null, available: false },
    loading: true,
  },

  onLoad() {
    this.loadData();
  },

  onShow() {
    // 从详情页返回时刷新（如果数据有更新）
    if (app.globalData.loaded) {
      this.renderData(app.globalData.team, app.globalData.events);
    }
  },

  onPullDownRefresh() {
    Promise.all([this.loadData(), this.loadWeather()]).then(() =>
      wx.stopPullDownRefresh()
    );
  },

  async loadData() {
    this.setData({ loading: true });
    const data = await app.loadEvents();
    if (!data) {
      wx.showToast({ title: '加载失败', icon: 'none' });
      this.setData({ loading: false });
      return;
    }
    this.renderData(data.team, data.events);
    // 加载活动数据后顺手拉天气（不阻塞）
    this.loadWeather();
  },

  async loadWeather() {
    const weekend = await getWeekendWeather();
    this.setData({ weekendWeather: weekend });
  },

  renderData(team, events) {
    // 🆕 用 Date 对象比较，不用 localeCompare（字符串比较跨月会出错）
    const upcoming = events
      .filter((e) => e._status === 'upcoming')
      .sort((a, b) => new Date(a.date) - new Date(b.date));
    const past = events
      .filter((e) => e._status === 'past')
      .sort((a, b) => new Date(b.date) - new Date(a.date));

    // 给历史活动添加 weather emoji 字段
    past.forEach((e) => (e._weatherEmoji = e.weather ? weatherEmoji(e.weather) : ''));

    this.setData({
      team,
      hero: upcoming[0] || null,
      upcomingList: upcoming.slice(1),
      historyList: past,
      loading: false,
    });
    wx.setNavigationBarTitle({ title: team.name });
  },

  onEventTap(e) {
    const id = e.currentTarget.dataset.id;
    if (!id) return;
    wx.navigateTo({ url: `/pages/event/event?id=${id}` });
  },

  onTasteTap() {
    wx.navigateTo({ url: '/pages/runners/runners' });
  },

  // 跳到配置页
  onConfigTap() {
    wx.navigateTo({ url: '/pages/event-create/event-create' });
  },

  // 群分享
  onShareAppMessage() {
    const { team, hero } = this.data;
    return {
      title: hero
        ? `${hero.title || hero.meet.name} · ${hero._date.weekday} ${hero._date.m}/${hero._date.day}`
        : (team ? team.slogan : '甲骨文魔都跑团'),
      path: '/pages/home/home',
    };
  },

  onShareTimeline() {
    const { team } = this.data;
    return {
      title: team ? `${team.name} · ${team.slogan}` : '甲骨文魔都跑团',
    };
  },
});