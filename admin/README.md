# 跑团后台管理系统

> 跑团微信小程序 + H5 的后台管理 Web
>
> 部署在同一个 CloudBase 环境（`run-spot-prod`）

## 🎯 功能

- 🔐 管理员登录（openid 验证）
- 📅 活动列表 / 删除（含云存储照片清理）
- 📊 数据统计
- 🖼️ 照片管理（后续）

## 📁 目录结构

```
admin/
├── index.html              # 登录页
├── events.html             # 活动管理
├── README.md               # 本文件
└── cloudfunctions/         # 后端云函数（HTTP 触发）
    ├── adminLogin/         # 校验 openid 是否 admin
    ├── adminListEvents/    # 拉取活动列表
    ├── adminDeleteEvent/   # 删除活动 + 清理照片
    └── adminGetStats/       # 数据统计
```

## 🚀 部署步骤

### 1. 上传 4 个云函数

在 `admin/cloudfunctions/` 目录下，**每个子目录都右键 → 上传并部署**：
- `adminLogin`
- `adminListEvents`
- `adminDeleteEvent`
- `adminGetStats`

### 2. 配置 HTTP 触发器

**关键步骤**！每个云函数都要：

1. 云开发控制台 → `run-spot-prod` 环境 → **云函数** → 找到对应云函数
2. 点云函数名 → **函数配置** → **HTTP 触发器** 标签
3. **启用** HTTP 触发器
4. 路径填：
 - `adminLogin` → `/adminLogin`
 - `adminListEvents` → `/adminListEvents`
 - `adminDeleteEvent` → `/adminDeleteEvent`
 - `adminGetStats` → `/adminGetStats`
5. 保存

### 3. 部署静态页面

在 `admin/` 目录下：

```bash
# 登录 CloudBase CLI
tcb login

# 部署
tcb hosting:deploy . -e run-spot-prod
```

### 4. 绑定域名（备案后）

1. CloudBase 控制台 → `run-spot-prod` → **静态托管** → **自定义域名**
2. 添加 `oracle.run.caolingxin.cn`（备案后）
3. 5 分钟生效

## 📋 部署架构

```
oracle.run.caolingxin.cn
└── /admin/                 → 静态托管（admin/ 目录）
    ├── index.html          → 登录页
    └── events.html         → 活动管理

HTTP API（自动路由）：
POST /adminLogin           → 校验 openid
POST /adminListEvents      → 活动列表
POST /adminDeleteEvent     → 删除活动
POST /adminGetStats        → 统计
```

## 🔐 权限管理

管理员 openid 列表存储在 `team` 集合的 `admins` 数组字段里。

**添加管理员**：
1. 管理员打开小程序 → ⚙️ 配置 → "未授权"页显示自己的 openid
2. 管理员把自己的 openid 发给群主
3. 群主在云开发控制台 → 数据库 → `team` 集合 → `id='meta'` 记录
4. 加 `admins` 数组字段，添加新的 openid

**登录流程**：
1. 管理员访问 `https://oracle.run.caolingxin.cn/admin/`
2. 输入自己的 openid
3. 调 `adminLogin` 云函数 → 校验是否在 admins 列表
4. 通过 → 跳转到活动管理页

## 🛠️ 本地开发

```bash
# 用 Python 启动本地预览
cd admin
python3 -m http.server 8082

# 浏览器打开
# http://127.0.0.1:8082

# 注意：本地没法直接调云函数（需要 HTTPS + 备案域名）
# 调试时用 CloudBase 测试域名部署
```

## 🆘 故障排查

| 问题 | 解决 |
|---|---|
| 登录提示"未授权" | 确认 openid 在 `team.admins` 列表 |
| 登录按钮没反应 | 浏览器 Console 看 fetch 错误 |
| HTTP 404 | CloudBase 没配 HTTP 触发器 |
| CORS 错误 | CloudBase 默认允许 CORS，或在控制台加 |
| 活动删除失败 | 检查云函数 adminDeleteEvent 是否部署 |

## 🔄 后续功能

- 活动编辑表单（当前只能删除，不能编辑）
- 照片批量管理
- 跑友成员管理
- 数据导出（CSV）
- 报名审核