module.exports = {
  apps: [{
    name: 'leetcode-76-viz',
    script: 'node_modules/.bin/vite',
    args: '--host 127.0.0.1 --port 48844',
    cwd: '/Users/cc11001100/github/fuck-algorithm/leetcode-76-minimum-window-substring',
    instances: 1,
    autorestart: true,
    watch: true,
    max_memory_restart: '1G',
    max_size: '50M',
    env: {
      NODE_ENV: 'development'
    },
    log_file: 'logs/combined.log',
    out_file: 'logs/out.log',
    error_file: 'logs/error.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
  }]
};
