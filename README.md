# 甲骨文魔都跑团 🏃‍♂️☕

> 上海跑团微信群内应用 · "每个周末做回自己，八卦别人"
>
> 群友在微信里点开 → 直接看本周集合点 + 旁边星巴克 + 历史活动 + 周末天气

## 🎯 项目状态（v2 + v3 跑通）

- ✅ **H5 网页**（CloudBase 永久免费子域名，国内访问）
- ✅ **微信小程序**（云函数 + 云数据库，群主在云开发控制台改数据，**30 秒生效**）
- ✅ **本周末天气卡片**（高德 API 实时拉取）
- ✅ **地图 + 双 pin**（集合点 + 星巴克）
- ✅ **一键唤起系统地图**导航
- ✅ **🆕 活动照片墙**（v3：跑友拍照上传，云存储 + 自定义预览页）
- ✅ **🆕 全屏图片预览**（带返回箭头、左右滑动、页码）
- ✅ **真机 / 模拟器全部跑通**

---

## 📁 项目结构

```
run-spot-wechat/
├── data/                                    # 共享数据源（H5 + 小程序云数据库）
│   ├── events.json                          # 5 条活动数据
│   ├── cloud-import.json                    # 云数据库导入（5 条，JSON Lines）
│   └── team-import.json                     # 云数据库导入（跑团信息）
│
├── h5/                                      # H5 网页（独立子项目）
│   ├── index.html                           # 入口
│   ├── assets/
│   │   ├── css/style.css                    # 样式
│   │   └── js/app.js                        # Leaflet 地图 + 高德瓦片
│   ├── data/
│   │   └── events.json                      # 软链到 ../../data/events.json
│   └── README.md                            # H5 部署说明
│
├── miniprogram/                             # 微信小程序（独立子项目）
│   ├── app.js / app.json / app.wxss          # 全局入口
│   ├── project.config.json                  # 小程序项目配置
│   ├── sitemap.json                         # SEO
│   │
│   ├── pages/
│   │   ├── home/                            # 主页：本周集合 + 历史时间线 + 天气
│   │   │   ├── home.js
│   │   │   ├── home.wxml
│   │   │   ├── home.wxss
│   │   │   └── home.json
│   │   ├── event/                           # 详情页：信息卡 + 地图 + 双 pin + 照片墙 + 导航
│   │   │   ├── event.js
│   │   │   ├── event.wxml
│   │   │   ├── event.wxss
│   │   │   └── event.json
│   │   └── photo-view/                      # 🆕 v3：全屏图片预览（带返回箭头）
│   │       ├── photo-view.js
│   │       ├── photo-view.wxml
│   │       ├── photo-view.wxss
│   │       └── photo-view.json
│   │
│   ├── cloudfunctions/                      # 云函数
│   │   ├── getEvents/                       # 查所有活动 + 跑团信息
│   │   ├── getEvent/                        # 查单个活动
│   │   └── updateEventPhotos/                # 🆕 v3：上传照片到 events.photos
│   │
│   ├── utils/                               # 工具函数
│   │   ├── date.js                          # 日期格式化
│   │   ├── nav.js                           # 地图导航封装
│   │   ├── weather.js                       # 高德天气 API
│   │   └── upload.js                        # 🆕 v3：选图+压缩+上传工具
│   │
│   ├── assets/icons/                        # 地图 pin 图标
│   │   ├── meet-pin.png                     # 集合点（甲骨文红）
│   │   └── sbux-pin.png                     # 星巴克（星巴克绿）
│   │
│   └── README.md                            # 小程序使用说明
│
├── scripts/                                 # 工具脚本（被两个子项目共享）
│   ├── sync-events.sh                       # 一键同步数据 → 云数据库导入
│   ├── geocode_events.py                    # 高德地理编码
│   └── setup-git.sh                         # Git 初始化
│
├── docs/                                    # 完整文档
│   ├── 00-PRODUCT-BRIEF.md                  # 产品简报
│   ├── 01-FEASIBILITY.md                    # 4 条路径可行性分析
│   ├── 02-DECISIONS.md                      # 关键决策记录
│   ├── 03-ICP-FILING.md                     # 域名 ICP 备案指南
│   ├── 04-EVENTS-JSON-GUIDE.md              # 群主编辑指南
│   ├── 05-MINIPROGRAM-MIGRATION.md          # H5 → 小程序迁移
│   ├── 06-CLOUD-DEVELOPMENT.md              # 云开发概念 + 数据架构
│   └── 07-V2-DEPLOY.md                      # v2 部署步骤
│
├── .gitignore                              # Git 忽略配置
└── README.md                                # 本文件
```

