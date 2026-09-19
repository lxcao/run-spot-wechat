#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cp "$ROOT/_shared/assertAdmin.js" "$ROOT/createEvent/assertAdmin.js"
cp "$ROOT/_shared/assertAdmin.js" "$ROOT/deleteEvent/assertAdmin.js"
cp "$ROOT/_shared/assertAdmin.js" "$ROOT/updateEventPhotos/assertAdmin.js"
cp "$ROOT/_shared/assertAdmin.js" "$ROOT/updateEvent/assertAdmin.js"
cp "$ROOT/_shared/assertAdmin.js" "$ROOT/deletePhoto/assertAdmin.js"
for fn in createRunner updateRunner deleteRunner listRunners; do
  mkdir -p "$ROOT/$fn"
  cp "$ROOT/_shared/assertAdmin.js" "$ROOT/$fn/assertAdmin.js"
  cp "$ROOT/_shared/menu.js" "$ROOT/$fn/menu.js"
  cp "$ROOT/_shared/runners.js" "$ROOT/$fn/runners.js"
done
echo "copied shared modules"
