module.exports = {
  apps: [
    {
      name: 'tech-docs-backend',
      script: 'server/index.js',
      cwd: '/home/root/apps/tech-docs',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'development',
        PORT: 3006
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3006
      },
      log_file: '/home/whattech/logs/tech-docs-backend-combined.log',
      out_file: '/home/whattech/logs/tech-docs-backend-out.log',
      error_file: '/home/whattech/logs/tech-docs-backend-error.log',
      max_memory_restart: '512M',
      watch: false,
      ignore_watch: ['node_modules', 'logs', 'uploads'],
      restart_delay: 4000
    },
    {
      name: 'tech-docs-admin',
      script: 'node_modules/.bin/vite',
      args: 'preview --port 3005 --host 0.0.0.0',
      cwd: '/home/root/apps/tech-docs',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'development'
      },
      env_production: {
        NODE_ENV: 'production'
      },
      log_file: '/home/whattech/logs/tech-docs-admin-combined.log',
      out_file: '/home/whattech/logs/tech-docs-admin-out.log',
      error_file: '/home/whattech/logs/tech-docs-admin-error.log',
      max_memory_restart: '256M',
      watch: false,
      restart_delay: 4000
    },
    {
      name: 'tech-docs-viewer',
      script: 'node_modules/.bin/vite',
      args: 'preview --port 3007 --host 0.0.0.0',
      cwd: '/home/root/apps/tech-docs/docs-viewer',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'development'
      },
      env_production: {
        NODE_ENV: 'production'
      },
      log_file: '/home/whattech/logs/tech-docs-viewer-combined.log',
      out_file: '/home/whattech/logs/tech-docs-viewer-out.log',
      error_file: '/home/whattech/logs/tech-docs-viewer-error.log',
      max_memory_restart: '256M',
      watch: false,
      restart_delay: 4000
    }
  ]
};