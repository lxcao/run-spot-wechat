# events.json 字段说明（给群主）

> 群主只需要编辑 `data/events.json` 一个文件。其他代码不需要动。

## 完整字段表

```json
{
  "team": {
    "name": "甲骨文魔都跑团",                        // 跑团名（必填）
    "slogan": "每个周末做回自己，八卦别人",          // 主页 slogan（必填）
    "logo": null,                                    // 可选，logo 图片 URL
    "city": "上海",                                  // 默认城市，geocode 用
    "default_meet_msg": "..."                        // 主页副标题（可选）
  },
  "events": [
    {
      "id": "2026-09-19",                            // ✅ 必填，唯一 ID，用日期
      "title": "徐汇滨江慢跑",                       // 活动标题
      "date": "2026-09-19",                          // ✅ 必填，ISO 日期
      "weekday": "周六",                             // 可选，留空自动算
      "time": "07:00",                               // ✅ 必填，集合时间
      "meet": {                                      // ✅ 必填，集合点
        "name": "星巴克（徐汇滨江店）",              // 集合点名
        "address": "上海市徐汇区龙腾大道 3222 号",   // 详细地址
        "lng": null,                                 // 经度（地理编码填充）
        "lat": null,                                 // 纬度（地理编码填充）
        "poiid": null                                // 高德 POI ID（可选）
      },
      "starbucks": {                                 // 旁边星巴克（可选）
        "name": "星巴克（徐汇滨江店）",
        "address": "...",
        "lng": null,
        "lat": null,
        "poiid": null
      },
      "route": "徐汇滨江绿地",                       // 路线描述
      "note": "穿跑团服装",                          // 备注
      "status": "upcoming",                          // 可选，自动判断
      "attendees": null,                             // 历史活动到场人数
      "weather": null                                // 历史活动天气
    }
  ]
}
```

## 群主每周三步操作

### Step 1. 在 GitHub 网页编辑 events.json

打开 `https://github.com/<your-user>/run-spot-wechat/edit/main/data/events.json`

把"本周活动"那条的 status 改成 `"past"`（活动结束后改），
然后**复制**整条，更新 `id` / `date` / `time` 等字段，做为下一场活动。

> ⚠️ JSON 语法严格：
> - 字符串必须用 **双引号**，不能用中文引号「」
> - 最后一个元素后面**不要**加逗号
> - 可以用 https://jsonlint.com/ 验证

### Step 2. 填坐标（仅新地址需要）

如果你用的新地址从没在 events.json 里出现过，需要"地理编码"拿到坐标。

**方式 A：本地跑脚本**（一次）
```bash
export AMAP_KEY=你的高德key
python3 scripts/geocode_events.py
git add data/events.json
git commit -m "geocode: 填充新地址坐标"
git push
```

**方式 B：手动查坐标**
打开 https://lbs.amap.com/console/show/picker 或在地图上点位置，复制 `lng, lat` 填进 JSON。

**方式 C：临时跳过坐标**
保留 `lng/lat = null`，地图区域会显示"暂无地图数据"，
但**导航按钮会失效**。等下个版本再加自动 geocode。

### Step 3. 提交 + 自动部署

在 GitHub 网页编辑器点 **Commit changes**，等 30~60 秒 Cloudflare 自动部署。

新活动链接：`https://run-spot-wechat.pages.dev/#/event/<id>`

## 添加/删除活动

- **新增**：在 `events` 数组里加一个对象（按日期顺序）
- **删除**：删除对应的那条（一般不用，活动会自动从"即将"移到"历史"）
- **修改**：直接编辑字段

## 常见错误

| 错误 | 现象 | 修复 |
|---|---|---|
| JSON 末尾多了逗号 | 页面空白 / Console 报错 | 去掉最后一个 `,` |
| 中文引号 | JSON 解析失败 | 全部用 `"..."` |
| 字段拼错 `lng` 写成 `lon` | 地图不显示 | 改回 `lng` |
| 日期格式 `2026-9-19` | 自动算星期不准 | 用 `2026-09-19` 两位数 |
| id 重复 | 只有一条显示 | 保证每个 id 唯一，建议用日期 |

## 示例：完整 events.json（5 条活动）

见仓库 `data/events.json` 实际内容。
复制整条 event 对象，改字段即可新增。