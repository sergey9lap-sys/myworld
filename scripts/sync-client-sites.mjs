import { execFile } from 'node:child_process';
import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

const run = promisify(execFile);
const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const publishRoot = path.join(root, 'public', 'p');
const sites = [
  { slug: 'elmira', directory: path.join(root, 'sites', 'elmira') },
  { slug: 'julia', directory: path.join(root, 'sites', 'julia') },
  { slug: 'ilmira', directory: path.join(root, 'sites', 'ilmira') },
];

await mkdir(publishRoot, { recursive: true });

for (const site of sites) {
  await run(process.execPath, ['build.mjs'], { cwd: site.directory });

  const target = path.resolve(publishRoot, site.slug);
  if (!target.startsWith(`${path.resolve(publishRoot)}${path.sep}`)) {
    throw new Error(`Unsafe publish target: ${target}`);
  }

  await rm(target, { recursive: true, force: true });
  await cp(path.join(site.directory, 'dist'), target, { recursive: true });

  const indexPath = path.join(target, 'index.html');
  const index = await readFile(indexPath, 'utf8');
  const base = `  <base href="/p/${site.slug}/">\n`;
  await writeFile(indexPath, index.replace('<head>\n', `<head>\n${base}`));
}

console.log(`Published ${sites.length} client sites in public/p/.`);
