function drinkLine(drink) {
  const labels = (drink.options || []).map((o) => o.label).filter(Boolean);
  return [drink.name].concat(labels).join(' · ');
}

Page({
  data: { loading: true, error: '', runners: [] },
  onLoad() { this.load(); },
  onPullDownRefresh() {
    this.load().then(() => wx.stopPullDownRefresh());
  },
  async load() {
    this.setData({ loading: true, error: '' });
    try {
      const res = await wx.cloud.callFunction({ name: 'listRunners' });
      const body = res.result || {};
      if (body.code !== 0) {
        this.setData({ loading: false, error: body.msg || '名单暂时读不出来，请稍后重试', runners: [] });
        return;
      }
      const runners = (body.data.runners || []).map((r) => ({
        ...r,
        drinkLines: (r.drinks || []).map(drinkLine),
        foodLines: (r.foods || []).map((f) => f.name),
      }));
      this.setData({ loading: false, runners });
    } catch (e) {
      this.setData({ loading: false, error: '名单暂时读不出来，请稍后重试', runners: [] });
    }
  },
});
