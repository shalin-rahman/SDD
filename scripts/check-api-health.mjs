/**
 * Fast API health probe for agents/CI (8s timeout). Avoids PowerShell Invoke-WebRequest hangs.
 *
 * Usage: node scripts/check-api-health.mjs
 * Exit 0 when GET /api/v1/health returns 200; exit 1 otherwise.
 */
const url = process.env.EMCAP_API_HEALTH ?? 'http://localhost:8000/api/v1/health';

try {
  const res = await fetch(url, { signal: AbortSignal.timeout(8_000) });
  if (!res.ok) {
    console.error(`API health HTTP ${res.status}`);
    process.exit(1);
  }
  const body = await res.json().catch(() => ({}));
  console.log(body?.status ?? 'ok');
} catch (err) {
  console.error(`API not reachable: ${url} — ${err.message ?? err}`);
  console.error('Start stack: scripts\\start-emcap-local.bat');
  process.exit(1);
}
