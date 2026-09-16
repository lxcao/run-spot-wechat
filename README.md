# 甲骨文魔都跑团 🏃‍♂️☕

> 上海跑团微信群内应用 · "每个周末做回自己，八卦别人"
>
> 跑友在微信里打开 → 看本周集合 + 历史活动 + 照片墙 + 周末天气

---

## 🎯 项目状态

**小程序 v3 + H5 v2 + 配置 v4 + 照片 v3** 全部跑通 ✅

- ✅ **H5 网页**（CloudBase 永久免费子域名，国内访问）
- ✅ **微信小程序**（云函数 + 云数据库，群主在云开发控制台改数据，**30 秒生效**）
- ✅ **本周末天气卡片**（高德 API 实时拉取）
- ✅ **地图 + 双 pin**（集合点 + 星巴克）
- ✅ **跑友上传活动照片**（照片墙 + 全屏预览 + 原子并发安全）
- ✅ **群主配置活动**（高德地址联想 + 添加/删除 + 历史活动）

⏸️ **后台管理 web 版**：**规划中**，待重新设计

---

## 📁 项目结构

```
run-spot-wechat/
├── data/                 # 共享数据源（H5 + 小程序 + CloudBase）
│   ├── events.json       # H5 数据源
│   ├── cloud-import.json # 小程序云数据库导入
│   └── team-import.json  # 跑团信息导入
│
├── h5/                   # 🚀 跑团 H5 网页子项目（独立部署）
│   ├── index.html        # 入口（Leaflet 地图 + 高德瓦片）
│   ├── assets/
│   │   ├── css/style.css
│   │   └── js/app.js     # 主逻辑
│   ├── data/events.json  # 软链到 ../../data/events.json
│   └── README.md
│
├── miniprogram/          # 📱 跑团微信小程序子项目
│   ├── app.js / app.json / app.wxss
│   ├── project.config.json
│   ├── pages/
│   │   ├── home/         # 主页（本周 + 历史 + 天气）
│   │   ├── event/        # 详情（信息 + 地图 + 照片墙 + 导航）
│   │   ├── photo-view/   # 全屏图片预览（带返回箭头）
│   │   └── event-create/ # 群主配置页（添加 / 删除活动 + 权限）
│   ├── cloudfunctions/   # 8 个云函数
│   │   ├── getEvents / getEvent
│   │   ├── createEvent / deleteEvent
│   │   ├── updateEventPhotos
│   │   ├── getWeather / getAddressSuggestions
│   │   └── checkAdmin
│   ├── utils/
│   │   ├── date.js / nav.js / weather.js / upload.js
│   └── assets/icons/
│
├── scripts/              # 工具脚本
│   ├── sync-events.sh
│   ├── geocode_events.py
│   └── setup-git.sh
│
├── docs/                 # 文档
│   ├── 00-PRODUCT-BRIEF.md
│   ├── 01-FEASIBILITY.md
│   ├── 03-ICP-FILING.md
│   ├── 05-MINIPROGRAM-MIGRATION.md
│   ├── 06-CLOUD-DEVELOPMENT.md
│   ├── 07-V2-DEPLOY.md
│   └── 08-V3-PHOTOS.md
│
├── .gitignore
└── README.md             ← 本文件
```

---

## 🚀 快速开始

### H5 网页（独立子项目）

```bash
cd h5
python3 -m http.server 8080
# 浏览器打开 http://127.0.0.1:8080
```

> ⚠️ 用 `http://` 而不是 `file://`，避免 Leaflet PNG marker 加载失败。
> 详细部署见 [h5/README.md](h5/README.md)

### 微信小程序

1. 用 [微信开发者工具](https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html) 打开 `miniprogram/`
2. 在项目设置里填入你的 **AppID**
3. 工具栏 → **"云开发"** → 开通环境
4. 创建 NoSQL 集合：
   - `team`（导入 `data/team-import.json`）
   - `events`（导入 `data/cloud-import.json`）
5. 上传所有云函数（8 个）
6. 详细部署见 [docs/07-V2-DEPLOY.md](docs/07-V2-DEPLOY.md)

---

## 🔄 数据流向

```
data/                         ← 共享数据源（H5 + 小程序 + CloudBase）
├── events.json               H5 网页用
├── cloud-import.json          小程序云数据库用
└── team-import.json
       │
       ├── bash scripts/sync-events.sh
       │   同步到云数据库
       │
       ↓
CloudBase run-spot-prod
├── 静态托管（h5）            ← index.html + Leaflet + 高德瓦片
├── 云数据库（events + team）  ← 数据存储
└── 云函数（8 个）            ← 业务逻辑
       │
       ↑ 云开发控制台手动编辑
       │
run-spot-wechat（你电脑）     ← 改代码 + git push
```

