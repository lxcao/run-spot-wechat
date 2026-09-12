#!/usr/bin/env python3
"""
批量给 events.json 中的所有集合点和星巴克补坐标。

使用：需要 $AMAP_KEY（或 --key）。
    python3 scripts/geocode_events.py
    python3 scripts/geocode_events.py --key <your-key>
    python3 scripts/geocode_events.py --city 上海
    python3 scripts/geocode_events.py --dry-run      # 只打印，不写

依赖：高德 Web Service API（Web Service 类型 key）
"""
import argparse
import json
import os
import sys
import time
import urllib.parse
import urllib.request
from pathlib import Path

API_URL = "https://restapi.amap.com/v3/place/text"


def geocode_one(key: str, keyword: str, city: str, max_retry: int = 3) -> dict | None:
    params = {
        "key": key,
        "keywords": keyword,
        "city": city,
        "citylimit": "true",
        "extensions": "base",
        "offset": "5",
    }
    url = f"{API_URL}?{urllib.parse.urlencode(params)}"
    req = urllib.request.Request(url, headers={"User-Agent": "run-spot-wechat/1.0"})
    for attempt in range(max_retry):
        try:
            with urllib.request.urlopen(req, timeout=15) as r:
                data = json.loads(r.read())
        except Exception as exc:
            print(f"    ⚠️  网络错误: {exc}", file=sys.stderr)
            return None
        if data.get("status") == "1":
            pois = data.get("pois") or []
            return pois[0] if pois else None
        info = data.get("info", "")
        if "CUQPS" in info or "OVER_LIMIT" in info:
            wait = 2 ** attempt  # 1, 2, 4 秒
            print(f"    ⏳ QPS 超限，等 {wait}s 后重试 ({attempt + 1}/{max_retry})")
            time.sleep(wait)
            continue
        print(f"    ⚠️  API 错误: {info}", file=sys.stderr)
        return None
    return None


def resolve_key(arg_key: str | None) -> str | None:
    return arg_key or os.environ.get("AMAP_KEY")


def main() -> None:
    parser = argparse.ArgumentParser(description="批量给 events.json 补高德坐标")
    parser.add_argument("--data", default="./data/events.json", help="events.json 路径")
    parser.add_argument("--city", default="上海", help="默认城市")
    parser.add_argument("--key", help="高德 Web Service API key")
    parser.add_argument("--dry-run", action="store_true", help="只打印要查的地址，不写文件")
    parser.add_argument("--force", action="store_true", help="强制重新查询已有坐标的地址")
    parser.add_argument("--sleep", type=float, default=0.4, help="每次查询间隔秒数（避免 QPS 超限）")
    args = parser.parse_args()

    key = resolve_key(args.key)
    if not key:
        print("⚠️  未找到 AMAP_KEY，跳过坐标填充。")
        print("   启动方式：export AMAP_KEY=你的key  或  python3 scripts/geocode_events.py --key 你的key")
        return

    data_path = Path(args.data)
    if not data_path.exists():
        print(f"❌ 找不到 {data_path}", file=sys.stderr)
        sys.exit(2)

    data = json.loads(data_path.read_text(encoding="utf-8"))
    city = data.get("team", {}).get("city") or args.city

    changes = 0
    skips = 0
    fails = 0

    for event in data.get("events", []):
        eid = event.get("id", "?")
        for field in ("meet", "starbucks"):
            target = event.get(field)
            if not target or not target.get("name"):
                continue
            if not args.force and target.get("lng") and target.get("lat"):
                skips += 1
                continue
            name = target["name"]
            print(f"  → [{eid}] {field}: {name}")
            top = geocode_one(key, name, city)
            time.sleep(args.sleep)
            if not top:
                fails += 1
                print(f"     ❌ 无匹配，请检查名称")
                continue
            loc = top.get("location", "")
            try:
                lng, lat = (float(x) for x in loc.split(","))
            except (ValueError, AttributeError):
                fails += 1
                print(f"     ❌ location 格式错误: {loc!r}")
                continue
            target["lng"] = lng
            target["lat"] = lat
            target["poiid"] = top.get("id", "")
            if not target.get("address"):
                target["address"] = top.get("address", "") or top.get("business", "")
            changes += 1
            print(f"     ✓ {top.get('name')} ({lng:.5f}, {lat:.5f})  poiid={top.get('id','')}")

    if args.dry_run:
        print("\n[DRY-RUN] 未写入文件")
    else:
        data_path.write_text(
            json.dumps(data, ensure_ascii=False, indent=2) + "\n",
            encoding="utf-8",
        )
        print(f"\n✅ 已更新 {data_path}（{changes} 条新增，{skips} 条跳过，{fails} 条失败）")


if __name__ == "__main__":
    main()