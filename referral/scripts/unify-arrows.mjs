// Mechanical replacement of action glyphs with one SVG, preserving all other markup.
import { readFileSync, writeFileSync } from 'node:fs';
const arrow = '<svg class="action-arrow" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 19 19 5M5 5h14v14" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';
for (const file of ['index.html', 'admin.html']) {
  const path = new URL('../public/' + file, import.meta.url);
  let markup = readFileSync(path, 'utf8').replaceAll('↗', arrow);
  if (file === 'index.html' && !markup.includes('class="project-art"')) markup = markup.replace(/(<img src="\/work\/media\/sakura.jpg"[^>]+>)/, '<div class="project-art">$1</div>');
  writeFileSync(path, markup);
}
