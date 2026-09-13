# 甲骨文魔都跑团 · 微信小程序

跑团活动的微信小程序版本。

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

### 5. 真机预览

开发者工具右上角 **预览** → 扫码 → 手机里看到小程序

---

## 📁 项目结构

```
miniprogram/
├── app.js                 # 全局入口 + 数据预加载
├── app.json               # 全局配置（pages、window）
├── app.wxss               # 全局样式
├── project.config.json    # 项目配置（AppID）
├── sitemap.json           # SEO
├── pages/
│   ├── home/              # 主页（本周活动 + 历史时间线）
│   │   ├── home.js
│   │   ├── home.wxml
│   │   ├── home.wxss
│   │   └── home.json
│   └── event/             # 详情页（地图 + 双 pin + 导航）
│       ├── event.js
│       ├── event.wxml
│       ├── event.wxss
│       └── event.json
├── utils/
│   ├── date.js            # 日期工具
│   └── nav.js             # 导航封装（wx.openLocation）
├── assets/
│   └── icons/             # pin 图标
│       ├── meet-pin.png   # 集合点（甲骨文红）
│       └── sbux-pin.png   # 星巴克（星巴克绿）
├── data/
│   └── events.json        # 软链接到 ../data/events.json
└── cloudfunctions/        # v2 预留（报名/打卡/拍照）
```

---

## 📝 更新活动数据

小程序直接 require `miniprogram/data/events.js`（**与 H5 项目共享同一份数据**，但小程序只能 require .js 不能 require .json）。

```bash
# 编辑 H5 项目根目录下的 data/events.json
vim /Users/billcao/Documents/workspaces/ai-projects/deepseek-projects/run-spot-wechat/data/events.json

# 同步到小程序（运行这个脚本）
bash scripts/sync-events.sh
```

脚本会自动把 `data/events.json` 转换成 `miniprogram/data/events.js`（用 `module.exports = {...}` 包裹）。

**⚠️ 重要**：微信小程序的 `require()` **不支持 .json 文件**，必须转成 .js 模块。

**发布更新**：在开发者工具点 **上传** → 微信公众平台提交审核 → 审核通过后发布

---

## 🆘 常见问题

### Q1: 开发者工具报错"appid 错误"
A: 检查 `project.config.json` 里的 `appid` 字段，必须是 `wx` 开头 18 位字符。

### Q2: 模拟器显示"加载中..."一直转
A: 检查 `miniprogram/data/events.json` 软链接是否有效：
```bash
ls -la miniprogram/data/
# 应该看到 events.json -> ../../data/events.json
```

### Q3: 地图不显示
A: 小程序 `<map>` 必须配置**腾讯地图 SDK**：在微信公众平台后台 → 设置 → 类目管理 → 类目设置 → 添加"工具-效率"类目（已经选过的话不用动）。否则地图组件不可用。

### Q4: 真机预览报错"不在以下 request 合法域名列表中"
A: 当前版本没请求外部域名（如需，加 url 白名单）。小程序 require 本地 JSON，无需网络。

### Q5: 个人主体类目审核
A: 个人主体小程序可用类目有限，建议"工具-效率"。提交时如实描述"上海跑团活动通知"。

---

## 🎯 下一步

v1（当前）：把现有 H5 功能搬过来
v2：接入小程序云开发 → 跑友报名 / 打卡 / 拍照 / 排行榜
v3：订阅消息推送（活动当天提醒）