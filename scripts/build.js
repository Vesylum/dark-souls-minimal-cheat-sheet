import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
let commit = 'dev';
try {
  commit = execSync('git rev-parse --short HEAD').toString().trim();
} catch {
  // ignore if git is not available
}
const cacheName = `dsmcs-cache-v${pkg.version}-${commit}`;

let sw = readFileSync(join(root, 'service-worker.template.js'), 'utf8');
sw = sw.replace(/{{CACHE_NAME}}/g, cacheName);
writeFileSync(join(root, 'service-worker.js'), sw);
console.log(`service-worker.js generated with CACHE_NAME=${cacheName}`);
