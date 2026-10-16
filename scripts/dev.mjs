import { spawn } from 'node:child_process';
import process from 'node:process';

const windows = process.platform === 'win32';
const children = [];
let stopping = false;

function stop(code = 0) {
  if (stopping) return;
  stopping = true;
  process.exitCode = code;
  for (const child of children) {
    if (!child.pid) continue;
    if (windows) {
      spawn('taskkill', ['/pid', String(child.pid), '/T', '/F'], { stdio: 'ignore' });
    } else {
      try {
        process.kill(-child.pid, 'SIGTERM');
      } catch (error) {
        if (error.code !== 'ESRCH') throw error;
      }
    }
  }
}

for (const script of ['dev:client', 'dev:server']) {
  const child = spawn(`npm run ${script}`, {
    shell: true,
    stdio: 'inherit',
    detached: !windows,
  });
  children.push(child);
  child.on('error', () => stop(1));
  child.on('exit', (code) => stop(code ?? 1));
}
process.on('SIGINT', () => stop());
process.on('SIGTERM', () => stop());
