#!/usr/bin/env bash
# ============================================================
# 甲骨文魔都跑团 · 一键 git 初始化
#
# 用法：
#   1. 先在 GitHub 网页创建空仓库（不要勾 README/.gitignore/license）
#      https://github.com/new  → repo name: run-spot-wechat → Public
#   2. 在终端跑：
#      cd /Users/billcao/Documents/workspaces/ai-projects/deepseek-projects/run-spot-wechat
#      bash scripts/setup-git.sh
#   3. 按提示输入你的 GitHub 用户名
# ============================================================

set -e

cd "$(dirname "$0")/.."

echo "🏃 甲骨文魔都跑团 · git 初始化脚本"
echo ""

# 检查 git
if ! command -v git >/dev/null 2>&1; then
    echo "❌ 未找到 git，请先安装：brew install git"
    exit 1
fi

# 检查是否已是 git 仓库
if [ -d .git ]; then
    echo "⚠️  这个目录已经是 git 仓库了（.git 已存在）"
    echo "   如果想重新初始化，请删除 .git 后再跑：rm -rf .git"
    exit 1
fi

# 检查 GitHub 用户名
read -p "👉 你的 GitHub 用户名是？: " GH_USER
if [ -z "$GH_USER" ]; then
    echo "❌ 用户名不能为空"
    exit 1
fi

REPO_URL="https://github.com/${GH_USER}/run-spot-wechat.git"

# 配置 git 身份（如果还没配置）
if [ -z "$(git config --global user.email)" ]; then
    read -p "👉 你的 git 邮箱（GitHub 注册邮箱）: " GH_EMAIL
    git config --global user.email "$GH_EMAIL"
fi
if [ -z "$(git config --global user.name)" ]; then
    git config --global user.name "$GH_USER"
fi

# git init + 初始 commit
echo ""
echo "→ git init"
git init -q

echo "→ git add ."
git add .

echo "→ git commit"
git commit -q -m "init: 甲骨文魔都跑团 v1

- 主页 + 详情页（SPA，hash 路由）
- 高德地图 + 双 pin（集合点 + 星巴克）
- 5 条种子活动（含用户提供的 4 条 + 1 条示例）
- 部署文档（Cloudflare Pages）
- 群主编辑指南"

echo "→ git branch -M main"
git branch -M main

echo "→ git remote add origin $REPO_URL"
git remote add origin "$REPO_URL"

# 检查远端仓库是否存在
echo ""
echo "→ 验证 GitHub 仓库可访问..."
if git ls-remote "$REPO_URL" >/dev/null 2>&1; then
    echo "✓ 仓库可访问"
else
    echo "⚠️  无法访问 $REPO_URL"
    echo "   请确认你已在 GitHub 创建了 run-spot-wechat 仓库（Public）"
    echo "   https://github.com/new"
    exit 1
fi

echo "→ git push -u origin main"
git push -u origin main

echo ""
echo "✅ 完成！代码已推送到 GitHub"
echo ""
echo "下一步：到 Cloudflare Pages 接 GitHub"
echo "  1. 登录 https://dash.cloudflare.com/"
echo "  2. Workers & Pages → Create application → Pages → Connect to Git"
echo "  3. 选 run-spot-wechat 仓库 → Begin setup"
echo "  4. Build command/output/root 都留空 → Save and Deploy"
echo "  5. 等 30 秒，拿到 https://run-spot-wechat.pages.dev/"
echo ""
echo "把这个链接丢到跑团群，跑友就能在微信里点开看本周活动了 🎉"