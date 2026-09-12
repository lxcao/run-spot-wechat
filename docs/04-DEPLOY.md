# 部署到 Cloudflare Pages（5 分钟）

> 把 `run-spot-wechat` 这个静态网站部署到 Cloudflare Pages，免费、国内可访问、自动 HTTPS。

## 一次性操作（约 10 分钟）

### 1. 注册 / 登录 Cloudflare

打开 https://dash.cloudflare.com/sign-up 用 `caolingxin@hotmail.com` 注册。
（如果你已经有账号，直接登录。）

### 2. 在 GitHub 创建仓库

打开 https://github.com/new
- Repository name: `run-spot-wechat`（或你喜欢的名字）
- Public
- 不要勾选 "Add a README file"
- 点击 "Create repository"

### 3. 推送代码

在你本地（clone 这个项目之后）：

```bash
cd run-spot-wechat
git init
git add .
git commit -m "init: 甲骨文魔都跑团 v1"
git branch -M main
git remote add origin https://github.com/<your-username>/run-spot-wechat.git
git push -u origin main
```

> 这一步是把代码传到 GitHub。我会帮你准备好 `git init` 之后的所有 commit 内容。
> 你也可以直接用 GitHub 网页上传：仓库页 → "uploading an existing file" → 拖入整个 `run-spot-wechat` 文件夹。

### 4. Cloudflare Pages 接 GitHub

1. 登录 https://dash.cloudflare.com/
2. 左侧菜单 → **Workers & Pages** → **Create application** → **Pages** 标签 → **Connect to Git**
3. 选择 `run-spot-wechat` 仓库 → **Begin setup**
4. 配置：
   - **Project name**: `run-spot-wechat`（决定你的域名，如 `run-spot-wechat.pages.dev`）
   - **Production branch**: `main`
   - **Build command**: 留空
   - **Build output directory**: `/` 或 `.`（根目录）
   - **Root directory**: 留空
5. 点击 **Save and Deploy**

等待 30~60 秒，部署完成。你会拿到一个链接：

```
https://run-spot-wechat.pages.dev/
```

> 🎉 这个就是群主可以丢到跑团群的链接！

### 5. （可选）绑定自定义域名

如果你有自己的域名（如 `run.你的域名.com`），在 Pages 项目里 **Custom domains** 添加，
跟着 Cloudflare 提示改 DNS 即可。Cloudflare 自动 HTTPS。

---

## 群主每周发布活动流程（约 2 分钟）

### 方式 A：网页编辑 GitHub（推荐，最简单）

1. 打开 https://github.com/<your-username>/run-spot-wechat/edit/main/data/events.json
2. 直接在网页编辑器里改 JSON：
   - 找 `"status": "upcoming"` 那条（最早一条），把它的内容复制一份
   - 修改 `id` / `date` / `time` / `meet.name` 等
   - **坐标（lng/lat/poiid）保留 `null`** — Cloudflare Pages 部署后会自动跑 geocode 脚本（v2 功能）；v1 你需要本地跑一次
3. 点 **Commit changes**
4. 等 30 秒 Cloudflare 自动部署完成
5. 复制新链接 `https://run-spot-wechat.pages.dev/#/event/<新id>` 丢到跑团群

### 方式 B：本地编辑 + 推送

```bash
cd ~/path/to/run-spot-wechat
# 1. 编辑 data/events.json
$EDITOR data/events.json

# 2. （仅第一次）跑 geocode 把新地址烤成坐标
export AMAP_KEY=你的key
python3 scripts/geocode_events.py

# 3. 提交 + 推送
git add data/events.json
git commit -m "feat: 新增 2026-09-26 世纪公园活动"
git push
```

30 秒后 Cloudflare 自动部署。

---

## 字段速查（详见 docs/05-EVENTS-JSON-GUIDE.md）

| 字段 | 必填 | 说明 |
|---|---|---|
| `events[].id` | ✅ | URL 友好的唯一 ID，用日期 `2026-09-19` |
| `events[].date` | ✅ | ISO 日期 `YYYY-MM-DD` |
| `events[].time` | ✅ | 24h `HH:MM` |
| `events[].weekday` | 🟡 | 周几，留空会自动算 |
| `events[].title` | 🟡 | 活动名，留空就用集合点名 |
| `events[].meet.name` | ✅ | 集合点 |
| `events[].meet.address` | 🟡 | 详细地址 |
| `events[].meet.lng/lat` | 🟡 | 坐标，null 时地图会提示 |
| `events[].starbucks.*` | 🟡 | 旁边星巴克 |
| `events[].route` | 🟡 | 路线描述 |
| `events[].note` | 🟡 | 备注 |
| `events[].attendees` | 🟡 | 历史活动到场人数 |
| `events[].weather` | 🟡 | 历史活动天气 |

---

## 常见问题

**Q1. 我改了 events.json，群里打开的还是旧版？**
A. Cloudflare 部署需要 30~60 秒。等一下刷新，或在 https://dash.cloudflare.com/ → Pages → 项目 → **Deployments** 查看部署状态。

**Q2. 坐标填错了/没填，地图怎么显示？**
A. 如果 `lng/lat` 为 `null`，地图区会变成"暂无地图数据"提示，导航按钮也无效。
   你需要本地跑一次 `python3 scripts/geocode_events.py`（需要 $AMAP_KEY）填充坐标后再推送。

**Q3. 微信里打开链接提示"该网页可能存在风险"？**
A. Cloudflare Pages 子域名 `*.pages.dev` 在微信里偶尔会被风控。
   解决方案：(a) 绑定自定义域名（最优）；(b) 在群里丢链接时让跑友"长按 → 复制到浏览器打开"。

**Q4. 我没有高德 API Key 怎么办？**
A. 你已经有（在 amap-trip-planner 用）。直接复用同一个 Web Service 类型 key。
- 申请地址：https://console.amap.com/ → 应用 → 创建新应用 → 选 **Web Service API** 类型
- 免费层：5000 次/天，足够一个跑团用

**Q5. 可以多人同时编辑 events.json 吗？**
A. v1 不建议（JSON 文件并发会冲突）。建议：**群主独享编辑权**，其他跑友在群里报信息。

**Q6. 我想要"跑友报名"功能怎么办？**
A. v2 再加 Cloudflare Workers + D1/SQLite，跑友点按钮后写一条记录。v1 不做。

---

## 高级：自动化建议（v2）

- 群主每天 18:00 自动提醒："明天有 X 场活动，链接：..."（需要企微 / 服务号推送）
- 活动结束后自动归档到 `history`（基于 `date < today` 自动判断，v1 已经实现）
- 跑友一键分享某个活动链接到朋友圈（Open Graph 标签已经预留）

---

## 故障排查

部署成功后看到白屏？
1. 打开 https://run-spot-wechat.pages.dev/data/events.json 看是否能访问（应该返回 JSON）
2. Cloudflare Dashboard → Pages → 项目 → **Functions** 标签看有没有报错
3. 浏览器 Console（F12）看 JS 报错信息（最常见是路径问题，确保 `data/events.json` 在仓库根目录）