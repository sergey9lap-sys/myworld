import { mkdir, copyFile, cp, readFile, writeFile } from 'node:fs/promises';
import { addSeo, sitemap, robots } from './seo.mjs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.dirname(fileURLToPath(import.meta.url));
const output = path.join(root, 'dist');
await mkdir(output, { recursive: true });
for (const file of ['index.html', 'style.css', 'client-feedback.css', 'app.js']) {
  await copyFile(path.join(root, file), path.join(output, file));
}
await cp(path.join(root, 'assets'), path.join(output, 'assets'), { recursive: true });
await cp(path.join(root, 'documents'), path.join(output, 'documents'), { recursive: true });
await writeFile(path.join(output, 'index.html'), addSeo(await readFile(path.join(root, 'index.html'), 'utf8')));
await writeFile(path.join(output, 'sitemap.xml'), sitemap);
await writeFile(path.join(output, 'robots.txt'), robots);
console.log('Ilmira static site ready in dist/');
