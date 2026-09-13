#!/usr/bin/env bash
# ============================================================
# 同步 H5 项目 data/events.json 到：
#   1. data/cloud-import.json （云数据库导入文件，.json + JSON Lines）
#
# 注意：
#   - 微信小程序 v2 不再 require 本地数据，全部走云函数 + 云数据库
#   - 所以不需要生成 miniprogram/data/events.js
#   - 只需要生成云数据库导入文件
#
# 数据流：
#   data/events.json (源)
#     ↓ sync-events.sh
#     ↓
#   data/cloud-import.json (5 条活动，JSON Lines)
#     ↓
#   用户手动导入到云开发 NoSQL 集合
# ============================================================
set -e

cd "$(dirname "$0")/.."

SRC="data/events.json"
DST_CLOUD="data/cloud-import.json"

if [ ! -f "$SRC" ]; then
    echo "❌ 找不到 $SRC"
    exit 1
fi

# 1. 生成云数据库导入文件（JSON Lines 格式，.json 后缀）
python3 - "$SRC" "$DST_CLOUD" << 'PYEOF'
import json, sys

src_path, dst_path = sys.argv[1], sys.argv[2]

with open(src_path, encoding="utf-8") as f:
    data = json.load(f)

with open(dst_path, "w", encoding="utf-8") as f:
    for e in data["events"]:
        record = {
            "id": e["id"],
            "title": e.get("title"),
            "date": e["date"],
            "weekday": e.get("weekday"),
            "time": e.get("time"),
            "status": e.get("status"),
            "meet": e["meet"],
            "starbucks": e.get("starbucks"),
            "route": e.get("route"),
            "note": e.get("note"),
            "attendees": e.get("attendees"),
            "weather": e.get("weather"),
        }
        f.write(json.dumps(record, ensure_ascii=False) + "\n")

print(f"  ✓ 转换 {src_path} → {dst_path} (JSON Lines 格式)")
PYEOF

echo ""
echo "✅ 同步完成"
echo ""
echo "接下来："
echo "  1. 在微信开发者工具里点编辑器刷新（⌘R）"
echo "  2. 重新上传 getEvents 云函数（让 team 从云数据库读）"
echo "  3. 在云开发控制台创建 team 集合 + 导入 data/team-import.json"
echo "  4. 在云开发控制台 events 集合里也可以重新导入 data/cloud-import.json"
echo ""
echo "如果改了 H5 那边的 data/events.json 想让小程序也生效，跑："
echo "  bash scripts/sync-events.sh"