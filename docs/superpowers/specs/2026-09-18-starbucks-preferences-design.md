# 跑友星巴克口味备忘录（v6）设计

日期：2026-09-18  
状态：待实现  
环境：`run-spot-prod-d1gb2jd1j3ce2e7fb`（上海，个人版，NoSQL）

## 1. 问题

跑完到星巴克点咖啡和早餐很慢。团长想按跑友癖好提前点，但：

- 星巴克中国没有可用的公开菜单 API
- 小程序读不到微信群成员和群昵称
- 跑友端不做登录、也不自己登记

所以做成：**管理员在网页后台按群昵称代填口味，小程序只读展示。** 这是长期癖好备忘录，不是本场点单。

## 2. 范围

### 第一版做

- 全国通用星巴克菜单一份（饮品 + 餐食 + 饮品配置），来自 App 截图整理的 JSON
- 网页后台：跑友口味的增删改查（用户名密码，现有 `webAdmins`）
- 每人可挂多杯咖啡、多份餐，不限个数；每杯咖啡带配置（杯型、温度、奶、甜度等）
- 小程序首页入口「星巴克口味」：免登录只读名单
- 昵称由管理员按群名片填写，不用 openid

### 第一版不做

- 跑友自己登记 / 微信登录 / 读群成员
- 按门店区分菜单、价格、库存
- 本场点单、合计「拿铁 5 杯」、报名
- 菜单 CMS（改菜单 = 改 JSON 再导入）
- 餐食定制（截图没有配置页）
- H5 展示这份名单
- 小程序 ⚙️ 配置页管理跑友
- 软删 / 回收站
- 冰棒雪糕、月饼（截图未滚到列表）

## 3. 菜单来源

种子文件：[`data/starbucks-menu.json`](../../../data/starbucks-menu.json)

- 来源：2026-09-18 星巴克中国 App 截图（饮品列表、餐食列表、拿铁定制页）
- 已去掉价格和是否有货
- 约 93 款饮品、34 款餐食
- 同一饮品出现在多个分类时只留一条
- 配置组：杯型、店内用杯、温度、无糖风味、浓缩豆、萃取方式、浓缩份数、牛奶、奶泡、甜度

导入 CloudBase 集合 `starbucksMenu`，一条文档 `id: "current"`，内容即该 JSON。季节款：改仓库 JSON → 覆盖导入。后台不提供菜单编辑器。

## 4. 数据

现有环境新增两个集合，不改 `events` / `team.admins`。

### 4.1 `starbucksMenu`

```json
{
  "id": "current",
  "customizations": { "...": "见种子 JSON" },
  "drinks": [{ "id": "d-latte", "category": "浓缩咖啡", "name": "拿铁" }],
  "foods": [{ "id": "f-croissant", "category": "烘焙食品", "name": "法式香酥可颂" }]
}
```

### 4.2 `runners`

一条人一条。CloudBase 自动 `_id` 当文档主键；另存业务 `id`（`runner-` + 8 位小写字母数字），给后台路由用。生成碰撞则重试。

```json
{
  "id": "runner-a1b2c3d4",
  "nickname": "老张",
  "drinks": [
    {
      "itemId": "d-latte",
      "name": "拿铁",
      "options": [
        { "group": "cupSize", "id": "grande", "label": "大杯" },
        { "group": "temperature", "id": "iced", "label": "冰" },
        { "group": "milk", "id": "oat", "label": "燕麦奶" },
        { "group": "sweetness", "id": "unsweetened", "label": "不另外加糖" },
        { "group": "espressoShots", "id": "2", "label": "浓缩 2 份" }
      ]
    }
  ],
  "foods": [
    { "itemId": "f-croissant", "name": "法式香酥可颂" }
  ],
  "createdAt": "2026-09-18T12:00:00.000Z",
  "updatedAt": "2026-09-18T12:00:00.000Z"
}
```

约束：

