# 甲骨文魔都跑团 · 微信小程序

> 跑团活动的微信小程序版本（v2 + v3 跑通）
>
> 功能：本周集合 + 历史活动 + 周末天气 + 活动照片墙

## 🚀 快速开始

### 1. 注册小程序 AppID

打开 https://mp.weixin.qq.com/ → 立即注册 → 小程序
- 用未注册过微信公众平台的邮箱
- 个人主体：身份证 + 微信扫码
- 5 分钟拿到 AppID

### 2. 填入 AppID

编辑 `project.config.json`，把：

```json
"appid": "REPLACE_WITH_YOUR_APPID"
```

改成你的 AppID（格式如 `wx1234567890abcdef`）。

### 3. 下载微信开发者工具

打开 https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html
- macOS / Windows 任选
- 安装后扫码登录

### 4. 导入项目

打开开发者工具 → **导入项目**：
- 项目目录：选择本目录 `miniprogram/`
- AppID：用刚才填好的
- 项目名称：`run-spot-wechat`

点 **导入** → 项目自动编译 → 模拟器里看到主页 🎉

### 5. 配置云开发（v2 + v3 必备）

1. 工具栏 → **"云开发"** 按钮 → 开通环境（实名 + 免费版）
2. **创建 NoSQL 集合**：
 - `team`（导入 `data/team-import.json`）
 - `events`（导入 `data/cloud-import.json`）
3. **上传云函数**（3 个）：
 - `cloudfunctions/getEvents` → 上传并部署
 - `cloudfunctions/getEvent` → 上传并部署
 - `cloudfunctions/updateEventPhotos` → 上传并部署（v3 照片）
4. **设置权限**：`events` 集合 → 权限 → "所有用户可读，仅创建者可写"

### 6. 真机预览

开发者工具右上角 **预览** → 扫码 → 手机里看到小程序

---

## 📁 项目结构

```
miniprogram/
├── app.js                       # 全局入口 + 数据预加载
├── app.json                     # 全局配置（pages、window）
├── app.wxss                     # 全局样式
├── project.config.json          # 项目配置（AppID、cloudfunctionRoot）
├── sitemap.json                 # SEO
│
├── pages/
│   ├── home/                    # 主页：本周集合 + 历史时间线 + 天气
│   │   ├── home.js
│   │   ├── home.wxml
│   │   ├── home.wxss
│   │   └── home.json
│   ├── event/                   # 详情页：信息 + 地图 + 照片墙 + 导航
│   │   ├── event.js
│   │   ├── event.wxml
│   │   ├── event.wxss
│   │   └── event.json
│   └── photo-view/              # v3：全屏图片预览（带返回箭头）
│       ├── photo-view.js
│       ├── photo-view.wxml
│       ├── photo-view.wxss
│       └── photo-view.json
│
├── cloudfunctions/              # 云函数（3 个）
│   ├── getEvents/               # 查所有活动 + 跑团信息
│   │   ├── index.js
│   │   └── package.json
│   ├── getEvent/                # 查单个活动
│   │   ├── index.js
│   │   └── package.json
│   └── updateEventPhotos/        # v3：上传照片到 events.photos
│       ├── index.js
│       └── package.json
│
├── utils/                       # 工具函数
│   ├── date.js                  # 日期格式化
│   ├── nav.js                   # 导航封装（wx.openLocation）
│   ├── weather.js               # 高德天气 API
│   └── upload.js                # v3：选图 + 压缩 + 上传
│
├── assets/
│   └── icons/                   # 地图 pin 图标
│       ├── meet-pin.png         # 集合点（甲骨文红）
│       └── sbux-pin.png         # 星巴克（星巴克绿）
│
└── README.md                    # 本文件
```

---

## 🎯 功能列表

| 功能 | 状态 | 说明 |
|---|---|---|
| 主页：本周集合 + 历史 + 天气 | ✅ | 数据从云数据库拉 |
| 详情：信息 + 地图 + 双 pin + 导航 | ✅ | 调 `wx.openLocation` 唤起系统地图 |
| **照片墙** | ✅ v3 | 跑友拍照上传，云存储 + 缩略图 |
| **全屏图片预览** | ✅ v3 | 自定义页面（带返回箭头、左右滑动）|
| **本周末天气** | ✅ | 高德 API（1 小时缓存）|
| 跑友报名 | ⏳ v4 | 待做 |
| 跑友打卡 | ⏳ v4 | 待做 |
| 订阅消息推送 | ⏳ v5 | 待做 |

---

## 📝 更新活动数据

v2 架构：H5 读 `data/events.json`，小程序读**云开发数据库**。

### 推荐：直接在云开发控制台改

1. https://console.cloud.tencent.com/tcb → `run-spot-prod` 环境 → 数据库
2. `events` 集合 → 点"+" → 填字段
3. 保存 → 30 秒后跑友看到 ✅

### H5 数据 → 云数据库同步

```bash
# 编辑 H5 项目根目录下的 data/events.json
vim data/events.json

# 一键生成云数据库导入文件
bash scripts/sync-events.sh

# 在云开发控制台 → events 集合 → 导入 data/cloud-import.json
```

---

## 🆘 常见问题

### Q1: 开发者工具报错"appid 错误"
A: 检查 `project.config.json` 里的 `appid` 字段，必须是 `wx` 开头 18 位字符。

### Q2: 模拟器一直"加载中..."
A: 检查云开发控制台 → 数据库是否已导入数据。

### Q3: 地图不显示
A: 小程序 `<map>` 必须配置类目。在微信公众平台 → 设置 → 类目管理 → 添加"工具-效率"类目。

### Q4: 天气不显示
A: 开发者工具 → 详情 → 本地设置 → 勾选"不校验合法域名"。

### Q5: 照片上传后看不到？
A: 
1. 云函数 `updateEventPhotos` 必须先"上传并部署"
2. 上传后端 Console，看 `getTempFileURL` 是否成功
3. 照片应立刻出现在照片墙（已经直接 setData 合并了）

### Q6: 个人主体类目
A: 建议"工具-效率"。提交时如实描述"上海跑团活动通知"。

---

## 🆘 性能优化

- **云函数冷启动**：首次调用 1-2 秒，之后 < 100ms
- **getTempFileURL**：每次访问会刷新，但 1 小时有效
- **图片大小**：v3 自动压缩到 500KB，避免存储浪费
- **限流**：每场活动最多 100 张，每人最多 9 张

---

## 🛣️ 路线图

- ✅ **v2**：H5 + 小程序 + 云开发（已完成）
- ✅ **v3**：照片上传 + 全屏预览（已完成！）
- ⏳ **v4**：跑友报名 / 打卡 / 跑团排行
- ⏳ **v5**：订阅消息推送 / 跑团成员主页

---

## 📞 反馈

遇到问题看 [docs/07-V2-DEPLOY.md](../docs/07-V2-DEPLOY.md) 详细部署步骤。