// app.js (v2 · 云函数版)
App({
  globalData: {
    team: null,
    events: null,
    loaded: false,
  },

  onLaunch() {
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力');
    } else {
      wx.cloud.init({
        env: 'run-spot-prod-d1gb2jd1j3ce2e7fb',
        traceUser: true,
      });
    }
    this.loadEvents();
  },

  async loadEvents(forceRefresh = false) {
    if (this.globalData.loaded && !forceRefresh) return this.globalData;
    try {
      const res = await wx.cloud.callFunction({ name: 'getEvents' });
      if (res.result && res.result.code === 0) {
        const { team, events } = res.result.data;
        const todayISO = () => {
          const d = new Date();
          d.setHours(0, 0, 0, 0);
          return d.toISOString().slice(0, 10);
        };
        const today = todayISO();
        events.forEach((e) => {
          e._date = formatDate(e.date);
          e._isToday = e.date === today;
          if (e.status === 'upcoming' || e.status === 'past') {
            e._status = e.status;
          } else {
            e._status = e.date >= today ? 'upcoming' : 'past';
          }
        });
        this.globalData.team = team;
        this.globalData.events = events;
        this.globalData.loaded = true;
        return this.globalData;
      } else {
        console.error('getEvents 返回错误', res.result);
        return null;
      }
    } catch (err) {
      console.error('加载事件数据失败', err);
      return null;
    }
  },
});

function formatDate(iso) {
  if (!iso) return { y: 0, m: 0, day: 0, weekday: '' };
  const d = new Date(iso + 'T00:00:00');
  return {
    y: d.getFullYear(),
    m: d.getMonth() + 1,
    day: d.getDate(),
    weekday: ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][d.getDay()],
  };
}