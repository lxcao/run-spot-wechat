// pages/event-create/event-create.js
// 群主配置页：添加 / 删除跑步计划

Page({
  data: {
    form: {
      date: '',
      time: '07:00',
      meetName: '',
      meetAddress: '',
      meetLng: null,
      meetLat: null,
      sbuxName: '',
      sbuxAddress: '',
      sbuxLng: null,
      sbuxLat: null,
      route: '',
      note: '',
    },
    meetSuggestions: [],
    sbuxSuggestions: [],
    events: [],         // 现有活动列表
    submitting: false,
    showAddForm: true,   // 默认展开添加表单
    // 权限相关
    isAdmin: false,
    myOpenid: '',
    checkedAdmin: false,  // 是否已完成权限检查
  },

  async onLoad() {
    wx.setNavigationBarTitle({ title: '配置活动' });
    // 🔐 先做权限检查（通过后才 loadEvents）
    await this.checkPermission();
  },

  // 权限检查
  async checkPermission() {
    try {
      const res = await wx.cloud.callFunction({ name: 'checkAdmin' });
      this.setData({
        isAdmin: res.result?.data?.isAdmin === true,
        myOpenid: res.result?.data?.openid || '',
        checkedAdmin: true,
      });
      if (this.data.isAdmin) {
        // ✅ 是 admin，加载活动列表
        this.loadEvents();
      }
    } catch (err) {
      console.error('权限检查失败', err);
      this.setData({ checkedAdmin: true });
    }
  },

  // 复制 openid
  copyOpenid() {
    if (!this.data.myOpenid) return;
    wx.setClipboardData({
      data: this.data.myOpenid,
      success: () => {
        wx.showToast({ title: '已复制！发给群主', icon: 'success' });
      },
    });
  },

  // 未授权 → 返回主页
  onBackHome() {
    wx.navigateBack({ delta: 1, fail: () => wx.switchTab({ url: '/pages/home/home' }) });
  },

  // 加载现有活动
  async loadEvents() {
    try {
      const app = getApp();
      const data = await app.loadEvents(true);
      if (data && data.events) {
        // 按日期倒序
        const sorted = [...data.events].sort((a, b) => b.date.localeCompare(a.date));
        this.setData({ events: sorted });
      }
    } catch (err) {
      console.error('loadEvents 失败', err);
    }
  },

  // ============== 表单输入 ==============

  onDateChange(e) {
    this.setData({ 'form.date': e.detail.value });
  },

  onTimeChange(e) {
    this.setData({ 'form.time': e.detail.value });
  },

  onMeetNameInput(e) {
    const keyword = e.detail.value;
    this.setData({ 'form.meetName': keyword, 'form.meetAddress': '' });
    this.searchSuggestions(keyword, 'meet');
  },

  onMeetAddressInput(e) {
    this.setData({ 'form.meetAddress': e.detail.value });
  },

  onSbuxNameInput(e) {
    const keyword = e.detail.value;
    this.setData({ 'form.sbuxName': keyword, 'form.sbuxAddress': '' });
    this.searchSuggestions(keyword, 'sbux');
  },

  onRouteInput(e) {
    this.setData({ 'form.route': e.detail.value });
  },

  onNoteInput(e) {
    this.setData({ 'form.note': e.detail.value });
  },

  // 切换"添加"折叠
  toggleAddForm() {
    this.setData({ showAddForm: !this.data.showAddForm });
  },

  // ============== 地址联想 ==============

  async searchSuggestions(keyword, type) {
    if (!keyword || keyword.length < 1) {
      this.setData({
        [type === 'meet' ? 'meetSuggestions' : 'sbuxSuggestions']: [],
      });
      return;
    }
    try {
      console.log(`搜索 ${type}: "${keyword}"`);
      const res = await wx.cloud.callFunction({
        name: 'getAddressSuggestions',
        data: { keyword },
      });
      console.log(`${type} 联想结果:`, res);
      if (res.result && res.result.code === 0) {
        const suggestions = (res.result.data || []).map((s) => ({
          ...s,
          display: `${s.name} · ${s.address}`,
        }));
        this.setData({
          [type === 'meet' ? 'meetSuggestions' : 'sbuxSuggestions']: suggestions,
        });
      } else {
        this.setData({
          [type === 'meet' ? 'meetSuggestions' : 'sbuxSuggestions']: [],
        });
      }
    } catch (err) {
      console.error('地址联想失败', err);
      this.setData({
        [type === 'meet' ? 'meetSuggestions' : 'sbuxSuggestions']: [],
      });
    }
  },

  onPickMeet(e) {
    const { name, address, location } = e.currentTarget.dataset;
    // location 格式 "lng,lat"（来自 inputtips）
    let lng = null, lat = null;
    if (location && location.includes(',')) {
      const [l, la] = location.split(',');
      lng = parseFloat(l);
      lat = parseFloat(la);
    }
    this.setData({
      'form.meetName': name,
      'form.meetAddress': address,
      'form.meetLng': lng,
      'form.meetLat': lat,
      meetSuggestions: [],
    });
  },

  onPickSbux(e) {
    const { name, address, location } = e.currentTarget.dataset;
    let lng = null, lat = null;
    if (location && location.includes(',')) {
      const [l, la] = location.split(',');
      lng = parseFloat(l);
      lat = parseFloat(la);
    }
    this.setData({
      'form.sbuxName': name,
      'form.sbuxAddress': address,
      'form.sbuxLng': lng,
      'form.sbuxLat': lat,
      sbuxSuggestions: [],
    });
  },

  // 失焦关闭联想
  onMeetBlur() {
    setTimeout(() => this.setData({ meetSuggestions: [] }), 200);
  },

  onSbuxBlur() {
    setTimeout(() => this.setData({ sbuxSuggestions: [] }), 200);
  },

  // ============== 提交 ==============

  async onSubmit() {
    const { form } = this.data;

    if (!form.date) return wx.showToast({ title: '请选择日期', icon: 'none' });
    if (!form.time) return wx.showToast({ title: '请选择时间', icon: 'none' });
    if (!form.meetName) return wx.showToast({ title: '请填写集合点', icon: 'none' });

    const todayISO = new Date().toISOString().slice(0, 10);
    if (form.date < todayISO) {
      return wx.showToast({ title: '日期不能是过去', icon: 'none' });
    }

    this.setData({ submitting: true });
    wx.showLoading({ title: '创建中...' });

    try {
      const res = await wx.cloud.callFunction({
        name: 'createEvent',
        data: {
          date: form.date,
          time: form.time,
          meet: {
            name: form.meetName,
            address: form.meetAddress,
            lng: form.meetLng,
            lat: form.meetLat,
          },
          starbucks: form.sbuxName
            ? {
                name: form.sbuxName,
                address: form.sbuxAddress,
                lng: form.sbuxLng,
                lat: form.sbuxLat,
              }
            : null,
          route: form.route,
          note: form.note,
        },
      });

      wx.hideLoading();

      if (res.result && res.result.code === 0) {
        wx.showToast({ title: '创建成功！', icon: 'success' });
        // 清空表单 + 刷新列表
        this.setData({
          form: {
            date: '',
            time: '07:00',
            meetName: '',
            meetAddress: '',
            sbuxName: '',
            sbuxAddress: '',
            route: '',
            note: '',
          },
        });
        await this.loadEvents();
        setTimeout(() => {
          wx.navigateBack();
        }, 800);
      } else {
        wx.showToast({ title: res.result?.msg || '创建失败', icon: 'none' });
        this.setData({ submitting: false });
      }
    } catch (err) {
      wx.hideLoading();
      console.error('创建失败', err);
      wx.showToast({ title: err.message || '网络错误', icon: 'none' });
      this.setData({ submitting: false });
    }
  },

  // ============== 删除活动 ==============

  async onDeleteEvent(e) {
    const { id, name, count } = e.currentTarget.dataset;
    const photoCount = Number(count) || 0;
    const confirmMsg = photoCount > 0
      ? `确定删除"${name}"？\n将同时删除 ${photoCount} 张照片。`
      : `确定删除"${name}"？`;
    const confirmed = await new Promise((resolve) => {
      wx.showModal({
        title: '删除活动',
        content: confirmMsg,
        confirmText: '删除',
        confirmColor: '#c74634',
        success: (res) => resolve(res.confirm),
        fail: () => resolve(false),
      });
    });
    if (!confirmed) return;

    wx.showLoading({ title: '删除中...' });
    try {
      const res = await wx.cloud.callFunction({
        name: 'deleteEvent',
        data: { id },
      });
      wx.hideLoading();
      if (res.result && res.result.code === 0) {
        const { removed, deletedFiles } = res.result.data;
        wx.showToast({
          title: `已删除（清理 ${deletedFiles} 张照片）`,
          icon: 'success',
        });
        await this.loadEvents();
      } else {
        wx.showToast({ title: res.result?.msg || '删除失败', icon: 'none' });
      }
    } catch (err) {
      wx.hideLoading();
      console.error('删除失败', err);
      wx.showToast({ title: err.message || '删除失败', icon: 'none' });
    }
  },
});
