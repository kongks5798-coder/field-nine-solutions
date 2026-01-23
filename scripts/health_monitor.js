/**
 * NEXUS FIELD NINE - Health Monitor
 * Autonomous System Health Checker
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

// Load environment variables
require('dotenv').config({
  path: path.join(__dirname, '..', '.env.production')
});

const HEALTH_FILE = path.join(__dirname, '..', 'public', 'health-status.json');
const CHECK_INTERVAL = parseInt(process.env.HEALTH_CHECK_INTERVAL) || 30000;

const services = {
  frontend: {
    name: 'Frontend (Vercel)',
    url: process.env.HEALTH_FRONTEND_URL || 'https://field-nine.vercel.app',
    status: 'unknown',
    lastCheck: null,
    responseTime: null
  },
  supabase: {
    name: 'Supabase DB',
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    status: 'unknown',
    lastCheck: null,
    responseTime: null
  },
  pm2: {
    name: 'PM2 Backend',
    status: 'unknown',
    lastCheck: null,
    processes: []
  },
  github: {
    name: 'GitHub Sync',
    status: 'unknown',
    lastCheck: null,
    lastCommit: null
  }
};

async function checkUrl(url) {
  return new Promise((resolve) => {
    // Validate URL first
    if (!url || url.includes('your_') || url.includes('placeholder') || !url.startsWith('http')) {
      resolve({
        status: 'unknown',
        responseTime: null,
        statusCode: 0
      });
      return;
    }

    try {
      const start = Date.now();
      const protocol = url.startsWith('https') ? https : http;

      const req = protocol.get(url, { timeout: 10000 }, (res) => {
        const responseTime = Date.now() - start;
        resolve({
          status: res.statusCode >= 200 && res.statusCode < 400 ? 'healthy' : 'degraded',
          responseTime,
          statusCode: res.statusCode
        });
      });

      req.on('error', () => {
        resolve({
          status: 'offline',
          responseTime: null,
          statusCode: 0
        });
      });

      req.on('timeout', () => {
        req.destroy();
        resolve({
          status: 'timeout',
          responseTime: null,
          statusCode: 0
        });
      });
    } catch (err) {
      resolve({
        status: 'offline',
        responseTime: null,
        statusCode: 0
      });
    }
  });
}

async function checkPM2() {
  return new Promise((resolve) => {
    const { exec } = require('child_process');
    exec('pm2 jlist', (error, stdout) => {
      if (error) {
        resolve({ status: 'offline', processes: [] });
        return;
      }
      try {
        const processes = JSON.parse(stdout);
        const healthy = processes.filter(p => p.pm2_env.status === 'online').length;
        const total = processes.length;
        resolve({
          status: healthy === total ? 'healthy' : healthy > 0 ? 'degraded' : 'offline',
          processes: processes.map(p => ({
            name: p.name,
            status: p.pm2_env.status,
            uptime: p.pm2_env.pm_uptime,
            restarts: p.pm2_env.restart_time,
            memory: p.monit?.memory || 0,
            cpu: p.monit?.cpu || 0
          }))
        });
      } catch {
        resolve({ status: 'error', processes: [] });
      }
    });
  });
}

async function checkGitStatus() {
  return new Promise((resolve) => {
    const { exec } = require('child_process');
    const cwd = path.join(__dirname, '..');

    exec('git log -1 --format="%H|%s|%ai"', { cwd }, (error, stdout) => {
      if (error) {
        resolve({ status: 'error', lastCommit: null });
        return;
      }
      const [hash, message, date] = stdout.trim().split('|');
      resolve({
        status: 'healthy',
        lastCommit: {
          hash: hash?.substring(0, 7),
          message: message?.substring(0, 50),
          date
        }
      });
    });
  });
}

async function runHealthCheck() {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] Running health check...`);

  // Check Frontend
  if (services.frontend.url) {
    const result = await checkUrl(services.frontend.url);
    services.frontend = { ...services.frontend, ...result, lastCheck: timestamp };
  }

  // Check Supabase
  if (services.supabase.url) {
    const result = await checkUrl(`${services.supabase.url}/rest/v1/`);
    // Supabase returns 401 without auth, but that means it's reachable
    if (result.statusCode === 401) result.status = 'healthy';
    services.supabase = { ...services.supabase, ...result, lastCheck: timestamp };
  }

  // Check PM2
  const pm2Result = await checkPM2();
  services.pm2 = { ...services.pm2, ...pm2Result, lastCheck: timestamp };

  // Check Git
  const gitResult = await checkGitStatus();
  services.github = { ...services.github, ...gitResult, lastCheck: timestamp };

  // Calculate overall status
  const statuses = Object.values(services).map(s => s.status);
  const overallStatus = statuses.every(s => s === 'healthy')
    ? 'operational'
    : statuses.some(s => s === 'offline' || s === 'error')
      ? 'outage'
      : 'degraded';

  const healthReport = {
    status: overallStatus,
    timestamp,
    services,
    uptime: process.uptime(),
    version: require('../package.json').version || '1.0.0'
  };

  // Write to file for API consumption
  try {
    const publicDir = path.dirname(HEALTH_FILE);
    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir, { recursive: true });
    }
    fs.writeFileSync(HEALTH_FILE, JSON.stringify(healthReport, null, 2));
    console.log(`[${timestamp}] Health status: ${overallStatus}`);
  } catch (err) {
    console.error('Failed to write health status:', err.message);
  }

  return healthReport;
}

// Initial check
runHealthCheck();

// Periodic checks
setInterval(runHealthCheck, CHECK_INTERVAL);

console.log(`Health Monitor started. Checking every ${CHECK_INTERVAL/1000}s`);
