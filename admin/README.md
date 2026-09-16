# 网页后台 · 甲骨文魔都跑团

> 管理员用用户名密码登录后，对 CloudBase 里的活动做增删改查并管理照片。
>
> 与 `h5/`、`miniprogram/` 同级；部署到独立应用域名，**不覆盖** H5 静态托管。

---

## 🚀 本地开发

```bash
cd admin && npm install && npm run dev
```

默认打开 Vite 开发地址（通常 `http://localhost:5173`）。路由是 hash（`#/login`、`#/`、`#/events/new`、`#/events/:id`）。

---

## 🔑 环境变量

复制 `.env.example` 为 `.env.local`（已 gitignore，不要提交）：

```bash
VITE_CLOUDBASE_ENV_ID=run-spot-prod-d1gb2jd1j3ce2e7fb
VITE_CLOUDBASE_REGION=ap-shanghai
VITE_PUBLISHABLE_KEY=<从 CloudBase 控制台或 MCP getPublishableKey 获取>
```

| 变量 | 值 |
|---|---|
| `VITE_CLOUDBASE_ENV_ID` | `run-spot-prod-d1gb2jd1j3ce2e7fb` |
| `VITE_CLOUDBASE_REGION` | `ap-shanghai` |
| `VITE_PUBLISHABLE_KEY` | CloudBase 控制台「应用 / 安全配置」或 MCP `queryAppAuth(action="getPublishableKey")` |

本地开发还需把 `localhost:5173` 加进环境安全域名（CORS）。

---

## 🔐 登录

- **用户名 + 密码**（CloudBase Web Auth）。
- **没有注册入口**，也没有匿名登录。账号由群主在 CloudBase 控制台「用户管理」或 MCP `manageAppAuth(action="createUser")` 创建。
- 未登录访问任意非 login 路由 → 跳到 `#/login`。

---

## 👤 把 uid 加到 `team.webAdmins`

网站管理员和小程序管理员是两套名单：

| 字段 | 身份 | 用途 |
|---|---|---|
| `team.admins` | 微信 openid | 小程序 ⚙️ 配置页 |
| `team.webAdmins` | CloudBase uid | 本网页后台 |

一个人两边都用，要分别加 openid 和 uid。

**加新网站管理员：**

1. 用已创建的用户名密码登录。
2. uid 还不在 `webAdmins` 时，页面只显示 uid 和「复制 uid」，不进活动列表。
3. 把该 uid 写入 `team` 集合文档 `id: "meta"` 的 `webAdmins` 数组（**保留现有 `admins`**）：
   - 控制台：云数据库 → `team` → `id = meta` → 编辑 `webAdmins`，追加 uid。
   - MCP：`writeNoSqlDatabaseContent`，`action=update`，`query: { id: "meta" }`，`$set` 只改 `webAdmins`（点号路径，勿覆盖整个文档）。
4. 刷新页面即可进活动列表。

---

## 📦 部署

**必须**用 CloudBase **应用托管**，`serviceName=admin`（MCP `manageApps`）。

```
manageApps(
  action="deployApp",
  serviceName="admin",
  filePath="<repo>/admin",
  framework="static",
  installCmd="npm install",
  buildCmd="npm run build",
  buildPath="dist"
)
```

部署后默认地址：

**https://admin-run-spot-prod-d1gb2jd1j3ce2e7fb.webapps.tcloudbase.com**

把该站点 origin 加进环境安全域名（CORS），例如 `admin-run-spot-prod-d1gb2jd1j3ce2e7fb.webapps.tcloudbase.com:443`。

### 禁止

- **禁止** `tcb hosting:deploy` 把 `admin/` 发到现有 H5 静态托管桶。那会覆盖群通知页。
- H5 继续走原来的静态托管（`*.tcloudbaseapp.com`），本后台走独立应用域名。

### ICP / 自定义域名

`caolingxin.cn` **ICP 尚未完成**。本阶段 **不要** 绑定 `oracle.run.caolingxin.cn`。

备案通过后另开任务：证书 + `manageGateway bindCustomDomain` + DNS CNAME。在此之前管理员用上面的默认应用域名。

---

## 📁 目录

```
admin/
├── src/
│   ├── pages/            # 登录、未授权、活动列表、新建/编辑
│   ├── components/       # 高德地址联想、照片墙
│   └── lib/              # CloudBase SDK、鉴权、云函数封装
├── .env.example
└── README.md             # 本文件
```

写操作全部走云函数（`createEvent` / `updateEvent` / `deleteEvent` / `updateEventPhotos` / `deletePhoto`），浏览器不直接写 NoSQL。
