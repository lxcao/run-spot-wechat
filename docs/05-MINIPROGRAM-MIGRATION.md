# H5 → 微信小程序 迁移指南

> 把跑团应用从 H5（CloudBase 测试域名）迁移到微信小程序。
> 不需要域名、不不需要备案、国内 100% 可访问、微信 100% 不风控。

---

## 为什么迁移到小程序？

### H5 的遗留痛点（已解决，但仍有局限）

- ✅ 国内 CDN + 国内 IP，访问速度没问题
- ⚠️ CloudBase 测试域名弹确认页（虽 30 天有效）
- ⚠️ 跑友第一次点确认体验差
- ❌ **不能做**跑友报名（要后端 + 登录态）
- ❌ **不能做**打卡（要 GPS + 后端）
- ❌ **不能做**拍照留念（要存储 + 上传）

### 小程序的优势

- ✅ 无域名、无备案（用户点开即用）
- ✅ 微信内"原生"体验（滑屏转场、系统导航）
- ✅ 微信登录 / 一键获取用户信息
- ✅ wx.openLocation 唤起系统地图
- ✅ **云开发**：跑友报名 / 打卡 / 拍照直接上云
- ✅ 微信群分享卡片（带缩略图）
- ✅ 微信"扫一扫"二维码直接打开

---

## H5 → 小程序 改动清单

| H5（保留） | → | 小程序（新增） |
|---|---|---|
| `index.html` | → | `pages/home/home.{js,wxml,wxss,json}` + `pages/event/event.{js,wxml,wxss,json}` |
| `assets/css/style.css` | → | `app.wxss` + 每个 page 的 `*.wxss` |
| `assets/js/app.js` | → | `app.js` + 每个 page 的 `*.js` |
| Leaflet 渲染 | → | `<map>` 原生组件 |
| `uri.amap.com` 导航 | → | `wx.openLocation` |
| `fetch('./data/events.json')` | → | `require('./data/events.json')`（v1 本地） |
| URL hash 路由 | → | `wx.navigateTo` / `wx.switchTab` |

**可复用**：

- `data/events.json`（数据结构 100% 一致）
- 甲骨文红 `#C74634` 主题色
- 全部业务逻辑（状态判断、日期格式化、卡片渲染）

---

## 项目结构

```
run-spot-wechat/
├── (H5 文件，保留作对照)
│   ├── index.html
│   ├── assets/
│   ├── data/events.json      ← 共享
│   └── ...
│
├── miniprogram/              ← 新增
│   ├── app.js                # 小程序入口
│   ├── app.json              # 全局配置
│   ├── app.wxss              # 全局样式
│   ├── project.config.json   # 项目配置（AppID）
│   ├── sitemap.json          # SEO 配置
│   ├── pages/
│   │   ├── home/             # 主页
│   │   │   ├── home.js
│   │   │   ├── home.wxml
│   │   │   ├── home.wxss
│   │   │   └── home.json
│   │   └── event/            # 详情
│   │       ├── event.js
│   │       ├── event.wxml
│   │       ├── event.wxss
│   │       └── event.json
│   ├── data/
│   │   └── events.json       ← 软链接到 ../data/events.json
│   ├── utils/
│   │   ├── date.js
│   │   └── nav.js
│   ├── assets/
│   │   └── icons/            # 自定义 pin图标
│   └── cloudfunctions/        # v2 预留
│
└── docs/
    └── 06-MINIPROGRAM-MIGRATION.md   # 本文档
```

---

## 关键 API 翻译表

### 1. 数据加载

```js
// H5
const res = await fetch('./data/events.json');
const data = await res.json();

// 小程序（v1 本地）
const data = require('./data/events.json');

// 小程序（v2 云开发）
wx.cloud.callFunction({ name: 'getEvents' })
  .then(res => { /* data */ });
```

### 2. 地图渲染

```xml
<!-- H5 -->
<div id="map" style="height: 360px"></div>
<script>
  L.map('map').setView([lat, lng], 16);
  L.marker([lat, lng], { icon: pinIcon(...) }).addTo(map);
</script>
```

```xml
<!-- 小程序 -->
<map
  id="map"
  latitude="{{centerLat}}"
  longitude="{{centerLng}}"
  markers="{{markers}}"
  scale="16"
  bindmarkertap="onMarkerTap"
  bindcallouttap="onCalloutTap"
  style="height: 360px"
/>
```

```js
// 小程序
Page({
  data: {
    centerLat: 31.180804,
    centerLng: 121.463635,
    markers: [
      {
        id: 1,
        latitude: 31.180804,
        longitude: 121.463635,
        iconPath: '/assets/icons/meet-pin.png',  // 必须本地图片
        width: 36,
        height: 36,
        callout: {
          content: '星巴克（徐汇滨江店）',
          color: '#fff',
          bgColor: '#C74634',
          padding: 6,
          display: 'ALWAYS'  // 始终显示气泡
      },
      {
        id: 2,
        latitude: 31.180804,
        longitude: 121.463635,
        iconPath: '/assets/icons/sbux-pin.png',
        width: 36,
        height: 36,
        callout: {
          content: '星巴克',
          color: '#fff',
          bgColor: '#006241',
          padding: 6,
          display: 'ALWAYS'
        }
      }
    ]
  }
})
```

