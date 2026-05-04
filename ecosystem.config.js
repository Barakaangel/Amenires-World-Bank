module.exports = {
  apps: [
    {
      name: 'bank-api',
      script: './server.js',
      instances: 'max',
      exec_mode: 'cluster',
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'development',
        PORT: 3000
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      // Log configuration
      error_file: './logs/pm2-error.log',
      out_file: './logs/pm2-out.log',
      log_file: './logs/pm2-combined.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      
      // Auto restart configuration
      autorestart: true,
      watch: false,
      max_restarts: 10,
      min_uptime: '10s',
      restart_delay: 4000,
      
      // Process management
      kill_timeout: 5000,
      wait_ready: true,
      listen_timeout: 10000,
      
      // Graceful shutdown
      shutdown_with_message: true,
      time: true,
      
      // Monitoring
      pmx: true,
      instance_var: 'INSTANCE_ID',
      
      // Additional options
      node_args: '--max-old-space-size=512',
      exp_backoff_restart_delay: 100
    }
  ],
  
  deploy: {
    production: {
      user: 'node',
      host: 'your-server-ip',
      ref: 'origin/master',
      repo: 'git@github.com:yourusername/bank-api.git',
      path: '/var/www/bank-api',
      'pre-deploy-local': '',
      'post-deploy': 'npm install && pm2 reload ecosystem.config.js --env production',
      'pre-setup': ''
    },
    staging: {
      user: 'node',
      host: 'staging-server-ip',
      ref: 'origin/develop',
      repo: 'git@github.com:yourusername/bank-api.git',
      path: '/var/www/bank-api-staging',
      'post-deploy': 'npm install && pm2 reload ecosystem.config.js --env production'
    }
  }
};
