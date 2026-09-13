# v3 照片功能文档

> 跑友用手机拍跑步活动照片 → 上传云存储 → 详情页照片墙显示

## 🎯 功能描述

| 步骤 | 行为 |
|---|---|
| 1 | 跑友打开活动详情页 |
| 2 | 滚到 [📷 活动照片] section |
| 3 | 点 [+ 上传照片] → 进入相册选图（最多 9 张）|
| 4 | 自动压缩到 500KB / 上传到云存储 / 写入数据库 |
| 5 | 照片墙立刻显示新缩略图 |
| 6 | 点缩略图 → 全屏预览（带返回箭头 + 左右滑动）|

## 🏗️ 架构

### 数据流

```
跑友相册
  ↓ wx.chooseMedia (最多 9 张)
  ↓
原始图片
  ↓ wx.compressImage (压缩到 500KB 以下)
  ↓
临时文件路径
  ↓ wx.cloud.uploadFile
  ↓
云存储 cloud://run-spot-prod-xxx/events/2026-09-12/2026-09-13_abc123_1.jpg
  ↓
返回 fileID
  ↓ wx.cloud.getTempFileURL
  ↓
https URL (可被 <image> 直接显示)
  ↓
云函数 updateEventPhotos
  ├─ 校验（每场 ≤ 100 张 / 每人 ≤ 9 张）
  ├─ 写入 events.photos 数组
  └─ 返回新照片对象
  ↓
前端 setData
  ├─ 新照片合并到 event.photos
  └─ 照片墙立刻更新 ✅
```

### 涉及的文件

| 文件 | 改动 |
|---|---|
| `miniprogram/utils/upload.js` | 🆕 新增：选图 + 压缩 + 上传 + tempURL 转换 |
| `miniprogram/cloudfunctions/updateEventPhotos/index.js` | 🆕 新增：写数据库（限流）|
| `miniprogram/pages/photo-view/photo-view.{js,wxml,wxss,json}` | 🆕 新增：全屏预览页 |
| `miniprogram/pages/event/event.js` | ➕ 加 `onUploadPhoto` / `onPhotoTap` |
| `miniprogram/pages/event/event.wxml` | ➕ 加照片墙 section |
| `miniprogram/pages/event/event.wxss` | ➕ 加照片墙样式 |
| `miniprogram/app.json` | ➕ 注册 `photo-view` 页面 |
| `miniprogram/app.js` | ➕ `loadEvents(forceRefresh)` 支持强制刷新 |

## 📊 数据库结构

### events 集合加 photos 字段

```js
{
  id: "2026-09-12",
  title: "徐汇滨江晨跑",
  // ... 其他字段

  photos: [
    {
      fileID: "cloud://run-spot-prod-xxx/events/2026-09-12/2026-09-13_abc123_1.jpg",
      uploader: "oXxXxXxXxXxX",  // 跑友 openid
      uploaderName: "匿名跑友",   // 跑友昵称
      uploadedAt: "2026-09-13T03:19:04.893Z",
      size: 0  // 上传时 size 参数，v3 当前没传
    },
    // ... 更多照片
  ]
}
```

## 📦 云存储结构

```
cloud://run-spot-prod-xxx/
└── events/                       ← 主目录
    ├── 2026-09-12/              ← 活动 ID（每个活动一个子目录）
    │   ├── 2026-09-13_abc_1.jpg
    │   ├── 2026-09-13_abc_2.jpg
    │   └── ...
    ├── 2026-09-19/
    │   └── ...
    └── 2025-09-05/
        └── ...
```

## ⚠️ 关键技术点

### 1. fileID 不能直接被 `<image>` 显示

**问题**：`cloud://xxx/...jpg` 是云存储协议，`<image>` 标签无法直接渲染。

**解决**：用 `wx.cloud.getTempFileURL` 转成 `https://...` 临时 URL。

```js
wx.cloud.getTempFileURL({
  fileList: ['cloud://xxx/...jpg'],
}).then(res => {
  const tempURL = res.fileList[0].tempFileURL;
  // tempURL 是 https:// 开头，可以直接给 <image>
});
```

### 2. 上传后立刻显示（不刷新整页）

**问题**：调 `getEvents` 云函数重新拉数据，setData 后 wxml 没更新（对象结构没变）。

**解决**：上传后 `chooseAndUpload` 直接返回带 `tempURL` 的新照片，event.js 用 `setData({ 'event.photos': [...existing, ...newPhotos] })` 合并。

### 3. 限流

| 限制 | 数值 | 原因 |
|---|---|---|
| 每场活动最多照片 | 100 张 | 防止单个活动占满存储 |
| 每人每场最多照片 | 9 张 | 防止单个跑友刷屏 |

## 🆓 免费配额

| 项 | 限制 | 跑团够用吗 |
|---|---|---|
| 存储 | 5GB | ✅ 约 10000 张照片（500KB/张）|
| CDN 流量 | 5GB / 月 | ✅ 100 跑友每月看 50 张 = 1GB |
| 写请求 | 2000 次/日 | ✅ 100 跑友 × 30 天 = 3000 → 偶尔超 |
| 读请求 | 5 万次/日 | ✅ 100 跑友 × 500 次 = 5 万 |

## 🚨 注意事项

1. **个人版云存储没有内容审核** —— 跑友可能上传不合适的图
 - 解决方案：跑团小圈子 + 群主可手动删（云开发控制台 → 存储）
2. **size 字段未传** —— `updateEventPhotos` 当前 size=0（不影响功能）
3. **fileID 临时 URL 有效期 2 小时** —— 每次进入详情页都会重新转换

## 🐛 故障排查

| 问题 | 解决 |
|---|---|
| 上传后照片墙不显示 | 检查云函数 `updateEventPhotos` 是否部署；检查 events 集合 photos 字段 |
| 照片显示空白 | 检查 `<image src="{{item.tempURL}}">` 是否有值；console.log 调试 |
| 云存储看不到文件 | 检查上传时 cloudPath 是否正确 |
| 上传失败 "图片太大" | 调大 `TARGET_SIZE_KB` 或加手动压缩逻辑 |
| 跑友上传太多 | 后端限流（每人 9 张）会 reject 给出提示 |