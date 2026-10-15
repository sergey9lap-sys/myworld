import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile,stat} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {russianTypography} from './public/typography.mjs';
const root=path.join(path.dirname(fileURLToPath(import.meta.url)),'public');
const mainRaw=await readFile(path.join(root,'index.html'),'utf8');
const italyRaw=await readFile(path.join(root,'italy/index.html'),'utf8');
const main=mainRaw.replaceAll('\u00a0',' ').replaceAll('\u2011','-');
const italy=italyRaw.replaceAll('\u00a0',' ').replaceAll('\u2011','-');
const tactileStyles=await readFile(path.join(root,'tactile-album-v6.css'),'utf8');
test('all seven source sections remain, with two explicitly requested additions',()=>{
 for(const id of ['format','next','passport','memories','faq','join'])assert.ok(main.includes(`id="${id}"`));
 assert.equal((main.match(/<section\b/g)||[]).length,9);
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
 assert.match(main,/Дальше в маршруте/);assert.match(main,/Билет на одного/);
 assert.match(main,/контакты пока не собираются/);assert.doesNotMatch(main,/оплата недоступна/);
 assert.match(italy,/<meta name="robots" content="noindex,nofollow">/);
});
test('Italy route fragments stay on Italy and all ten supplied photos remain represented',()=>{
 assert.match(italy,/href="italy\/#album"/);assert.match(italy,/href="italy\/#main"/);
 for(let n=89;n<=98;n++)assert.ok(italy.includes(`italy-${n}-`));
 assert.doesNotMatch(italy,/italy-99|italy-100/);
 assert.equal((main.match(/<video controls playsinline preload="none"/g)||[]).length,5);
 assert.equal((italy.match(/<video controls playsinline preload="none"/g)||[]).length,2);
 for(const page of [main,italy])assert.doesNotMatch(page,/<video[^>]*autoplay/);
});
test('ring album includes every supplied photograph once and integrates both videos',()=>{
 assert.match(main,/photo-report-v7.css/);
 assert.equal((main.match(/class="report-spread(?: film-spread)?"/g)||[]).length,6);
 assert.equal((main.match(/class="album-leaf(?: film-leaf| report-candle)?"/g)||[]).length,12);
 assert.match(main,/ring-album-v7.webp/);
 const report=main.match(/<div class="report-album"[\s\S]*?<div class="report-navigation"/)[0];
 for(let n=89;n<=98;n++)assert.equal((report.match(new RegExp(`src="assets/live/italy-${n}-480.webp"`,'g'))||[]).length,1);
 assert.match(tactileStyles,/polaroid-real-v6.webp/);
 assert.doesNotMatch(main,/class="photo-reel"|class="cta secondary" href="italy\/"/);
 assert.match(main,/data-album-next/);
 assert.equal((main.match(/data-report-chapter="\d"/g)||[]).length,6);
 assert.doesNotMatch(main,/class="live-films"/);
});
test('October 14 voice feedback is represented without losing original media',()=>{
 assert.match(mainRaw,/class="photo-cord"/);assert.match(mainRaw,/feedback-v14.css/);
 for(const caption of ['В предвкушении…','Красота в деталях','Романтическое настроение','Продумана каждая деталь'])assert.ok(mainRaw.includes(caption));
 assert.match(mainRaw,/…никого не знаю\?/);
 assert.doesNotMatch(mainRaw,/Стол ждёт гостей|<figcaption>Свечи в пасте|<figcaption>Итальянские песни|<figcaption>Имена на пасте/);
});
test('five moments use the user-selected sources without repeating the format books',()=>{
 const steps=main.match(/<ol class="route evening-stops">[\s\S]*?<\/ol>/)[0];
 const sources=[...steps.matchAll(/<li(?: class="passport-stop")?><img src="([^"]+)"/g)].map(m=>m[1]);
 assert.deepEqual(sources,['assets/live/italy-91-480.webp','assets/live/italy-98-480.webp','assets/live/italy-94-480.webp','assets/live/italy-89-480.webp','assets/passport-original.webp']);
 assert.match(main,/<article class="album-item album-atmosphere">[\s\S]*?italy-90-480.webp/);
});
test('all stylesheet/image/video/script paths resolve inside the static package',async()=>{
 for(const page of [main,italy]){
  for(const match of page.matchAll(/(?:src|poster)="([^"]+)"|<link[^>]+href="([^"]+)"/g)){
   const asset=match[1]||match[2];if(/^(http|#)/.test(asset))continue;
   const file=path.resolve(root,asset.split('?')[0]);assert.ok(file.startsWith(root+path.sep));assert.ok((await stat(file)).isFile(),asset);
  }
 }
});
test('prepositions are bound on both pages and dynamic captions use the same typography',()=>{
 assert.equal(russianTypography('в книге и на столе, не просто ужин, 30 минут, что-то'),'в\u00a0книге и\u00a0на\u00a0столе, не\u00a0просто ужин, 30\u00a0минут, что\u2011то');
 for(const page of [mainRaw,italyRaw]){
  const text=page.replace(/<script[\s\S]*?<\/script>/g,'').replace(/<[^>]+>/g,' ');
  assert.equal(russianTypography(text),text);
 }
 assert.doesNotMatch(mainRaw,/report-film-note|Лучше один раз увидеть|Два коротких видео с первой встречи/);
 assert.match(mainRaw,/type="module" src="site.js\?v=9"/);
});
test('mobile album is a complete separate object with chapter-local counters',async()=>{
 assert.equal((mainRaw.match(/srcset="assets\/mobile-ring-album-v9.webp"/g)||[]).length,6);
 assert.ok((await stat(path.join(root,'assets/mobile-ring-album-v9.webp'))).isFile());
 const script=await readFile(path.join(root,'site.js'),'utf8');
 assert.match(script,/tabNames\[index\]/);assert.match(script,/page%2\+1/);
});

test('October 15 confirmed meeting, FAQ, tariff copy and offer are present',()=>{
 for(const value of ['Сбор к 18:30','Старт в 19:00','Киевская, 12','CXBvQYiT','4 990 Р','8 980 Р','Путешествие на двоих','…приду без компании?','…не знаю, моё ли это вообще?','13hUKjdMwv9-sbd__mDnOi31UsIn6giex'])assert.ok(main.includes(value),value);
 assert.match(main,/Это не билет на встречу/);assert.match(main,/При оплате спишется 10 Р/);
 assert.equal((main.match(/data-payment="/g)||[]).length,3);
 assert.doesNotMatch(main,/<dialog|<iframe|₽/);
 assert.match(main,/review-1.mp4/);assert.match(main,/review-2.mp4/);assert.match(main,/review-3.mp4/);
});

test('payment URLs are fixed public invoices and no browser success can grant paid access',async()=>{
 const {paymentOptions,invoiceUrl}=await import('./public/payments.mjs');
 assert.equal(Object.keys(paymentOptions).length,3);
 assert.equal(invoiceUrl('test'),'https://auth.robokassa.ru/merchant/Invoice/jz5rphMXq0uM4AYTCUEX2w');
 assert.equal(invoiceUrl('unexpected'),null);
 const script=await readFile(path.join(root,'payments.mjs'),'utf8');
 assert.doesNotMatch(script,/SignatureValue|Password1|postMessage|tusim812|localStorage/);
 assert.doesNotMatch(script,/showModal|createElement|addEventListener|window\.open/);
 const forms=[...main.matchAll(/<form\b([^>]+)>([\s\S]*?)<\/form>/g)];
 assert.equal(forms.length,3);
 for(const [key,form] of ['solo','duo','test'].map(key=>[key,forms.find(m=>m[1].includes(`data-payment="${key}"`))])){
  assert.ok(form,key);assert.ok(form[1].includes(`action="${invoiceUrl(key)}"`));
  assert.match(form[1],/method="get" target="_blank" rel="noopener noreferrer"/);
  assert.match(form[2],/<input type="checkbox" required>/);
  assert.doesNotMatch(form[2],/<input[^>]+(?:checked|name=)/);
  assert.match(form[2],/<button class="cta(?: secondary)?" type="submit">/);
  if(key!=='test')assert.match(form[2],/Принимаю условия <a[^>]+13hUKjdMwv9-sbd__mDnOi31UsIn6giex/);
  else assert.doesNotMatch(form[2],/Принимаю условия/);
 }
 assert.equal(invoiceUrl('solo'),'https://auth.robokassa.ru/merchant/Invoice/DcPY1nBgJka3xOSTkgmzDg');
 assert.equal(invoiceUrl('duo'),'https://auth.robokassa.ru/merchant/Invoice/35Vu3FnlHEaj5C-T3T898Q');
 assert.equal(new Set(forms.map(m=>m[1].match(/action="([^"]+)"/)[1])).size,3);
});
