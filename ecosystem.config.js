/**
 * NEXUS FIELD NINE - PM2 Ecosystem Configuration
 * Phase 32: System Hardening
 *
 * Production-Grade Autonomous Operation
 * - Revenue Tracker: 60s interval Supabase monitoring
 * - Health Monitor: 30s interval system health check
 */

const path = require('path');

module.exports = {
  apps: [
    // ═══════════════════════════════════════════════════════════
    // Revenue Tracker - Real-time Supabase Revenue Monitoring
    // ═══════════════════════════════════════════════════════════
    {
      name: 'fieldnine-revenue',
      script: 'scripts/revenue_tracker_runner.js',
      cwd: __dirname,
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '200M',
      min_uptime: '10s',
      max_restarts: 10,
      restart_delay: 5000,
      env: {
        NODE_ENV: 'production',
        REVENUE_POLL_INTERVAL: 60,
        ESTIMATED_OPERATING_COST: 150.50,
      },
      error_file: path.join(__dirname, 'logs', 'revenue-error.log'),
      out_file: path.join(__dirname, 'logs', 'revenue-out.log'),
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
    },

    // ═══════════════════════════════════════════════════════════
    // Health Monitor - System Status Checker
    // ═══════════════════════════════════════════════════════════
    {
      name: 'fieldnine-health',
      script: 'scripts/health_monitor.js',
      cwd: __dirname,
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '150M',
      min_uptime: '10s',
      max_restarts: 10,
      restart_delay: 3000,
      env: {
        NODE_ENV: 'production',
        HEALTH_CHECK_INTERVAL: 30000,
        HEALTH_FRONTEND_URL: process.env.HEALTH_FRONTEND_URL || 'https://field-nine.vercel.app',
      },
      error_file: path.join(__dirname, 'logs', 'health-error.log'),
      out_file: path.join(__dirname, 'logs', 'health-out.log'),
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
    },
  ],

  // ═══════════════════════════════════════════════════════════
  // Deployment Configuration (PM2 Deploy)
  // ═══════════════════════════════════════════════════════════
  deploy: {
    production: {
      user: process.env.DEPLOY_USER || 'polor',
      host: process.env.DEPLOY_HOST || 'localhost',
      ref: 'origin/main',
      repo: 'https://github.com/kongks5798-coder/field-nine-solutions.git',
      path: process.env.DEPLOY_PATH || '/home/polor/field-nine-solutions',
      'pre-deploy': 'git fetch --all',
      'post-deploy': [
        'npm install --production',
        'mkdir -p logs',
        'pm2 reload ecosystem.config.js --env production',
        'pm2 save',
      ].join(' && '),
      env: {
        NODE_ENV: 'production',
      },
    },
  },
};
