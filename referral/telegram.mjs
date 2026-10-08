import { createHmac, timingSafeEqual } from 'node:crypto';
import { request } from 'node:https';
import { openMenuStore, welcomeMenu, botSettings, menuCallback } from './bot-menu.mjs';
export function telegramRequest(method, payload, { token, tunnelPort, family = 0 } = {}) {
  if (!/^\d+:[A-Za-z0-9_-]{30,}$/.test(token || '')) throw new Error('Bot unavailable');
  if (!/^(getMe|getWebhookInfo|setWebhook|setChatMenuButton|getUpdates|sendMessage|answerCallbackQuery)$/.test(method)) throw new Error('Unsupported method');
  const port = tunnelPort ? Number(tunnelPort) : 443;
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('Invalid transport port');
  const body = JSON.stringify(payload);
  return new Promise((resolve, reject) => {
    const req = request({ hostname:tunnelPort ? '127.0.0.1' : 'api.telegram.org', family:tunnelPort?4:Number(family), port, servername:'api.telegram.org', path:`/bot${token}/${method}`, method:'POST', timeout:15000,
      headers:{host:'api.telegram.org','content-type':'application/json','content-length':Buffer.byteLength(body)} }, res => {
      let data=''; res.setEncoding('utf8');
      res.on('data', chunk => { data+=chunk; if(data.length>65536) req.destroy(new Error('Response too large')); });
      res.on('end', () => { try { const value=JSON.parse(data); if(res.statusCode!==200 || !value.ok) throw new Error(); resolve(value.result); } catch { reject(new Error('Telegram request failed')); } });
    });
    req.on('timeout', () => req.destroy(new Error('timeout')));
    req.on('error', () => reject(new Error('Telegram connection unavailable'))); req.end(body);
  });
}
export function telegramUser(data, token, now=Date.now()) {
  if (!token || typeof data!=='string' || data.length>10000) throw new Error('TELEGRAM_AUTH');
  const params=new URLSearchParams(data); const keys=[...params.keys()]; const hash=params.get('hash');
  if(new Set(keys).size!==keys.length || !/^[a-f0-9]{64}$/.test(hash || '')) throw new Error('TELEGRAM_AUTH');
  params.delete('hash');
  const check=[...params].sort(([a],[b])=>a<b?-1:a>b?1:0).map(([k,v])=>`${k}=${v}`).join('\n');
  const key=createHmac('sha256','WebAppData').update(token).digest();
  const expected=createHmac('sha256',key).update(check).digest(); const time=Number(params.get('auth_date'))*1000;
  if(!timingSafeEqual(expected,Buffer.from(hash,'hex')) || !Number.isSafeInteger(time) || time>now+30000 || time<now-3600000) throw new Error('TELEGRAM_AUTH');
  let user; try { user=JSON.parse(params.get('user')); } catch { throw new Error('TELEGRAM_AUTH'); }
  if(!Number.isSafeInteger(user?.id) || user.id<1 || typeof user.first_name!=='string') throw new Error('TELEGRAM_AUTH'); return user;
}
export function openBotStore(db) {
  openMenuStore(db);
  db.exec(`CREATE TABLE IF NOT EXISTS bot_visitors(telegram_id INTEGER PRIMARY KEY,partner TEXT REFERENCES partners(code),created TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS bot_updates(update_id INTEGER PRIMARY KEY);
    CREATE TABLE IF NOT EXISTS bot_cursor(id INTEGER PRIMARY KEY CHECK(id=1),next_offset INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS bot_owner_candidate(id INTEGER PRIMARY KEY CHECK(id=1),telegram_id INTEGER NOT NULL);`);
}
export function rememberVisitor(db, userId, code='') {
  if (db.prepare('SELECT 1 FROM bot_partner_accounts WHERE telegram_id=? AND code=?').get(userId,code)) code='';
  const partner=/^[a-z0-9][a-z0-9-]{2,39}$/.test(code) && db.prepare('SELECT code FROM partners WHERE code=? AND active=1').get(code);
  db.prepare('INSERT OR IGNORE INTO bot_visitors VALUES(?,?,?)').run(userId,partner?.code || null,new Date().toISOString());
  return db.prepare('SELECT partner FROM bot_visitors WHERE telegram_id=?').get(userId)?.partner;
}
export function welcome(chatId, origin) {
  return welcomeMenu(chatId, origin);
}
export function createBotPoller(db, api, origin) {
  openBotStore(db); let busy=false,verified=false;
  return async () => {
    if(busy) return; busy=true;
    try {
      if(!verified) {
        const identity=await api('getMe',{}); if(identity.username?.toLowerCase()!=='lpsflowbot') throw new Error('Unexpected bot');
        if((await api('getWebhookInfo',{})).url) throw new Error('Another update consumer is configured'); verified=true;
      }
      const cursor=db.prepare('SELECT next_offset FROM bot_cursor WHERE id=1').get();
      const updates=await api('getUpdates',{...(cursor?{offset:cursor.next_offset}:{}),limit:1,timeout:5,allowed_updates:['message','callback_query']});
      if(!Array.isArray(updates)) throw new Error('Invalid updates');
      for(const update of updates) {
        if(!Number.isSafeInteger(update?.update_id) || update.update_id<0) throw new Error('Invalid update');
        if(update.callback_query && !db.prepare('SELECT 1 FROM bot_updates WHERE update_id=?').get(update.update_id)) {
          await menuCallback(db,api,update.callback_query,origin);
          db.prepare('INSERT INTO bot_updates VALUES(?)').run(update.update_id);
        }
        const m=update.message;
        const start=typeof m?.text==='string' && m.text.match(/^\/start(?:@lpsflowbot)?(?: ref_([a-z0-9][a-z0-9-]{2,39}))?$/i);
        if(start && m.chat?.type==='private' && m.from?.id===m.chat.id && !m.from.is_bot && Number.isSafeInteger(m.from.id) && m.from.id>0 && !db.prepare('SELECT 1 FROM bot_updates WHERE update_id=?').get(update.update_id)) {
          rememberVisitor(db,m.from.id,start[1] || ''); await api('sendMessage',welcomeMenu(m.chat.id,origin,botSettings(db)));
          if(m.from.username?.toLowerCase()==='lp_sergey') db.prepare('INSERT INTO bot_owner_candidate VALUES(1,?) ON CONFLICT(id) DO UPDATE SET telegram_id=excluded.telegram_id').run(m.from.id);
          db.prepare('INSERT INTO bot_updates VALUES(?)').run(update.update_id);
        }
        db.prepare('INSERT INTO bot_cursor VALUES(1,?) ON CONFLICT(id) DO UPDATE SET next_offset=excluded.next_offset').run(update.update_id+1);
      }
    } finally {busy=false;}
  };
}