---

## 🔄 数据流架构

```
┌─────────────────┐
│  群主浏览器      │  ← 云开发控制台
└─────────────────┘
        ↓
   改活动数据
        ↓
   ┌────────┐  ┌────────┐  ┌──────────┐
   │ events │  │  team  │  │  存储    │  ← 云开发
   │ 集合   │  │ 集合   │  │ (云存储) │  (永久免费)
   └────────┘  └────────┘  └──────────┘
        ↑           ↑            ↑
   云函数      云函数       wx.cloud
   getEvents   getEvent      .uploadFile
        ↑           ↑            ↑
   微信小程序打开
        ↓
   主页 + 详情页 + 照片墙
```

### v3 照片流程

```
跑友点 [📷 上传照片]
  ↓
wx.chooseMedia 选图（最多 9 张）
  ↓
wx.compressImage 压缩到 500KB
  ↓
wx.cloud.uploadFile 上传到 cloud://xxx/events/2026-09-12/xxx.jpg
  ↓
云函数 updateEventPhotos 写数据库
  ↓
前端立刻合并新照片 → setData
  ↓
照片墙显示新缩略图
```

---

## 🛠️ 技术栈

| 端 | 技术 |
|---|---|
| **H5 网页** | 纯 HTML + CSS + JS（无框架）<br>+ Leaflet 地图 + 高德瓦片<br>+ uri.amap.com 导航跳转<br>+ 高德天气 API |
| **小程序** | 微信原生（wxml/wxss/js）<br>+ 小程序 `<map>` 组件（腾讯底图）<br>+ `wx.openLocation` 唤起系统地图<br>+ 微信云开发（云函数 + NoSQL 集合 + 云存储） |
| **后端** | 微信云开发（个人版，免费）<br>+ **3 个云函数**（getEvents / getEvent / updateEventPhotos）<br>+ **2 个 NoSQL 集合**（events / team）<br>+ **1 个云存储**（events/{date}/ 目录） |
| **第三方** | 高德地图 Web Service API（地理编码 + 天气） |
| **图片处理** | wx.chooseMedia（选图）<br>+ wx.compressImage（压缩）<br>+ wx.cloud.uploadFile（上传）<br>+ wx.cloud.getTempFileURL（转 https URL） |

---

## 🚀 快速开始

### H5 网页

```bash
cd run-spot-wechat/h5
python3 -m http.server 8080
# 打开 http://127.0.0.1:8080
```

> ⚠️ 用 `http://` 而不是 `file://`，避免 Leaflet PNG marker 加载失败。
> 详细部署见 [h5/README.md](h5/README.md)

### 微信小程序

1. 用 [微信开发者工具](https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html) 打开 `miniprogram/` 目录
2. 在项目设置里填入你的 **AppID**（修改 `project.config.json`）
3. 工具栏 → **"云开发"** 按钮 → 开通环境
4. 创建 NoSQL 集合：
   - `team`（导入 `data/team-import.json`）
   - `events`（导入 `data/cloud-import.json`）
5. 上传云函数（3 个）：
   - 右键 `cloudfunctions/getEvents` → 上传并部署
   - 右键 `cloudfunctions/getEvent` → 上传并部署
   - 右键 `cloudfunctions/updateEventPhotos` → 上传并部署（v3 照片）
6. ⌘R 刷新模拟器
7. 开发者工具 → 详情 → 本地设置 → 勾选"不校验合法域名"（用于拉高德天气）

