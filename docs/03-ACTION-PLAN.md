# 开工计划（待用户点头后执行）

## 已锁定的决策
- **路径 B**：Cloudflare Pages 静态托管 H5
- **存储**：JSON 文件 + GitHub
- **资产**：高德 API Key + GitHub 账号已有

## 待补的资产
- [ ] Cloudflare 账号（你注册，5 分钟）
- [ ] 跑团名称 / 顶部 slogan
- [ ] 5~10 条历史活动（日期 / 时间 / 集合点 / 星巴克 / 路线 / 备注）
- [ ] 下周即将开始的活动（如果你已经定好）

## 实施步骤（我这边）

### Step 1. 项目骨架（半天）
- [ ] 创建 `index.html`（主页：本周活动 + 历史时间线）
- [ ] 创建 `event.html?e=<id>`（活动详情：地图 + 双 pin + 导航）
- [ ] 提取共用 CSS / JS 到 `assets/`
- [ ] 基于 amap-trip-planner 的 map-template.html 改造

### Step 2. JSON Schema + 数据（半天）
- [ ] 定义 `data/events.json` Schema
- [ ] 跑 geocode.py 把每条活动的集合点 + 星巴克坐标烤进 JSON（前端免 API key）
- [ ] 准备 5~10 条种子数据

### Step 3. 主页 + 路由（半天）
- [ ] 主页：顶部本周活动卡片（大卡）+ 历史时间线（小卡）
- [ ] 卡片含：日期、时间、集合点、星巴克、"导航"按钮
- [ ] 详情页：复用地图模板，双 pin（集合点 + 星巴克）

### Step 4. 视觉打磨 + 微信内浏览器适配（半天）
- [ ] 移动优先，375pt~414pt 屏幕测试
- [ ] 微信内浏览器特殊处理（去掉顶部遮挡、判断是否微信内核）
- [ ] 字号 / 行高 / 圆角适配老年跑友

### Step 5. 部署文档 + GitHub（半天）
- [ ] README 写清楚：如何 fork + 部署到 Cloudflare Pages
- [ ] 写 `events.json` 字段说明（给群主）
- [ ] Cloudflare Pages 接入 GitHub 仓库

### Step 6. 自检（半天）
- [ ] 用 skill `browse` / `qa` 跑一遍微信内浏览器模拟
- [ ] 截图对比 375pt / 414pt
- [ ] 检查所有链接 uri.amap.com 在高德 App 内正确唤起

---

## 上线 Checklist（用户侧）

- [ ] Cloudflare 账号注册 + Pages 项目创建（绑定 GitHub 仓库）
- [ ] 在 `data/events.json` 添加本周活动
- [ ] 测试群链接：`https://<your-project>.pages.dev/?e=<id>`
- [ ] 把链接丢到跑团群，观察跑友点击反馈
- [ ] 修复任何 bug（第一个 bug 通常是微信内浏览器字体或点击穿透）

---

## 不在 v1 范围（明确推迟）

- ❌ 跑友报名 / 打卡
- ❌ 推送提醒
- ❌ 公众号菜单（v2 再加）
- ❌ 照片上传（v2 用 OSS / 腾讯云对象存储）
- ❌ 多跑团支持
- ❌ GPS 轨迹记录（用 Keep / 咕咚即可）