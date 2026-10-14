import { mkdir, copyFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve, dirname } from 'node:path';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
await mkdir(resolve(root, 'dist'), { recursive: true });
for (const name of ['index.html', 'styles.css', 'app.js', 'favicon.svg']) {
  await copyFile(resolve(root, name), resolve(root, 'dist', name));
}
console.log('Static site ready in dist/');
