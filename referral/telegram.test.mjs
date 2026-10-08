import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { createHmac } from 'node:crypto';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createApp, addPartner } from './server.mjs';
import { createBotPoller, rememberVisitor, telegramUser, welcome } from './telegram.mjs';
const token='123456:synthetic-test-token-never-connect';
export function sign(user,now=Date.now()) {
  const p=new URLSearchParams({auth_date:String(Math.floor(now/1000)),user:JSON.stringify(user)});
  const key=createHmac('sha256','WebAppData').update(token).digest();const check=[...p].sort(([a],[b])=>a<b?-1:1).map(([k,v])=>`${k}=${v}`).join('\n');
  p.set('hash',createHmac('sha256',key).update(check).digest('hex'));return p.toString();
}
test('Telegram identity rejects forged, expired, future and duplicate data',()=>{
  const user={id:1,first_name:'Тест'};const data=sign(user);
  assert.equal(telegramUser(data,token).id,1);
  assert.throws(()=>telegramUser(data+'x',token));assert.throws(()=>telegramUser(data,token+'x'));
  assert.throws(()=>telegramUser(sign(user,1),token));assert.throws(()=>telegramUser(sign(user,Date.now()+600000),token));
  assert.throws(()=>telegramUser(data+'&auth_date=1',token));
});
test('one welcome, two correct buttons, immutable referral, retries and saved polling cursor',async()=>{
  const db=new DatabaseSync(':memory:');db.exec("CREATE TABLE partners(code TEXT PRIMARY KEY,name TEXT,active INTEGER DEFAULT 1,created TEXT);INSERT INTO partners(code,active) VALUES('ilmira',1),('other',1)");
  let fail=true;const calls=[];let update={update_id:1,message:{chat:{id:2,type:'private'},from:{id:2},text:'/start ref_ilmira'}};
  const api=async(method,payload)=>{calls.push({method,payload});if(method==='getMe')return{username:'lpsflowbot'};if(method==='getWebhookInfo')return{url:''};if(method==='getUpdates')return[update];if(fail)throw new Error('network');return{};};
  const poll=createBotPoller(db,api,'https://space.lpsflow.ru');
  await assert.rejects(poll());assert.equal(db.prepare('SELECT count(*) AS n FROM bot_cursor').get().n,0);
  fail=false;await poll();await poll();assert.equal(calls.filter(c=>c.method==='sendMessage').length,2);
  assert.equal(rememberVisitor(db,2,'other'),'ilmira');assert.equal(calls.filter(c=>c.method==='getUpdates').at(-1).payload.offset,2);
  const m=welcome(2,'https://space.lpsflow.ru');assert.equal(m.reply_markup.inline_keyboard.flat().length,5);assert.equal(m.reply_markup.inline_keyboard[1][0].web_app.url,'https://space.lpsflow.ru/work/');assert.equal(m.reply_markup.inline_keyboard[2][0].url,'https://t.me/lp_sergey');
  update={...update,update_id:3,message:{...update.message,chat:{id:2,type:'group'}}};await poll();assert.equal(calls.filter(c=>c.method==='sendMessage').length,2);db.close();
});
test('verified Mini App transfers bot referral to saved enquiry, forged data cannot',async()=>{
  const origin='http://127.0.0.1:4348';const {server,db}=createApp({dataDir:mkdtempSync(join(tmpdir(),'mw-bot-test-')),origin,secure:false,telegram:{token}});
  addPartner(db,'ilmira','Ильмира');rememberVisitor(db,42,'ilmira');
  await new Promise(done=>server.listen(4348,'127.0.0.1',done));
  try {
    const session=await fetch(origin+'/work/api/session');const {csrf}=await session.json();const cookie=session.headers.get('set-cookie').split(';')[0];
    const send=(path,body,extra='')=>fetch(origin+path,{method:'POST',headers:{Origin:origin,'Content-Type':'application/json',Cookie:cookie+(extra?'; '+extra:'')},body:JSON.stringify(body)});
    assert.equal((await send('/work/api/telegram',{csrf,initData:'forged'})).status,401);
    const noCookie=await send('/work/api/telegram',{csrf,initData:sign({id:42,first_name:'Тест',username:'synthetic_user'})});assert.equal(noCookie.headers.get('set-cookie'),null);assert.equal((await noCookie.json()).referralCode,'ilmira');
    const verified=await send('/work/api/telegram',{csrf,initData:sign({id:42,first_name:'Тест',username:'synthetic_user'})},'mw_preferences=recommendations');assert.equal(verified.status,200);
    const ref=verified.headers.get('set-cookie').split(';')[0];
    assert.equal((await send('/work/api/lead',{csrf,name:'Тест',contact:'synthetic_user',brief:'',consent:true},ref)).status,201);
    assert.equal(db.prepare('SELECT partner FROM leads').get().partner,'ilmira');
    assert.equal((await fetch(origin+'/partners/api/data')).status,401);
  } finally {await new Promise(done=>server.close(done));db.close();}
});
