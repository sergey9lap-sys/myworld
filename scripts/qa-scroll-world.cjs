const {chromium}=require('C:/Users/User/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs=require('node:fs');const path=require('node:path');
(async()=>{const browser=await chromium.launch({headless:true,channel:'msedge'});const dir=path.resolve('.impeccable/review/scroll-world');fs.mkdirSync(dir,{recursive:true});
for(const [label,width,height] of [['desktop',1280,900],['mobile',390,844],['narrow',320,740]]){
 if(process.env.FOCUS_ONLY)break;
 const page=await browser.newPage({viewport:{width,height},deviceScaleFactor:1});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:4354/work/',{waitUntil:'networkidle'});await page.evaluate(async()=>{await document.fonts.ready;await Promise.all([...document.images].map(async i=>{i.loading='eager';try{await i.decode()}catch{}}))});
 await page.screenshot({path:path.join(dir,label+'.png'),fullPage:true});
 await page.locator('.hero').screenshot({path:path.join(dir,label+'-hero.png')});
 for(const id of ['services','author','approach'])await page.locator('#'+id).screenshot({path:path.join(dir,label+'-'+id+'.png')});
 console.log(label,await page.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth,images:[...document.images].filter(i=>!i.complete||!i.naturalWidth).map(i=>i.src),cta:[...document.querySelectorAll('.button')].map(e=>({text:e.textContent.trim(),width:e.getBoundingClientRect().width,height:e.getBoundingClientRect().height}))})),errors);
 await page.close();
}
const page=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:1});await page.goto('http://127.0.0.1:4355/#works',{waitUntil:'networkidle'});await page.locator('.viewport.ready').waitFor();
await page.screenshot({path:path.join(dir,'board-mobile.png')});
const read=()=>page.locator('.world').getAttribute('style');const before=await read();const button=page.getByRole('button',{name:'Ниже по доске',exact:true});const box=await button.boundingBox();await page.mouse.move(box.x+box.width/2,box.y+box.height/2);await page.mouse.down();await page.waitForTimeout(450);await page.mouse.up();const after=await read();await page.waitForTimeout(250);const stopped=await read();
console.log('board hold pan',{changed:before!==after,stopped:after===stopped,size:box});await page.screenshot({path:path.join(dir,'board-mobile-moved.png')});
await page.locator('.navigation button').filter({hasText:'Сайты'}).click();await page.waitForTimeout(1000);await page.getByRole('button',{name:'Открыть проект Sakura',exact:true}).click();await page.waitForTimeout(1200);await page.screenshot({path:path.join(dir,'board-mobile-project.png')});
console.log('focused controls',await page.evaluate(()=>{const pad=document.querySelector('.direction-pad').getBoundingClientRect();return [...document.querySelectorAll('.media-play,.detail-close')].map(e=>{const r=e.getBoundingClientRect();return {label:e.textContent||e.getAttribute('aria-label'),overlapsPad:r.left<pad.right&&r.right>pad.left&&r.top<pad.bottom&&r.bottom>pad.top}})}));
await page.locator('.media-play').click();await page.waitForTimeout(1500);await page.screenshot({path:path.join(dir,'board-mobile-video.png')});
await page.setViewportSize({width:1280,height:900});await page.screenshot({path:path.join(dir,'board-desktop.png')});await browser.close();})();
