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
    }
  ]
};