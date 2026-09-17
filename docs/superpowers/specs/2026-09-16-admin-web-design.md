# 跑团网页后台（v5 重做）设计

日期：2026-09-16  
状态：已实现（托管在 `/admin/`，ICP 未完成前不绑自定义域名）  
环境：`run-spot-prod-d1gb2jd1j3ce2e7fb`（上海，个人版，NoSQL）  
域名目标：`oracle.run.caolingxin.cn`（`caolingxin.cn` 已购买，ICP 未完成）

## 1. 问题

小程序已能看活动、传照片、用 ⚙️ 配置页增删活动，但不能改活动、不能在电脑上管照片。  
上一版 v5（纯 HTML + 匿名登录 + 手塞 567KB SDK）已删除。失败点是身份：匿名 uid 和小程序 openid 不是同一套，SDK 也无法稳定加载。  
需要一个只有管理员能用的网站，基于现有 CloudBase 环境，不新开 CloudRun。

## 2. 范围

### 第一版做

- 用户名 + 密码登录（CloudBase Web Auth，无注册入口、无匿名）
- 活动增删改查
- 活动照片上传、删除
- 独立子域名发布；备案完成后再绑 `oracle.run.caolingxin.cn`

### 第一版不做

- 跑团成员管理
- 报名 / 打卡 / 排行
- H5 `events.json` 自动与云库同步
- 改小程序 ⚙️ 配置页（两边都留着）
- CloudRun / PostgreSQL

## 3. 目录

仓库根下与 `h5/`、`miniprogram/` 同级新增 `admin/`，不放进这两个目录里。

```
run-spot-wechat/
├── admin/              # 网页后台（本设计）
├── h5/                 # 群通知只读页，独立托管，本设计不改
├── miniprogram/        # 跑友端 + ⚙️ 配置页，写操作继续可用
├── data/
├── docs/
└── scripts/
```

`admin/` 技术选型：Vite + React + TypeScript + `@cloudbase/js-sdk`。路由用 hash（`#/login`、`#/events/:id`），避免静态托管 History 刷新 404。

## 4. 架构

三个前端共用同一个 CloudBase 环境：

| 端 | 职责 | 身份 |
|---|---|---|
| `admin/` | 管理员后台 | CloudBase uid（用户名密码） |
| `miniprogram/` | 跑友浏览/传照片；⚙️ 应急增删 | 微信 openid |
| `h5/` | 群链接只读 | 无登录 |

浏览器不直接写 NoSQL。读列表可以调现有 `getEvents`；所有写操作走云函数。  
网站部署到独立应用域名（`admin-<envId>.webapps.tcloudbase.com`），不覆盖 H5 的 `*.tcloudbaseapp.com`。

```
管理员浏览器
  → Vite 静态站（SDK 登录）
  → 云函数（assertAdmin）
  → events / team / 云存储 events/<活动id>/
```

## 5. 权限

### 数据

`team` 集合 `id: "meta"` 增加字段，不改现有 `admins` 语义：

```js
{
  id: "meta",
  admins: ["<小程序 openid>"],      // 现有，⚙️ 配置页用
  webAdmins: ["<CloudBase uid>"]    // 新增，网站用
}
```

两套身份并存。一个人若既用小程序又用网站，要分别加 openid 和 uid。

### 登录

- 开启状态（已核实）：`usernamePassword: true`，`anonymous: false`，邮箱未开。
- 网站只有登录表单，没有注册。账号由群主用控制台或 MCP `manageAppAuth` 创建。
- 路由守卫只用 `auth.getSession()`。`data.session` 为空则进 `/login`。禁止 `getLoginState()`，禁止匿名登录。

### 云函数 `assertAdmin()`

所有写函数（含现有 `createEvent` / `deleteEvent`，以及新建的 `updateEvent` / `deletePhoto`）共用：

1. 小程序调用：`cloud.getWXContext().OPENID` 在 `team.admins` 中 → 通过  
2. 网站调用：`@cloudbase/node-sdk` 的 `auth.getUserInfo().uid` 在 `team.webAdmins` 中 → 通过  
3. 都不中 → `{ code: -1, msg: "未授权" }`

`deleteEvent` 现有「权限检查 catch 后继续删除」必须改掉：检查失败一律拒绝。

`updateEventPhotos`：网站管理员上传时跳过「每人 9 张」；每场 100 张上限保留。小程序跑友逻辑不变。

### 新管理员

登录成功但不在 `webAdmins`：只显示 uid 和复制按钮，不进活动列表。群主把 uid 写入 `team.webAdmins` 后刷新即可。与小程序复制 openid 同一套路。

第一个账号在上线步骤里用 MCP 创建，并直接写入 `webAdmins`。

## 6. 页面

| 路由 | 作用 |
|---|---|
| `#/login` | 用户名、密码、登录。无注册。 |
| `#/` | 活动列表。筛选：全部 / 即将 / 历史。入口：新活动。卡片进编辑。 |
| `#/events/new` | 新建。字段与小程序配置页对齐：日期、时间、状态（自动/即将/历史）、集合点（高德联想）、星巴克、路线、备注。 |
| `#/events/:id` | 编辑同上，外加保存、删除活动、照片墙（上传 / 删单张）。 |