> 详细步骤见 [docs/07-V2-DEPLOY.md](docs/07-V2-DEPLOY.md)

---

## 👥 群主使用流程

### 改活动（推荐流程）

1. 打开 [云开发控制台](https://console.cloud.tencent.com/tcb) → `run-spot-prod` 环境 → 数据库
2. `events` 集合 → 编辑或新增活动
3. **30 秒后跑友打开小程序就能看到新数据** ✅
4. **不需要重发版** 🎉

### 改跑团信息

1. 同一个控制台 → `team` 集合 → 编辑 `id='meta'` 的记录
2. 改跑团名 / slogan / 城市等
3. **30 秒后生效**

### 查看跑友上传的照片

1. 云开发控制台 → **存储** → `events/{活动 ID}/` 目录
2. 可以直接下载 / 删除 / 看上传时间
3. 也可以看每张照片的上传者（`uploader` = 跑友 openid）

> 详细字段说明见 [docs/04-EVENTS-JSON-GUIDE.md](docs/04-EVENTS-JSON-GUIDE.md)

---

## 🆘 故障排查

| 问题 | 解决 |
|---|---|
| 模拟器一直"加载中" | 检查云开发控制台 → 数据库是否已导入 |
| `cloud.callFunction` 报错 | 检查云函数是否上传成功（云开发控制台 → 云函数列表）|
| 天气显示"暂无数据" | 开发者工具 → 详情 → 勾选"不校验合法域名" |
| 微信里打开小程序白屏 | 真机预览需要发布到"开发版"或"正式版" |
| 导航按钮点不动 | 检查 meet.lng / meet.lat 是否为数字（非 null） |
| **照片上传后不显示** | 检查云函数 `updateEventPhotos` 是否已上传，events 集合的 `photos` 字段是否有数据 |
| **照片显示空白** | fileID 必须在 `<image>` 标签转成 tempURL（v3 代码已自动处理）|
| **云存储看不到照片** | 检查云开发控制台 → 存储 → `events/` 目录 |

---

## 🛣️ 路线图

- ✅ **v1**：H5 + CloudBase（已完成）
- ✅ **v2**：H5 + 小程序 + 云开发 + 天气（已完成）
- ✅ **v3**：照片上传 + 全屏预览（已完成！）
- ⏳ **v4**：跑友报名 / 打卡 / 跑团排行（计划中）
- ⏳ **v5**：订阅消息推送 / 跑团成员主页

---

## 📄 文档导航

| 类别 | 文档 |
|---|---|
| 产品 | [00-PRODUCT-BRIEF](docs/00-PRODUCT-BRIEF.md) |
| 决策 | [01-FEASIBILITY](docs/01-FEASIBILITY.md) · [02-DECISIONS](docs/02-DECISIONS.md) |
| 备案 | [03-ICP-FILING](docs/03-ICP-FILING.md) |
| 数据 | [04-EVENTS-JSON-GUIDE](docs/04-EVENTS-JSON-GUIDE.md) |
| 小程序 | [05-MINIPROGRAM-MIGRATION](docs/05-MINIPROGRAM-MIGRATION.md) |
| 云开发 | [06-CLOUD-DEVELOPMENT](docs/06-CLOUD-DEVELOPMENT.md) |
| 部署 | [07-V2-DEPLOY](docs/07-V2-DEPLOY.md) |
| 照片 | [08-V3-PHOTOS](docs/08-V3-PHOTOS.md) |

---

## 🏃 核心开发思想

- **跑团活动通知 = 时效性强 + 周期性 + 简单** → H5 + 小程序完全够用
- **改数据不应该重发版** → 云函数 + NoSQL 集合
- **国内访问必须稳** → 腾讯云 CloudBase / EdgeOne（不碰 Cloudflare）
- **群主操作越简单越好** → 云开发控制台 = 浏览器操作
- **跑友体验原生** → 微信小程序 + 唤起系统地图
- **代码组织解耦** → H5 和小程序是两个独立子项目，共享数据 + 工具脚本

---

**甲骨文魔都跑团 · 每个周末做回自己，八卦别人 ☕**