### 3. 导航唤起

```js
// H5
window.open(`https://uri.amap.com/navigation?to=${lng},${lat}&mode=walk&src=OracleRun`);

// 小程序（推荐）
wx.openLocation({
  latitude: 31.180804,
  longitude: 121.463635,
  name: '星巴克（徐汇滨江店）',
  address: '上海市徐汇区龙腾大道 3222 号',
  scale: 18
});
// 用户在小程序地图上点"导航"按钮 → 跳到系统地图（高德/百度/腾讯 任选）
```

### 4. 路由

```js
// H5
location.hash = `#/event/${id}`;

// 小程序
wx.navigateTo({ url: `/pages/event/event?id=${id}` });
```

### 5. 微信群分享

```js
// 小程序 onShareAppMessage
onShareAppMessage() {
  const event = this.data.event;
  return {
    title: `${event.title} · 周六 07:00`,
    path: `/pages/event/event?id=${event.id}`,
    imageUrl: 'https://your-domain/share-card.png'  // 可选
  };
}
```

---

## 实施步骤（约 1 周）

| 阶段 | 内容 | 时间 |
|---|---|---|
| 1 | 注册个人 AppID | 5 分钟 |
| 2 | 下载微信开发者工具 | 10 分钟 |
| 3 | 创建项目骨架 + 写所有代码 | 半天 |
| 4 | 本地预览调样式 | 半天 |
| 5 | 申请类目 + 提交审核 | 1~7 天 |
| 6 | 通过 → 发布到群里 | 5 分钟 |

---

## 类目建议

个人主体跑团，可选类目：

| 类目 | 审核难度 | 适合 |
|---|---|---|
| **工具 - 效率** | ⭐⭐ | 群活动通知类（你选这个） |
| 体育 - 运动健身 | ⭐⭐⭐ | 需要提供运动相关资质 |
| 社交 - 社区/论坛 | ❌ 不推荐 | 个人主体很难通过 |

**建议选「工具 - 效率」**，跑团活动通知本质是工具型应用。

---

## 个人主体限制（重要！）

个人主体小程序**不能做**：

- ❌ 涉及社交（朋友圈、好友关系）
- ❌ 涉及交易（支付、虚拟商品）
- ❌ 涉及新闻、时政
- ❌ 涉及医疗、金融、法律等专业领域

个人主体小程序**可以做**：

- ✅ 活动通知（你选这个）
- ✅ 信息展示（地图、列表、详情）
- ✅ 本地工具（计算器、记账）
- ✅ 微信登录 + 用户信息（不涉及好友关系）
- ✅ 微信支付（部分类目允许）

---

## v1 范围（本次迁移）

### ✅ v1 = 把现有功能 100% 复刻

- ✅ 主页（本周活动 + 历史时间线）
- ✅ 详情页（信息卡 + 地图 + 双 pin + 导航）
- ✅ 群分享（onShareAppMessage）
- ✅ 甲骨文红主题色

### ❌ v2 再加（不在本次范围）

- ❌ 跑友报名（云函数 + 数据库）
- ❌ 打卡 / GPS 轨迹
- ❌ 照片墙（云存储）
- ❌ 用户主页 / 排行榜
- ❌ 推送提醒（订阅消息）

---

## 风险与应对

| 风险 | 应对 |
|---|---|
| 个人主体类目审核被拒 | 准备详细说明 + 跑团活动照片，准备改类目 |
| 地图坐标偏移 | 小程序用 GCJ-02，高德坐标直接兼容 |
| 包大小超 2MB | 资源全部走 CDN，不打包图片 |
| 微信群分享卡片不显示缩略图 | v1 暂不优化，v2 加 Open Graph |
| 上传代码审核慢（7 天） | 提前准备好所有截图和说明 |

---

## 🎯 我的建议时间线

```
今天：注册 AppID（5 分钟）+ 我写代码
明天：在微信开发者工具里跑通
后天：调样式 + 测试
1 周内：提交审核
10~14 天：审核通过 → 发布到群里
```

---

## 你需要做（用户侧）

1. 注册个人 AppID：https://mp.weixin.qq.com/ → 立即注册 → 小程序
   - 邮箱（未注册过微信公众平台的）
   - 身份证 + 微信扫码
   - 5 分钟拿到 AppID

2. 下载微信开发者工具：https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html
   - macOS / Windows 都有

3. 拿到 AppID 后告诉我，我帮你填到 `project.config.json`

---

## 我会做（开发侧）

1. ✅ 写完整的项目骨架（miniprogram/）
2. ✅ 主页 + 详情页完整代码
3. ✅ 工具函数（日期、导航）
4. ✅ 全局样式（甲骨文红主题）
5. ✅ project.config.json（你只需替换 AppID）
6. ✅ 一份 README（开发者工具里的运行步骤）