未登录访问非 login 路由 → `#/login`。  
已登录非管理员 → 停在「复制 uid」页。

主题沿用甲骨文红 `#C74634`、星巴克绿 `#006241`、背景 `#FAFAFA`。

## 7. 数据与云函数

活动文档结构不变。`id` 仍是日期 `YYYY-MM-DD`，同一天一场。编辑页不能改日期；要换日期只能删了再建。

| 函数 | 动作 | 第一版 |
|---|---|---|
| `getEvents` | 读全部 | 复用 |
| `getEvent` | 读单条 | 复用 |
| `getAddressSuggestions` | 高德联想 | 复用 |
| `createEvent` | 新建 | 复用 + `assertAdmin` 认 uid |
| `deleteEvent` | 删活动+照片 | 复用 + 修权限 catch + 认 uid |
| `updateEventPhotos` | 追加照片 | 复用 + 管理员跳过每人 9 张 |
| `updateEvent` | 改时间/地点/状态/备注等 | **新增** |
| `deletePhoto` | 删单张：数组去掉 + `cloud.deleteFile` | **新增** |

`updateEvent` 入参：`id` + 可改字段（`time`、`status`、`meet`、`starbucks`、`route`、`note`、`title`）。不可改 `id`/`date`。坐标优先用联想结果，否则 geocode，与 `createEvent` 相同。

线上残留的 `adminLogin`（上一版匿名登录）删除，不再使用。

云存储路径不变：`events/<eventId>/<date>_<random>_<n>.jpg`。  
`fileID` 展示前用 `getTempFileURL` 转 https。

## 8. 出错处理

- 未登录：跳转登录，不闪活动数据。
- 非管理员：只显示 uid，不调写函数。
- 云函数业务错误（未授权、当天已有活动、活动不存在、照片满 100）：表单/列表顶部展示 `msg` 原文，不改写成笼统「失败」。
- 多图上传：成功的留下，失败的按张提示。
- 删除活动、删除照片：二次确认。
- SDK / 网络失败：可重试，不静默吞掉。

## 9. 上线

1. 本地 `admin/` Vite 开发，登录 + 列表跑通。  
2. MCP 创建第一个用户名账号，将其 uid 写入 `team.webAdmins`。  
3. 部署云函数（`assertAdmin` 改造 + `updateEvent` + `deletePhoto`，删除 `adminLogin`）。  
4. 用 CloudBase **应用托管**（`manageApps`）发布 `admin/`，得到 `admin-run-spot-prod-d1gb2jd1j3ce2e7fb.webapps.tcloudbase.com`。禁止往现有 H5 静态桶根目录覆盖。  
5. 把该站点 origin 加进环境安全域名（CORS）。  
6. `caolingxin.cn` ICP 通过后：证书 + 网关绑定 `oracle.run.caolingxin.cn` 到该静态应用；DNS CNAME 指向 CloudBase 给出的目标。

在此之前，管理员用步骤 4 的默认域名使用后台。

## 10. 验证

- `admin/`：`tsc --noEmit` 与 `npm run build` 通过。  
- 浏览器：登录失败/成功、非管理员 uid 页、列表筛选、新建、编辑（含联想坐标）、删除活动、上传照片、删单张。  
- 小程序 ⚙️：原管理员仍能增删活动（openid 路径未坏）。  
- H5 默认域名仍可打开，内容不被 admin 部署覆盖。  
- 未登录调 `updateEvent` / `deletePhoto` 返回未授权。

## 11. 关键决策

| 决策 | 选择 | 原因 |
|---|---|---|
| 形态 | Vite 静态站 + Web SDK + 云函数 | 个人版够用；v5 失败在身份和 SDK，不在缺 Node 服务器 |
| 目录 | 根目录 `admin/`，与 h5、miniprogram 同级 | 三个独立子项目，部署互不影响 |
| 登录 | 用户名密码，无注册无匿名 | 环境已开启；避免再混用匿名 uid |
| 管理员名单 | `admins` + `webAdmins` | 小程序 openid 与网站 uid 不能当成同一个值 |
| 写路径 | 全部云函数 | 不把 NoSQL 写权限交给浏览器 |
| 路由 | hash | 静态托管无需 404 回退到 index.html |
| 域名 | 先默认应用域名，备案后再绑自定义域 | ICP 未完成 |
| 框架 | React + TS | CloudBase Web 默认栈，类型能兜住 SDK 边界 |
| 小程序配置页 | 保留 | 出门应急发活动 |

## 12. 实现顺序（实现计划另写，此处只定序）

1. `team.webAdmins` + 抽取 `assertAdmin`，修 `deleteEvent` 权限 catch  
2. `updateEvent`、`deletePhoto`；`updateEventPhotos` 管理员免每人限额  
3. 脚手架 `admin/`（Vite React TS、SDK init、登录守卫）  
4. 列表 / 新建 / 编辑 / 照片  
5. 部署独立子域名 + 写入第一个 webAdmin  
6. 备案后绑 `oracle.run.caolingxin.cn`（可单独做）
