# v2 云开发部署指南（NoSQL 集合版 · 个人版云开发）

> 个人版云开发**只支持 NoSQL 集合**，不支持 PostgreSQL。
> 本文档配套 NoSQL 版本。

---

## 环境 ID

```
run-spot-prod-d1gb2jd1j3ce2e7fb
```

---

## 📋 部署步骤

### Step 1：上传云函数（最重要！）

在**微信开发者工具**里：

1. **右键 `cloudfunctions/getEvents`** → **"上传并部署：云端安装依赖"**
2. 等 30~60 秒 → 看到云开发控制台 → 云函数列表显示 `getEvents` 状态为 "部署成功"3. **右键 `cloudfunctions/getEvent`** → 同样上传 → 看到状态 "部署成功"

### Step 2：创建 NoSQL 集合

云开发控制台 → `run-spot-prod` 环境 → **数据库** →

⚠️ **注意是"数据库"菜单，不是"SQL 型数据库"**

1. 点 **"+"** 创建集合
2. 集合名：`events`
3. 权限：**"所有用户可读，仅创建者可写"**
4. 确定

### Step 3：导入 5 条历史数据

进入 `events` 集合 → **"导入"** 按钮 →

- 选择文件：`data/cloud-import.json`（项目根目录）
- 导入模式：**"新增记录"**
- 开始导入

应该看到 **5 条记录导入成功**。

### Step 4：刷新开发者工具

⌘R → 模拟器应该正常加载主页。

### Step 5：检查

- 主页显示 5 条活动 ✅
- 本周集合卡 = 徐汇滨江慢跑
- 历史活动 = 4 条
- 真机扫码预览 → 应该一样

---

## 🐛 常见问题

### Q1: "上传云函数" 失败
A: 检查：
- 包名是否正确（package.json）
- wx-server-sdk 版本是 2.6.3（个人版稳定）
- 网络正常

### Q2: 数据库里看不到"导入"按钮
A: 你可能进了"SQL 型数据库"。回退到**"数据库"菜单**（左侧）→ 集合列表。

### Q3: 真机看不到数据
A: 真机需要**小程序发布到体验版**才能用云开发。或者**模拟器右上角 → 预览 → 扫码**。

---

## 🎯 部署成功后

### 群主改活动流程

1. 打开 https://console.cloud.tencent.com/tcb
2. 数据库 → events 集合
3. 点"+"添加 / 点现有记录编辑
4. **30 秒后**小程序下次打开看到新数据

### 添加新活动示例

```json
{
  "id": "2026-09-26",
  "title": "世纪公园晨跑",
  "date": "2026-09-26",
  "weekday": "周六",
  "time": "07:00",
  "status": "upcoming",
  "meet": {
    "name": "世纪公园 7号门",
    "address": "上海市浦东新区锦绣路 1001 号",
    "lng": 121.54927,
    "lat": 31.21088,
    "poiid": null
  },
  "starbucks": {
    "name": "星巴克 世纪公园",
    "lng": 121.56149,
    "lat": 31.21150,
    "poiid": null
  },
  "route": "绕世纪公园 3 圈",
  "note": null,
  "attendees": null,
  "weather": null
}
```

**保存** → 跑友下次打开小程序看到 ✅

---

## 📁 项目结构

```
run-spot-wechat/
├── data/
│   ├── events.json                  # H5 数据源
│   ├── cloud-import.json            # 🆕 NoSQL 集合导入（5 条）
│   └── cloud-import.sql             # 🗑️ 不再使用
├── miniprogram/
│   ├── app.js                       # ✅ wx.cloud.init
│   ├── project.config.json          # ✅ cloudfunctionRoot
│   ├── pages/
│   │   ├── home/
│   │   └── event/
│   ├── utils/
│   └── cloudfunctions/              # ✅ 已改回 NoSQL 版本
│       ├── getEvents/               # cloud.database()
│       └── getEvent/                # cloud.database()
└── docs/08-V2-DEPLOY.md             # 本文档
```