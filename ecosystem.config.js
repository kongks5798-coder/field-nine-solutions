module.exports = {
  apps: [
    {
      name: 'fieldnine-revenue',
      script: 'scripts/revenue_tracker.py',
      interpreter: 'C:\\Users\\polor\\AppData\\Local\\Microsoft\\WindowsApps\\python3.exe',
      cwd: 'C:\\Users\\polor\\field-nine-solutions',
      watch: false,
      autorestart: true,
      max_restarts: 10,
      env: {
        NODE_ENV: 'production'
      }
    }
  ]
};
