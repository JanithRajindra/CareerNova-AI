const { spawn } = require('child_process');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const backendDir = path.join(rootDir, 'backend');
const frontendDir = path.join(rootDir, 'frontend');

console.log('\x1b[36m%s\x1b[0m', '════════════════════════════════════════════════════════════');
console.log('\x1b[36m%s\x1b[0m', '  🚀 Starting CareerMatch AI Full-Stack Platform...        ');
console.log('\x1b[36m%s\x1b[0m', '════════════════════════════════════════════════════════════\n');

// 1. Start Backend
const backend = spawn('npm', ['run', 'dev'], {
  cwd: backendDir,
  shell: true,
  env: { ...process.env, FORCE_COLOR: 'true' },
});

backend.stdout.on('data', (data) => {
  const lines = data.toString().trim().split('\n');
  for (const line of lines) {
    if (line) console.log('\x1b[34m[BACKEND]\x1b[0m ' + line);
  }
});

backend.stderr.on('data', (data) => {
  const lines = data.toString().trim().split('\n');
  for (const line of lines) {
    if (!line) continue;
    // Route benign Node.js system warnings or dotenv notes to WARN instead of alarming red ERR
    if (
      line.includes('ExperimentalWarning') ||
      line.includes('injected env') ||
      line.includes('Debugger listening') ||
      line.includes('Use `node --trace-warnings') ||
      line.toLowerCase().includes('warning')
    ) {
      console.log('\x1b[33m[BACKEND WARN]\x1b[0m ' + line);
    } else {
      console.error('\x1b[31m[BACKEND ERR]\x1b[0m ' + line);
    }
  }
});

// 2. Start Frontend
const frontend = spawn('npm', ['run', 'dev'], {
  cwd: frontendDir,
  shell: true,
  env: { ...process.env, FORCE_COLOR: 'true' },
});

frontend.stdout.on('data', (data) => {
  const lines = data.toString().trim().split('\n');
  for (const line of lines) {
    if (line) console.log('\x1b[32m[FRONTEND]\x1b[0m ' + line);
  }
});

frontend.stderr.on('data', (data) => {
  const lines = data.toString().trim().split('\n');
  for (const line of lines) {
    if (line) console.error('\x1b[33m[FRONTEND WARN]\x1b[0m ' + line);
  }
});

// Graceful exit
function shutdown() {
  console.log('\n\x1b[33mShutting down servers...\x1b[0m');
  backend.kill('SIGINT');
  frontend.kill('SIGINT');
  process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
