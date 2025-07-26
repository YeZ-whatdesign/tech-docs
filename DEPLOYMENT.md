# 技术文档系统 PM2 部署方案

## 概述

本文档描述了技术文档系统的 PM2 部署方案，包括完整的部署配置和管理脚本。

## 系统架构

技术文档系统包含三个主要组件：

1. **后端服务** (tech-docs-backend) - 端口 3006
   - 提供 API 接口
   - 处理文档管理和认证

2. **管理后台** (tech-docs-admin) - 端口 3005  
   - 文档编辑和管理界面
   - 用户认证和权限管理

3. **文档查看器** (tech-docs-viewer) - 端口 3007
   - 公开的文档浏览界面
   - 响应式设计，支持移动端

## 部署配置

### 1. PM2 配置

已在 `quick-deploy.sh` 中添加了以下 PM2 节点配置：

```javascript
{
  name: 'tech-docs-backend',
  script: 'server/index.js',
  cwd: '/home/whattech/apps/tech-docs',
  instances: 1,
  exec_mode: 'fork',
  env_production: {
    NODE_ENV: 'production',
    PORT: 3006
  }
},
{
  name: 'tech-docs-admin',
  script: 'node_modules/.bin/vite',
  args: 'preview --port 3005 --host 0.0.0.0',
  cwd: '/home/whattech/apps/tech-docs'
},
{
  name: 'tech-docs-viewer',
  script: 'node_modules/.bin/vite', 
  args: 'preview --port 3007 --host 0.0.0.0',
  cwd: '/home/whattech/apps/tech-docs/docs-viewer'
}
```

### 2. Nginx 配置

已在 `nginx.conf` 中添加了 `docs.what-tech.cn` 的代理配置：

```nginx
server {
    listen 80;
    server_name docs.what-tech.cn;
    
    # 管理后台 - 代理到3005端口
    location /admin/ {
        proxy_pass http://127.0.0.1:3005/;
    }
    
    # API代理到技术文档后端 (3006端口)
    location /api/ {
        proxy_pass http://127.0.0.1:3006;
    }
    
    # 文档查看器 - 代理到3007端口 (默认路径)
    location / {
        proxy_pass http://127.0.0.1:3007;
    }
}
```

## 部署步骤

### 1. 自动部署

运行完整部署脚本：

```bash
chmod +x /d:/project/what-tech/website/quick-deploy.sh
./quick-deploy.sh
```

### 2. 手动部署技术文档系统

如果只需要部署技术文档系统：

```bash
# 1. 复制项目文件
cp -r /path/to/tech-docs /home/$(whoami)/apps/

# 2. 构建项目
cd /home/$(whoami)/apps/tech-docs
chmod +x build-production.sh
./build-production.sh

# 3. 启动服务
pm2 start ecosystem.config.js --env production
pm2 save
```

## 管理命令

### 启动服务

```bash
# 启动所有服务
/home/$(whoami)/scripts/start-all.sh

# 或单独启动技术文档系统
cd /home/$(whoami)/apps/tech-docs
pm2 start ecosystem.config.js --env production
```

### 停止服务

```bash
# 停止所有服务
/home/$(whoami)/scripts/stop-all.sh

# 或单独停止技术文档系统
pm2 stop tech-docs-backend tech-docs-admin tech-docs-viewer
```

### 查看状态

```bash
# 查看所有服务状态
/home/$(whoami)/scripts/status.sh

# 或查看PM2状态
pm2 status
pm2 logs tech-docs-backend
```

### 重启服务

```bash
# 重启技术文档系统
pm2 restart tech-docs-backend tech-docs-admin tech-docs-viewer

# 或重新加载配置
pm2 reload ecosystem.config.js --env production
```

## 访问地址

### 生产环境

- **技术文档查看**: http://docs.what-tech.cn
- **管理后台**: http://docs.what-tech.cn/admin
- **API接口**: http://docs.what-tech.cn/api

### 开发/测试环境

- **后端服务**: http://localhost:3006
- **管理后台**: http://localhost:3005  
- **文档查看器**: http://localhost:3007

## 日志管理

日志文件位置：

```
/home/$(whoami)/logs/
├── tech-docs-backend-combined.log
├── tech-docs-backend-out.log
├── tech-docs-backend-error.log
├── tech-docs-admin-combined.log
├── tech-docs-admin-out.log
├── tech-docs-admin-error.log
├── tech-docs-viewer-combined.log
├── tech-docs-viewer-out.log
└── tech-docs-viewer-error.log
```

查看日志：

```bash
# 实时查看所有日志
pm2 logs

# 查看特定服务日志
pm2 logs tech-docs-backend

# 查看错误日志
tail -f /home/$(whoami)/logs/tech-docs-backend-error.log
```

## 环境变量

后端服务环境变量 (`server/.env`)：

```env
NODE_ENV=production
PORT=3006
JWT_SECRET=your-secret-key
UPLOAD_PATH=./uploads
```

## 故障排除

### 1. 服务无法启动

```bash
# 检查端口占用
netstat -tuln | grep -E ":(3005|3006|3007)"

# 检查PM2状态
pm2 status

# 查看错误日志
pm2 logs tech-docs-backend --err
```

### 2. 代理错误

```bash
# 检查Nginx配置
sudo nginx -t

# 重启Nginx
sudo systemctl restart nginx

# 检查服务是否运行
curl http://localhost:3006/api/health
```

### 3. 构建失败

```bash
# 清理并重新构建
cd /home/$(whoami)/apps/tech-docs
rm -rf node_modules dist docs-viewer/dist
npm install
./build-production.sh
```

## 安全注意事项

1. **更改默认密码**: 部署后立即更改所有默认密码
2. **SSL证书**: 生产环境建议配置HTTPS
3. **防火墙**: 确保只开放必要的端口
4. **备份**: 定期备份数据和配置文件

## 更新部署

```bash
# 1. 停止服务
pm2 stop tech-docs-backend tech-docs-admin tech-docs-viewer

# 2. 更新代码
cd /home/$(whoami)/apps/tech-docs
git pull origin main  # 或复制新版本文件

# 3. 重新构建
./build-production.sh

# 4. 启动服务
pm2 start ecosystem.config.js --env production
```

## 监控和维护

建议设置以下监控：

1. **服务状态监控**: 使用PM2的监控功能
2. **日志轮转**: 配置logrotate防止日志文件过大
3. **性能监控**: 监控内存和CPU使用情况
4. **备份策略**: 定期备份文档数据和配置

---

**部署完成后，请确保：**

1. ✅ 所有服务正常运行
2. ✅ 域名解析正确配置
3. ✅ 防火墙规则已设置
4. ✅ SSL证书已配置（推荐）
5. ✅ 监控和备份已设置