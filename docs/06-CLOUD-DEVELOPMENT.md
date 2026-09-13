# v2 · 微信小程序云开发部署指南

> 解决"每周活动都要重新发版"的痛点。
> 数据从代码包迁移到云数据库，**改数据不需要审核、不需要用户更新**。

---

## 什么是云开发

微信官方提供的 serverless 服务：
- **云函数**：运行在微信云端的 JS 代码（替代自建后端）
- **云数据库**：NoSQL 数据库（JSON 文档，免费层 1GB）
- **云存储**：对象存储（文件/图片，免费层 5GB）
- **云调用**：调用微信开放接口（鉴权免 access_token）

**免费层**：
- 云函数：每月 4 万次调用
- 云数据库：2GB 存储
- 云存储：5GB 存储 + 5GB CDN 流量

跑团 100 人 × 每周 7 次活动通知 = 2800 次/月，**完全免费**。

---

## 数据架构

### 数据库集合：events

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `_id` | string | 自动生成 | 数据库主键 |
| `id` | string | ✅ | 业务唯一 ID（用日期 `2026-09-19`） |
| `title` | string | 🟡 | 活动标题 |
| `date` | string | ✅ | ISO 日期 `YYYY-MM-DD` |
| `weekday` | string | 🟡 | 周几（"周六"） |
| `time` | string | ✅ | 集合时间 `HH:MM` |
| `status` | string | 🟡 | `upcoming` 或 `past` |
| `meet.name` | string | ✅ | 集合点名 |
| `meet.address` | string | 🟡 | 详细地址 |
| `meet.lng` | number | 🟡 | 经度 |
| `meet.lat` | number | 🟡 | 纬度 |
| `starbucks.*` | object | 🟡 | 旁边星巴克（同 meet） |
| `route` | string | 🟡 | 路线描述 |
| `note` | string | 🟡 | 备注 |
| `attendees` | number | 🟡 | 历史活动到场人数 |
| `weather` | string | 🟡 | 历史活动天气 |

### 数据库集合：attendances（v3 用）

跑友报名记录（v3 功能，本版本不实现）。

---

## 部署步骤

### 1. 开通云开发

微信开发者工具 → 顶部 **"云开发"** 按钮 → 创建环境 → 拿 **环境 ID**

### 2. 配置 project.config.json

```json
{
  "cloudfunctionRoot": "cloudfunctions/",
  "setting": {
    "es6": true
  }
}
```

并在代码里 init：

```js
// app.js
wx.cloud.init({
  env: 'cloudbase-1gxxxxxx',  // 你的环境 ID
  traceUser: true,
});
```

### 3. 部署云函数

右键 `cloudfunctions/getEvents` → **"上传并部署：云端安装依赖"**

### 4. 修改数据库权限

云开发控制台 → 数据库 → events → 权限设置 → **"所有用户可读，仅创建者可写"**

### 5. 迁移初始数据

把现有的 5 条活动从 `data/events.json` 导入数据库：

- 方式 A：手动添加（5 条数据，工作量大）
- 方式 B：跑迁移脚本（一次性）

---

## 群主以后怎么改活动

### 方式 A：云开发控制台（最简单 ✅）

打开 https://console.cloud.tencent.com/tcb → 数据库 → events 集合 → **"+" 添加记录**

填写字段：
```json
{
  "id": "2026-09-26",
  "title": "世纪公园晨跑",
  "date": "2026-09-26",
  "weekday": "周六",
  "time": "07:00",
  "status": "upcoming",
  "meet":": {
    "name": "世纪公园 7号门",
    "address": "上海市浦东新区锦绣路 1001 号",
    "lng": 121.54927,
    "lat": 31.21088
  },
  "starbucks":": {
    "name": "星巴克 世纪公园",
    "lng": 121.56149,
    "lat": 31.21150
  },
  "route": "绕世纪公园 3 圈",
  "attendees": null,
  "weather": null
}
```

**保存** → 30 秒后小程序看到 ✅

### 方式 B：v3 在线表单页（计划中）

做个简单的 Web 页面让群主用浏览器填表单。

---

## API 设计

### 云函数 `getEvents`

```js
// 入参：无
// 返回：{ code: 0, data: [...events] }
```

### 云函数 `getEvent`

```js
// 入参：{ id: '2026-09-19' }
// 返回：{ code: 0, data: {...event} } 或 { code: -1, msg: 'not found' }
```

---

## v2 完整收益

| 维度 | v1 | v2 |
|---|---|---|
| 改活动数据 | 改 events.js → 重发版（1~7 天审核） | 改云数据库 → 30 秒生效 |
| 群主使用门槛 | 需要 git + 开发者工具 | 浏览器访问云开发控制台 |
| 用户更新 | 必须更新小程序 | 无需任何操作 |
| 跑友体验 | 可能 1~7 天看不到 | 永远是最新的 |
| 扩展能力 | 受限 | ✅ 报名 / 打卡 / 拍照 / 推送 |