import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { openBotStore, createBotPoller, rememberVisitor } from './telegram.mjs';
import { botSettings, saveBotSettings, welcomeMenu, menuCallback } from './bot-menu.mjs';
function store(){const db=new DatabaseSync(':memory:');db.exec('CREATE TABLE partners(code TEXT PRIMARY KEY,name TEXT,active INTEGER DEFAULT 1,created TEXT)');openBotStore(db);return db;}
const user={id:20,first_name:'Тест',username:'test_user'};
const cb=(data,from=user)=>({id:'callback',data,from,message:{chat:{id:from.id,type:'private'},from:{is_bot:true,username:'lpsflowbot'}}});
test('menu settings escape markup, validate channel, keep compact truthful menu',()=>{
 const db=store();try{const settings=saveBotSettings(db,{intro:'Тест <script>',services:'PDF & сайты',channel:'https://t.me/test_channel'});
 assert.equal(botSettings(db).channel,settings.channel);const m=welcomeMenu(20,'https://space.lpsflow.ru',settings);
 assert.match(m.text,/&lt;script&gt;/);assert.match(m.text,/30%/);assert.deepEqual(m.reply_markup.inline_keyboard.map(r=>r.length),[2,1,1,1]);
 assert.equal(m.reply_markup.inline_keyboard[0][0].style,'success');assert.equal(m.reply_markup.inline_keyboard.at(-1)[0].url,settings.channel);
 assert.equal(m.reply_markup.inline_keyboard[2][0].text,'💬 Написать мне');assert.equal(m.reply_markup.inline_keyboard.at(-1)[0].text,'Мой канал ↗');
 assert.throws(()=>saveBotSettings(db,{...settings,channel:'https://evil.test'}));assert.throws(()=>saveBotSettings(db,{...settings,discount:99}));}finally{db.close();}
});
test('claim once, preserve used bonus, personal code stable and no self referral',async()=>{
 const db=store(),sent=[],api=async(method,payload)=>{if(method==='sendMessage')sent.push(payload);};try{
 await menuCallback(db,api,cb('welcome_bonus'),'https://space.lpsflow.ru');await menuCallback(db,api,cb('welcome_bonus'),'https://space.lpsflow.ru');
 assert.equal(sent.at(-1).reply_markup.inline_keyboard[0][0].text,'💬 Написать мне');
 assert.equal(db.prepare('SELECT count(*) n FROM bot_welcome_bonuses').get().n,1);assert.equal(db.prepare('SELECT discount FROM bot_welcome_bonuses').get().discount,30);
 db.prepare("UPDATE bot_welcome_bonuses SET status='used'").run();await menuCallback(db,api,cb('welcome_bonus'),'https://space.lpsflow.ru');assert.match(sent.at(-1).text,/уже использован/);
 await menuCallback(db,api,cb('my_referral'),'https://space.lpsflow.ru');const link=sent.at(-1).reply_markup.inline_keyboard[0][0].copy_text.text;
 await menuCallback(db,api,cb('my_referral'),'https://space.lpsflow.ru');assert.equal(sent.at(-1).reply_markup.inline_keyboard[0][0].copy_text.text,link);
 const code=db.prepare('SELECT code FROM bot_partner_accounts').get().code;assert.equal(rememberVisitor(db,20,code),null);assert.equal(rememberVisitor(db,30,code),code);
 const forged=cb('my_referral');forged.message.chat.id=99;await menuCallback(db,api,forged,'https://space.lpsflow.ru');assert.equal(sent.length,5);
 }finally{db.close();}
});
test('callback polling accepts clicks, deduplicates updates and persists bonus on send retry',async()=>{
 const db=store();let fail=true,delivered=0;const update={update_id:1,callback_query:cb('welcome_bonus')};
 const api=async(method,payload)=>{if(method==='getMe')return{username:'lpsflowbot'};if(method==='getWebhookInfo')return{url:''};if(method==='getUpdates'){assert.ok(payload.allowed_updates.includes('callback_query'));return[update];}if(method==='sendMessage'){if(fail)throw Error('offline');delivered++;}};
 try{const poll=createBotPoller(db,api,'https://space.lpsflow.ru');await assert.rejects(poll());assert.equal(db.prepare('SELECT count(*) n FROM bot_cursor').get().n,0);fail=false;await poll();await poll();assert.equal(delivered,1);assert.equal(db.prepare('SELECT count(*) n FROM bot_welcome_bonuses').get().n,1);}finally{db.close();}
});
