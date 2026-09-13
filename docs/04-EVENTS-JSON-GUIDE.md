# 活动数据字段说明（给群主）

> v2 架构：H5 读 `data/events.json`，小程序读云开发数据库。
> 这两个数据源是**并行**的，需要保持同步。

## 📋 数据源

| 平台 | 数据源 | 改法 |
|---|---|---|
| **H5 网页** | `data/events.json` | 编辑 JSON，跑 `sync-events.sh` |
| **小程序** | 云开发 → NoSQL 集合 `events` + `team` | 云开发控制台 → 数据库 |

**两份数据必须保持一致**——但因为 v2 的"小程序的 team 来自云数据库"，**主源应该是云开发控制台**。

---

## 📦 字段表（适用于 H5 和云数据库）

```json
{
  "team": {
    "name": "甲骨文魔都跑团",                  // 必填
    "slogan": "每个周末做回自己，八卦别人",     // 必填
    "city": "上海",                            // 必填
    "logo": null,                              // 可选
    "default_meet_msg": "周六早上 7:00 集合..."  // 必填
  },
  "events": [
    {
      "id": "2026-09-19",                     // 必填，唯一
      "title": "徐汇滨江慢跑",                 // 必填
      "date": "2026-09-19",                   // 必填，ISO 日期
      "weekday": "周六",                       // 可选，自动算
      "time": "07:00",                         // 必填，HH:MM
      "status": "upcoming",                    // 可选：upcoming / past
      "meet": {                                // 必填
        "name": "星巴克（徐汇滨江店）",
        "address": "...",
        "lng": 121.46,                         // 必填
        "lat": 31.18,                          // 必填
        "poiid": "B0XXX"                       // 可选
      },
      "starbucks": {                           // 可选
        "name": "...",
        "address": "...",
        "lng": 121.46,
        "lat": 31.18,
        "poiid": "B0XXX"
      },
      "route": "徐汇滨江绿地",                 // 可选
      "note": "穿跑团服装",                    // 可选
      "attendees": 8,                          // 历史活动必填
      "weather": "晴"                          // 历史活动可选
    }
  ]
}
```

---

## 🔄 群主每周操作（推荐流程）

### 路径 A：只在云开发控制台改（v2 主流）

1. 打开 https://console.cloud.tencent.com/tcb
2. 进入 `run-spot-prod` 环境 → 数据库 → `events` 集合
3. 找到要改的活动 → 点编辑
4. 或者点 **"+"** → 添加新活动
5. 保存 → **30 秒后跑友在小程序里看到** ✅
6. **不要忘了改 H5 的 `data/events.json` + 跑 `sync-events.sh`**

### 路径 B：改 H5 events.json（不推荐，只用于代码管理）

1. 编辑 `data/events.json`
2. 跑 `bash scripts/sync-events.sh` → 生成云数据库导入文件
3. 手动把 `data/cloud-import.json` 导入到云开发 NoSQL 集合
4. **不要忘了 H5 部署**

---

## 🛠️ 同步脚本

```bash
bash scripts/sync-events.sh
```

把 `data/events.json` 转成：
- `data/cloud-import.json`（活动列表，5 条 → 云数据库）
- `data/team-import.json`（跑团信息，1 条 → 云数据库）

---

## ⚠️ 常见错误

| 错误 | 现象 | 修复 |
|---|---|---|
| JSON 末尾多了逗号 | H5 页面空白 | 去掉最后一个 `,` |
| 中文引号 `""` | JSON 解析失败 | 全部用英文 `"..."` |
| 字段拼错 `lng` 写成 `lon` | 地图不显示 | 改回 `lng` |
| 日期格式 `2026-9-19` | 自动算星期不准 | 用 `2026-09-19` |
| id 重复 | 数据错乱 | 每个 id 唯一 |

---

## 💡 推荐策略

**v2 阶段**：在云开发控制台改活动（实时生效） → 偶尔同步到 `data/events.json` 给 H5 用
**v3 阶段**：写一个简单的"管理后台" Web 页面，统一改两个数据源