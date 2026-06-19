const res = await fetch('http://localhost:8000/openapi.json');
const spec = await res.json();
const paths = Object.keys(spec.paths ?? {});
const org = paths.filter((p) => p.includes('organization-profile'));
console.log('organization-profile paths:', org.length ? org : 'NONE');
process.exit(org.length ? 0 : 1);
