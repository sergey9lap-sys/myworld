import { mkdir, copyFile, cp } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.dirname(fileURLToPath(import.meta.url));
const output = path.join(root, 'dist');
await mkdir(output, { recursive: true });
// Publish only browser assets; the local preview server is never deployed.
for (const file of ['index.html', 'cases.html', 'cases.css', 'style.css', 'refinement.css', 'structure.css', 'readability.css', 'app.js', 'materials.js', 'favicon.svg']) {
  await copyFile(path.join(root, file), path.join(output, file));
}
for (const directory of ['assets', 'fonts', 'vendor']) {
  await cp(path.join(root, directory), path.join(output, directory), { recursive: true });
}
console.log('Static site ready in dist/');
