const { spawn } = require('child_process');
const path = require('path');

const pythonScript = path.join(__dirname, 'revenue_tracker.py');
const pythonPath = 'C:\\Users\\polor\\AppData\\Local\\Microsoft\\WindowsApps\\python3.exe';

const child = spawn(pythonPath, [pythonScript], {
  cwd: path.join(__dirname, '..'),
  stdio: 'inherit'
});

child.on('error', (err) => {
  console.error('Failed to start Python script:', err);
});

child.on('close', (code) => {
  console.log(`Python script exited with code ${code}`);
  process.exit(code);
});
