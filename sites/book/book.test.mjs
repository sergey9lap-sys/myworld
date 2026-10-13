import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile,stat} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.join(path.dirname(fileURLToPath(import.meta.url)),'public');
const main=await readFile(path.join(root,'index.html'),'utf8');
const italy=await readFile(path.join(root,'italy/index.html'),'utf8');
test('all seven source sections and the approved book hero remain',()=>{
 for(const id of ['format','next','passport','memories','faq','join'])assert.ok(main.includes(`id="${id}"`));
 assert.equal((main.match(/<section\b/g)||[]).length,7);
 assert.match(main,/hero-flat-v3.webp/);assert.match(main,/pass[ps]ort-original.webp/);
 assert.match(main,/Читать все книги необязательно/);assert.match(main,/Домашнего задания тоже нет/);
});
test('live ingredients keep uniform titles and physical passport explanation',()=>{
 for(const title of ['Книги','Еда и напитки','Атмосфера','Люди и разговоры'])assert.ok(main.includes(`<h3>${title}</h3>`));
 assert.equal((main.match(/class="album-item /g)||[]).length,4);
 assert.match(main,/бумажный паспорт/);assert.match(main,/остаётся печать страны/);
 assert.doesNotMatch(main,/Живые материалы скоро добавим/);
});
test('only Italy is past; future France and Russia have dates but no fabricated sales',()=>{
 assert.match(main,/Уже путешествовали/);assert.match(main,/2026-10-24/);assert.match(main,/2026-11-28/);
 assert.match(main,/Дальше в маршруте/);assert.match(main,/два формата участия/);
 assert.match(main,/контакты не собираются/);assert.match(main,/оплата недоступна/);
 assert.match(italy,/<meta name="robots" content="noindex,nofollow">/);
});
test('Italy route fragments stay on Italy and all ten supplied photos remain represented',()=>{
 assert.match(italy,/href="italy\/#album"/);assert.match(italy,/href="italy\/#main"/);
 for(let n=89;n<=98;n++)assert.ok(italy.includes(`italy-${n}-`));
 assert.doesNotMatch(italy,/italy-99|italy-100/);
 for(const page of [main,italy]){assert.equal((page.match(/<video controls playsinline preload="none"/g)||[]).length,2);assert.doesNotMatch(page,/<video[^>]*autoplay/);}
});
test('tactile album uses real bitmap materials and retains a static three-spread fallback',()=>{
 assert.match(main,/tactile-album-v6.css/);
 assert.equal((main.match(/class="album-spread"/g)||[]).length,3);
 assert.equal((main.match(/class="instant-shot"/g)||[]).length,6);
 assert.match(main,/photo-album-real-v6.webp/);assert.match(main,/polaroid-real-v6.webp/);
 assert.doesNotMatch(main,/class="photo-reel"|class="cta secondary" href="italy\/"/);
 assert.match(main,/data-album-next/);
});
test('all stylesheet/image/video/script paths resolve inside the static package',async()=>{
 for(const page of [main,italy]){
  for(const match of page.matchAll(/(?:src|poster)="([^"]+)"|<link[^>]+href="([^"]+)"/g)){
   const asset=match[1]||match[2];if(/^(http|#)/.test(asset))continue;
   const file=path.resolve(root,asset.split('?')[0]);assert.ok(file.startsWith(root+path.sep));assert.ok((await stat(file)).isFile(),asset);
  }
 }
});