- `nickname` 必填，trim 后非空；全库唯一（比较时忽略大小写和首尾空格）
- `drinks` / `foods` 可一边为空，不能两边都空
- 同一人可以挂两杯相同 `itemId`（配置不同也算两杯）
- `itemId` 必须存在于当前 `starbucksMenu`
- 写入时用当前菜单把 `name` 和每个 option 的 `label` 填上；以后改菜单不回写旧档案
- 非法 option（group/id 不在菜单里）直接丢掉；整杯可以只剩品名
- 餐食没有 `options`
- 删除 = 硬删文档

不存 openid、unionid、头像、价格。

## 5. 云函数

沿用 `assertAdmin`。写操作只认网页管理员（`kind === 'web'`），小程序 openid 管理员不能改口味名单。

| 函数 | 鉴权 | 作用 |
|---|---|---|
| `getStarbucksMenu` | 无 | 返回 `id = current` 的菜单 |
| `listRunners` | 无 | 返回全部跑友，按 `nickname` 的 `zh-CN` locale 排序 |
| `createRunner` | web 管理员 | 校验后插入 |
| `updateRunner` | web 管理员 | 按 `id` 更新；改昵称仍要过唯一校验 |
| `deleteRunner` | web 管理员 | 按 `id` 硬删 |

`listRunners` 原样返回已存的 `name` / `label`，小程序不再查菜单。

## 6. 页面

### 网页后台（现有 `admin/` HashRouter）

- `#/runners` 列表：昵称、咖啡数、餐食数；新增 / 编辑 / 删除
- `#/runners/new`、`#/runners/:id` 表单：昵称；添加咖啡（分类筛选 + 搜索品名 + 勾配置）；添加餐食（只选品名）
- 活动列表页加入口「跑友口味」
- 删除先确认：「确定删除某某？删除后需重新录入」

### 小程序

- 新页 `pages/runners/runners`，标题「星巴克口味」
- 首页品牌头下方、本周集合之前放入口卡片
- 每人一张卡片：昵称；咖啡行格式 `拿铁 · 大杯 · 冰 · 燕麦奶 · 不另外加糖`；餐食只出品名
- 只有咖啡或只有餐时，不显示空的那一组标题
- 空列表：「团长还没录入口味」

H5 不改。⚙️ 配置页不改。

## 7. 数据流

```
data/starbucks-menu.json
  → 导入 starbucksMenu (id=current)

管理员浏览器（已登录 webAdmins）
  → getStarbucksMenu（勾选）
  → createRunner / updateRunner / deleteRunner
  → runners

小程序（免登录）
  → listRunners
  → 只读卡片
```

浏览器不直接写 NoSQL。

## 8. 失败提示

| 情况 | 行为 |
|---|---|
| 后台未登录 / 不是 webAdmins | 现有未授权页，不写库 |
| 昵称为空 | 「请填写群昵称」 |
| 昵称重复 | 「已有同名跑友，请改成能区分的名字」 |
| 咖啡和餐都空 | 「至少添加一杯咖啡或一份餐」 |
| itemId 不在菜单 | 「菜单已更新，请重新选择」 |
| 配置项过期 | 丢掉非法项，品名仍保存 |
| 保存/删除网络失败 | 「保存失败，请重试」或「删除失败，请重试」，表单内容保留 |
| 小程序名单为空 | 「团长还没录入口味」 |
| 小程序读取失败 | 「名单暂时读不出来，请稍后重试」 |

## 9. 验收

1. 导入 JSON 后，后台能按分类勾选饮品和餐，咖啡能勾配置。
2. 同一人可挂多杯咖啡、多份餐；保存后再打开还在；中文 label 已写进文档。
3. 小程序不登录能看到全名单，配置显示中文，不是 `grande`。
4. 重名被拒绝；硬删后小程序立刻没有这个人。
5. 非 webAdmins 不能写入。
6. 活动、照片、H5、⚙️ 配置页行为不变。

不验收：库存、价格、本场合计、跑友自助改口味、H5 展示。
