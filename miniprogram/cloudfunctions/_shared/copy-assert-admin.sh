#!/usr/bin/env bash
# miniprogram/cloudfunctions/_shared/copy-assert-admin.sh
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SRC="$ROOT/_shared/assertAdmin.js"
for fn in createEvent deleteEvent updateEventPhotos updateEvent deletePhoto; do
  dest="$ROOT/$fn"
  mkdir -p "$dest"
  cp "$SRC" "$dest/assertAdmin.js"
done
echo "copied assertAdmin.js into function folders"
