/**
 * Restart uvicorn on :8000 with current repo code (for screenshot capture when stack is stale).
 */
import { spawn, execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const apiDir = path.join(root, 'platform', 'api');

function killPort(port) {
  try {
    const out = execSync(`netstat -ano | findstr /R /C:":${port} .*LISTENING"`, { encoding: 'utf8' });
    for (const line of out.split('\n')) {
      const pid = line.trim().split(/\s+/).pop();
      if (pid && /^\d+$/.test(pid)) {
        try {
          execSync(`taskkill /F /PID ${pid}`, { stdio: 'ignore' });
          console.log(`Killed PID ${pid} on port ${port}`);
        } catch {
          /* already gone */
        }
      }
    }
  } catch {
    /* no listener */
  }
}

async function waitForOrgRoute(maxMs = 90_000) {
  const start = Date.now();
  while (Date.now() - start < maxMs) {
    try {
      const res = await fetch('http://localhost:8000/openapi.json', { signal: AbortSignal.timeout(5_000) });
      const spec = await res.json();
      if (Object.keys(spec.paths ?? {}).some((p) => p.includes('organization-profile'))) {
        return true;
      }
    } catch {
      /* retry */
    }
    await new Promise((r) => setTimeout(r, 2_000));
  }
  return false;
}

killPort(8000);
await new Promise((r) => setTimeout(r, 1_500));

const env = {
  ...process.env,
  DATABASE_URL: 'sqlite:///./emcap-local.db',
  EMCAP_CONFIG_PATH: path.join(root, 'config', 'platform.yaml'),
  EMCAP_MODULES_PATH: path.join(root, 'modules'),
};

const child = spawn(
  'python',
  ['-m', 'uvicorn', 'emcap.main:app', '--host', '0.0.0.0', '--port', '8000', '--app-dir', 'src'],
  { cwd: apiDir, env, stdio: 'ignore', detached: true },
);
child.unref();
console.log(`Started API PID ${child.pid}`);

const ok = await waitForOrgRoute();
if (!ok) {
  console.error('ERROR: organization-profile route not available after restart');
  process.exit(1);
}
console.log('API ready with organization-profile route');
