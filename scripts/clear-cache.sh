#!/bin/bash

echo "🧹 开始清理缓存..."

# 清理 Next.js 构建缓存
echo "📁 清理 Next.js 构建缓存..."
rm -rf .next
echo "✅ .next 目录已删除"

# 清理 npm 缓存
echo "📦 清理 npm 缓存..."
npm cache clean --force
echo "✅ npm 缓存已清理"

# 可选：重新安装依赖（取消注释下面的行来启用）
# echo "🔄 重新安装依赖..."
# rm -rf node_modules package-lock.json
# npm install

echo "🎉 缓存清理完成!"
echo "💡 现在可以运行 'npm run dev' 重启应用"