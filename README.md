# Run Spot WeChat 🏃‍♂️☕

> 甲骨文魔都跑团 · 微信群内应用
> "每个周末做回自己，八卦别人"

群友在微信里点链接 → 直接看本周集合点 + 星巴克 + 历史活动。

## 文档

- [docs/00-PRODUCT-BRIEF.md](docs/00-PRODUCT-BRIEF.md) — 产品简报
- [docs/01-FEASIBILITY.md](docs/01-FEASIBILITY.md) — 可行性分析（4 条路径对比）
- [docs/02-DECISIONS.md](docs/02-DECISIONS.md) — 关键决策记录
- [docs/03-ACTION-PLAN.md](docs/03-ACTION-PLAN.md) — 开工计划
- [docs/04-DEPLOY.md](docs/04-DEPLOY.md) — Cloudflare Pages 部署指南
- [docs/05-EVENTS-JSON-GUIDE.md](docs/05-EVENTS-JSON-GUIDE.md) — 群主编辑指南

## 项目结构

```
run-spot-wechat/
├── index.html                  # 单页应用入口（SPA）
├── data/
│   └── events.json             # 活动数据（群主每周改这个文件）
├── assets/
│   ├── css/style.css           # 共用样式
│   └── js/app.js               # 应用主入口
├── scripts/
│   └── geocode_events.py       # 批量 geocode 脚本（一次，填充坐标）
└── docs/                       # 规划 + 部署文档
```

## 技术栈

- **纯静态**：HTML + CSS + JS（无框架）
- **地图**：Leaflet + 高德瓦片
- **导航**：uri.amap.com（高德 App / Web 通用）
- **数据**：`data/events.json`（GitHub 仓库托管）
- **部署**：Cloudflare Pages（免费、自动 HTTPS）

## 复用 amap-trip-planner

地图渲染和导航跳转逻辑从 `amap-trip-planner` skill 改造而来。
主要差异：固定结构（集合点 + 星巴克双 pin）+ 多页路由（URL hash + 单页渲染）。

## 本地开发

```bash
cd run-spot-wechat
python3 -m http.server 8080
# 打开 http://127.0.0.1:8080
```

注意：用 `http://` 而不是 `file://` 打开，避免 Leaflet 默认 PNG marker 加载失败的旧 bug。

## 上线流程（详见 docs/04-DEPLOY.md）

1. 把这个目录推到 GitHub 仓库
2. Cloudflare Pages 接 GitHub 自动部署
3. 拿到 `*.pages.dev` 链接丢群里
4. 群主以后只需在 GitHub 网页改 `data/events.json`

## 群主每周运营成本

- 时间：~2 分钟
- 动作：GitHub 网页改 JSON → commit → 自动部署 → 复制新链接到群