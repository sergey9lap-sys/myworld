import { cp, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const source = path.join(root, 'sites', 'st-kids');
const target = path.resolve(root, 'public', 'st-kids');
const publicRoot = path.resolve(root, 'public');
if (target !== path.join(publicRoot, 'st-kids')) throw new Error('Unexpected clinic publish target');

await rm(target, { recursive: true, force: true });
await mkdir(target, { recursive: true });
for (const name of await readdir(source)) {
  if (name === 'README.md') continue;
  await cp(path.join(source, name), path.join(target, name), { recursive: true });
}
for (const name of (await readdir(target)).filter(name => name.endsWith('.css'))) {
  const file = path.join(target, name);
  await writeFile(file, (await readFile(file, 'utf8')).replaceAll('/public/', '/st-kids/public/'));
}
console.log('Published clinic at /st-kids/.');
