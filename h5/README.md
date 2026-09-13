# H5 网页 · 甲骨文魔都跑团

> 跑团群通知链接 · 跑友点开看本周集合点 + 旁边星巴克 + 历史活动
>
> 数据源：`../data/events.json`（与小程序共享）

## 🚀 本地预览

```bash
cd h5
python3 -m http.server 8080
# 打开 http://127.0.0.1:8080
```

> ⚠️ 用 `http://` 而不是 `file://`，避免 Leaflet PNG marker 加载失败。

## 📁 文件结构

```
h5/
├── index.html              # 入口
├── assets/
│   ├── css/style.css       # 样式
│   └── js/app.js           # 应用主逻辑（含 Leaflet 地图）
├── data/
│   └── events.json         # 软链到 ../../data/events.json
└── README.md               # 本文件
```

## 📦 部署

### CloudBase 静态托管（推荐 · 国内 CDN）

```bash
# 1. 安装 CloudBase CLI
npm install -g @cloudbase/cli

# 2. 登录
tcb login

# 3. 创建环境（一次性）
#    登录 https://console.cloud.tencent.com/tcb 创建

# 4. 上传
tcb hosting:deploy h5 -e <环境ID>
```

### Vercel（备选 · 海外 CDN）

```bash
# 1. 把 h5/ 目录推到 GitHub
git init
git add h5/
git commit -m "init: h5"
git push

# 2. 登录 Vercel 导入这个仓库
#    - Framework: Other
#    - Build: 留空
#    - Output: h5
```

### Cloudflare Pages（已废，国内被墙，不推荐）

---

## 🛠️ 修改数据

H5 的数据来自 `../data/events.json`：

```bash
# 1. 编辑
vim ../data/events.json

# 2. （如果改了新地址）跑地理编码
export AMAP_KEY=你的key
python3 ../scripts/geocode_events.py

# 3. 部署
tcb hosting:deploy h5 -e <环境ID>
```

---

## 🎨 主题色

- **甲骨文红**：`#C74634`
- **星巴克绿**：`#006241`
- **背景**：`#FAFAFA`

## 🆘 故障排查

| 问题 | 解决 |
|---|---|
| 打开链接空白 | 检查 `data/events.json` 是否能访问（浏览器 Console 看 fetch 错误）|
| 地图瓦片不出来 | 高德瓦片 `webrd0*.is.autonavi.com` 被墙，部署到 CloudBase |
| 微信里打不开 | Cloudflare 子域名被风控，用 CloudBase 子域名 `*.webapps.tcloudbase.com` |
| 详情页 `#/event/xxx` 报错 | 确认 `id` 在 events.json 里存在 |