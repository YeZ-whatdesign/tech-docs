#!/bin/bash

# 技术文档系统生产环境构建脚本
echo "开始构建技术文档系统..."

# 检查是否在正确的目录
if [ ! -f "package.json" ]; then
    echo "错误: 请在tech-docs项目根目录下运行此脚本"
    exit 1
fi

# 1. 安装依赖
echo "1. 安装主项目依赖..."
npm install
if [ $? -ne 0 ]; then
    echo "错误: 主项目依赖安装失败"
    exit 1
fi

# 2. 构建管理后台
echo "2. 构建管理后台..."
npm run build
if [ $? -ne 0 ]; then
    echo "错误: 管理后台构建失败"
    exit 1
fi

# 3. 构建文档查看器
echo "3. 构建文档查看器..."
if [ -d "docs-viewer" ]; then
    cd docs-viewer
    
    # 安装文档查看器依赖
    echo "安装文档查看器依赖..."
    npm install
    if [ $? -ne 0 ]; then
        echo "错误: 文档查看器依赖安装失败"
        exit 1
    fi
    
    # 构建文档查看器
    echo "构建文档查看器..."
    npm run build
    if [ $? -ne 0 ]; then
        echo "错误: 文档查看器构建失败"
        exit 1
    fi
    
    cd ..
else
    echo "警告: docs-viewer目录不存在"
fi

# 4. 创建生产环境配置
echo "4. 创建生产环境配置..."
if [ ! -f "server/.env" ]; then
    cat > server/.env << EOF
NODE_ENV=production
PORT=3006
JWT_SECRET=$(openssl rand -hex 32)
UPLOAD_PATH=./uploads
EOF
    echo "✓ 生产环境配置文件已创建"
else
    echo "✓ 生产环境配置文件已存在"
fi

# 5. 创建上传目录
echo "5. 创建必要目录..."
mkdir -p server/uploads
mkdir -p logs

# 6. 设置权限
echo "6. 设置文件权限..."
chmod -R 755 dist/
chmod -R 755 docs-viewer/dist/
chmod -R 755 server/

echo
echo "✅ 技术文档系统构建完成！"
echo
echo "📁 构建产物："
echo "- 管理后台: ./dist/"
echo "- 文档查看器: ./docs-viewer/dist/"
echo "- 后端服务: ./server/"
echo
echo "🚀 启动命令："
echo "- 开发环境: npm run dev:all"
echo "- 生产环境: 使用PM2配置启动"
echo
echo "📋 端口配置："
echo "- 后端服务: 3006"
echo "- 管理后台: 3005"
echo "- 文档查看器: 3007"
echo
echo "构建完成时间: $(date)"