---

## 🛠️ 技术栈

| 端 | 技术 |
|---|---|
| **H5 网页** | 纯 HTML + CSS + JS（无框架）<br>+ Leaflet 地图 + 高德瓦片<br>+ uri.amap.com 导航跳转<br>+ 高德天气 API |
| **小程序** | 微信原生（wxml/wxss/js）<br>+ 小程序 `<map>` 组件（腾讯底图）<br>+ `wx.openLocation` 唤起系统地图<br>+ 微信云开发（云函数 + NoSQL + 云存储） |
| **后端** | 微信云开发（个人版，免费）<br>+ **8 个云函数**（getEvents / getEvent / createEvent / deleteEvent / updateEventPhotos / getWeather / getAddressSuggestions / checkAdmin）<br>+ **2 个 NoSQL 集合**（events / team）<br>+ **1 个云存储**（活动照片） |
| **第三方** | 高德地图 Web Service API（地理编码 + 天气 + 地址联想） |

---

## 📊 跑团规模 vs 费用

| 项 | 免费层 | 跑团用量 | 够吗 |
|---|---|---|---|
| 云函数调用 | 4 万/月 | 100~300/月 | ✅ |
| 云存储 | 5 GB | 几十 MB | ✅ |
| CDN 流量 | 5 GB/月 | 1 GB/月 | ✅ |
| NoSQL | 2 GB | 几 MB | ✅ |
| 高德 API | 5000/天 | 几十/天 | ✅ |

跑团 < 500 跑友 → 完全免费。

---

## 🔄 群主运营流程

```
每天/每场：
1. 群主打开小程序 → ⚙️ 配置 → 添加新活动（高德地址联想）
2. 群主在群里发活动链接（CloudBase 默认域名）
3. 跑友点链接 → 看本周活动 + 地图 + 照片
4. 跑友自己上传现场照片

每 1~2 周：
- 群主在配置页 → 删除旧活动（云存储照片自动清理）

临时加管理员：
1. 跑友打开小程序 → ⚙️ 配置 → 复制 openid
2. 群主把 openid 加到 team.admins 数组
3. 该跑友现在也能配置活动
```

---

## 📄 文档

| 文档 | 说明 |
|---|---|
| [00-PRODUCT-BRIEF](docs/00-PRODUCT-BRIEF.md) | 产品简报（用户故事 + 功能边界）|
| [01-FEASIBILITY](docs/01-FEASIBILITY.md) | 4 条路径可行性分析 |
| [03-ICP-FILING](docs/03-ICP-FILING.md) | 域名 ICP 备案指南 |
| [05-MINIPROGRAM-MIGRATION](docs/05-MINIPROGRAM-MIGRATION.md) | H5 → 小程序迁移 |
| [06-CLOUD-DEVELOPMENT](docs/06-CLOUD-DEVELOPMENT.md) | 云开发概念 + 数据架构 |
| [07-V2-DEPLOY](docs/07-V2-DEPLOY.md) | v2 部署指南 |
| [08-V3-PHOTOS](docs/08-V3-PHOTOS.md) | 照片功能文档 |

---

## 🚦 版本路线

- ✅ **v1**：H5 + Cloudflare Pages（已完成）
- ✅ **v2**：H5 + 小程序 + 云开发 + 天气（已完成）
- ✅ **v3**：活动照片 + 全屏预览（已完成）
- ✅ **v4**：群主配置 + 权限管控（已完成）
- ✅ **v4.1**：历史活动 + 排序修复（已完成）
- ⏳ **v5**：网页后台管理（规划中）
- ⏳ **v6**：跑友报名 / 打卡 / 排行
- ⏳ **v7**：订阅消息推送

---

## 💡 核心设计理念

- **跑团活动通知 = 时效性强 + 周期性 + 简单** → H5 + 小程序完全够用
- **改数据不应该重发版** → 云函数 + NoSQL 集合
- **国内访问必须稳** → 腾讯云 CloudBase（不碰 Cloudflare）
- **群主操作越简单越好** → 小程序后台（图形化界面）
- **跑友体验原生** → 微信小程序 + 唤起系统地图

---

**甲骨文魔都跑团 · 每个周末做回自己，八卦别人 ☕**
