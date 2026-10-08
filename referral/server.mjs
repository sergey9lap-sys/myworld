import http from 'node:http';
import { DatabaseSync } from 'node:sqlite';
import { randomBytes, createHmac, timingSafeEqual, scryptSync } from 'node:crypto';
import { mkdirSync, readFileSync, existsSync, writeFileSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createNotifier } from './notifications.mjs';
import { telegramRequest, telegramUser, openBotStore, rememberVisitor, createBotPoller } from './telegram.mjs';
import { botSettings, saveBotSettings } from './bot-menu.mjs';

const here = dirname(fileURLToPath(import.meta.url));
export function openStore(dataDir) {
  mkdirSync(dataDir, { recursive: true, mode: 0o700 });
  const db = new DatabaseSync(join(dataDir, 'referrals.sqlite'));
  db.exec(`PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000;
    CREATE TABLE IF NOT EXISTS partners(code TEXT PRIMARY KEY,name TEXT NOT NULL,active INTEGER NOT NULL DEFAULT 1,created TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS leads(id TEXT PRIMARY KEY,partner TEXT REFERENCES partners(code),name TEXT NOT NULL,contact TEXT NOT NULL,brief TEXT NOT NULL,status TEXT NOT NULL DEFAULT 'new',created TEXT NOT NULL,consent_version TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS visits(partner TEXT NOT NULL REFERENCES partners(code),day TEXT NOT NULL,count INTEGER NOT NULL DEFAULT 0,PRIMARY KEY(partner,day));
    CREATE TABLE IF NOT EXISTS sessions(token TEXT PRIMARY KEY,expires INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS limits(key TEXT PRIMARY KEY,count INTEGER NOT NULL,expires INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS notifications(lead_id TEXT PRIMARY KEY REFERENCES leads(id),attempts INTEGER NOT NULL DEFAULT 0,next_attempt INTEGER NOT NULL DEFAULT 0,sent_at TEXT,last_error TEXT);`);
  return db;
}
const id = () => randomBytes(24).toString('hex');
export const validCode = value => typeof value === 'string' && /^[a-z0-9][a-z0-9-]{2,39}$/.test(value);
export function addPartner(db, code, name) {
  if (!validCode(code) || typeof name !== 'string' || !name.trim() || name.length > 100) throw new Error('Проверьте имя и код: 3–40 латинских букв, цифр или дефисов.');
  db.prepare('INSERT INTO partners(code,name,created) VALUES(?,?,?)').run(code, name.trim(), new Date().toISOString());
}
export function validateLead(body) {
  if (body.website || body.consent !== true) throw new Error('Подтвердите согласие на обработку заявки.');
  const name = typeof body.name === 'string' ? body.name.trim() : '';
  const contact = typeof body.contact === 'string' ? body.contact.trim().replace(/^@/, '') : '';
  const brief = typeof body.brief === 'string' ? body.brief.trim() : '';
  if (name.length < 2 || name.length > 80 || /[\u0000-\u001f]/.test(name)) throw new Error('Укажите имя: от 2 до 80 символов.');
  if (!/^[a-zA-Z][a-zA-Z0-9_]{4,31}$/.test(contact)) throw new Error('Укажите имя пользователя Telegram, например @username.');
  if (brief.length > 2000 || /[\u0000-\u0008]/.test(brief)) throw new Error('Описание должно быть не длиннее 2000 символов.');
  return { name, contact, brief };
}
export function saveLead(db, body, partner) {
  const value = validateLead(body);
  const since = new Date(Date.now() - 86400000).toISOString();
  // Repeated submits do not create duplicate leads or change the first recommender.
  db.exec('BEGIN IMMEDIATE');
  try {
    const previous = db.prepare('SELECT id FROM leads WHERE lower(contact)=lower(?) AND created>? ORDER BY created LIMIT 1').get(value.contact, since);
    if (previous) { db.exec('COMMIT'); return previous.id; }
    const leadId = id();
    db.prepare('INSERT INTO leads(id,partner,name,contact,brief,created,consent_version) VALUES(?,?,?,?,?,?,?)')
      .run(leadId, partner || null, value.name, value.contact, value.brief, new Date().toISOString(), '2026-10-08-draft-v2');
    db.prepare('INSERT INTO notifications(lead_id) VALUES(?)').run(leadId);
    db.exec('COMMIT'); return leadId;
  } catch (error) { db.exec('ROLLBACK'); throw error; }
}

export function createApp({ dataDir, origin, secure = true, mediaDir = resolve(here, '../public'), telegram = {} }) {
  const db = openStore(dataDir);
  openBotStore(db);
  const notifier = createNotifier(db, { ...telegram, ...(telegram.token ? {api:(method,payload)=>telegramRequest(method,payload,telegram)} : {}) });
  const notificationTimer = setInterval(() => { void notifier.flush(); }, 30000);
  notificationTimer.unref();
  const secretPath = join(dataDir, 'secret');
  if (!existsSync(secretPath)) writeFileSync(secretPath, id() + id(), { mode: 0o600, flag: 'wx' });
  const secret = readFileSync(secretPath, 'utf8').trim();
  const mac = value => createHmac('sha256', secret).update(value).digest('hex');
  const equal = (a, b) => typeof a === 'string' && typeof b === 'string' && Buffer.byteLength(a) === Buffer.byteLength(b) && timingSafeEqual(Buffer.from(a), Buffer.from(b));
  const signed = value => `${Buffer.from(JSON.stringify(value)).toString('base64url')}.${mac(JSON.stringify(value))}`;
  const verify = raw => { try { const [encoded, signature] = (raw || '').split('.'); const json = Buffer.from(encoded, 'base64url').toString(); if (!equal(mac(json), signature)) return null; const value = JSON.parse(json); return value.exp > Date.now() ? value : null; } catch { return null; } };
  const cookie = (name, value, seconds) => `${name}=${value}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${seconds}${secure ? '; Secure' : ''}`;
  const limiter = (key, max, duration) => {
    const now = Date.now(); db.prepare('DELETE FROM limits WHERE expires<?').run(now);
    db.prepare('INSERT INTO limits(key,count,expires) VALUES(?,1,?) ON CONFLICT(key) DO UPDATE SET count=count+1').run(key, now + duration);
    return db.prepare('SELECT count FROM limits WHERE key=?').get(key).count <= max;
  };
  const server = http.createServer(async (req, res) => {
    const url = new URL(req.url, origin);
    const cookies = Object.fromEntries((req.headers.cookie || '').split(';').filter(s => s.includes('=')).map(s => { const i = s.indexOf('='); return [s.slice(0, i).trim(), s.slice(i + 1)]; }));
    const visitor = verify(cookies.mw_visitor);
    const attribution = cookies.mw_preferences === 'essential' ? null : verify(cookies.mw_ref);
    const partner = attribution && db.prepare('SELECT code,name FROM partners WHERE code=? AND active=1').get(attribution.code);
    const address = req.socket.remoteAddress || 'unknown'; // Never trust public X-Forwarded-For; nginx passes one sanitized value below.
    const clientIp = address === '127.0.0.1' || address === '::ffff:127.0.0.1' ? (req.headers['x-real-ip'] || address) : address;
    const ipKey = mac(String(clientIp) + new Date().toISOString().slice(0, 10));
    res.setHeader('X-Content-Type-Options', 'nosniff'); res.setHeader('Referrer-Policy', 'same-origin');
    res.setHeader('Content-Security-Policy', `default-src 'self'; script-src 'self'${url.pathname.startsWith('/work/') ? ' https://telegram.org' : ''}; style-src 'self'; img-src 'self'; font-src 'self'; connect-src 'self'; frame-ancestors ${url.pathname.startsWith('/work/') ? 'https://web.telegram.org' : "'none'"}; base-uri 'none'; form-action 'self'`);
    res.setHeader('Cache-Control', 'no-store');
    const json = (status, value) => { res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' }); res.end(JSON.stringify(value)); };
    const adminToken = cookies.mw_admin;
    const admin = adminToken && /^[a-f0-9]{48}$/.test(adminToken) && db.prepare('SELECT token FROM sessions WHERE token=? AND expires>?').get(mac(adminToken), Date.now());
    try {
      if (!secure && req.method === 'GET' && url.pathname === '/') { res.writeHead(302, { Location: 'http://127.0.0.1:4190/' }); return res.end(); }
      if (req.method === 'GET' && url.pathname.startsWith('/r/')) {
        const code = url.pathname.slice(3).replace(/\/$/, '');
        const found = validCode(code) && db.prepare('SELECT code FROM partners WHERE code=? AND active=1').get(code);
        if (!found) return json(404, { error: 'Ссылка не найдена. Попросите отправителя проверить её.' });
        if (limiter(`visit:${ipKey}`, 50, 3600000)) db.prepare('INSERT INTO visits(partner,day,count) VALUES(?,?,1) ON CONFLICT(partner,day) DO UPDATE SET count=count+1').run(code, new Date().toISOString().slice(0,10));
        if (!partner && cookies.mw_preferences === 'recommendations') res.setHeader('Set-Cookie', cookie('mw_ref', signed({ code, exp: Date.now() + 30 * 86400000 }), 30 * 86400));
        res.writeHead(302, { Location: telegram.polling ? `https://t.me/lpsflowbot?start=ref_${code}` : `/work/?ref=${code}` }); return res.end();
      }
      if (req.method === 'GET' && url.pathname === '/work/api/session') {
        let current = visitor;
        if (!current) { current = { token: id(), exp: Date.now() + 3600000 }; res.setHeader('Set-Cookie', cookie('mw_visitor', signed(current), 3600)); }
        return json(200, { csrf: current.token, recommender: partner?.name || null, cookieChoice:['essential','recommendations'].includes(cookies.mw_preferences)?cookies.mw_preferences:null });
      }
      if (req.method === 'GET' && url.pathname === '/work/api/health') return json(200, { ok: true, service: 'myworld-referrals' });
      if (req.method === 'POST') {
        if (req.headers.origin !== origin || !/^application\/json(?:;|$)/i.test(req.headers['content-type'] || '')) return json(403, { error: 'Обновите страницу и попробуйте снова.' });
        if (!limiter(`post:${ipKey}`, 30, 3600000)) return json(429, { error: 'Слишком много попыток. Попробуйте через час.' });
        const chunks = []; let length = 0;
        for await (const chunk of req) { length += chunk.length; if (length > 8192) { json(413, { error: 'Сообщение слишком большое.' }); return; } chunks.push(chunk); }
        let body; try { body = JSON.parse(Buffer.concat(chunks).toString()); } catch { return json(400, { error: 'Не удалось прочитать запрос.' }); }
        if (url.pathname === '/work/api/preferences') {
          if (!visitor || !equal(body.csrf,visitor.token) || typeof body.recommendations !== 'boolean') return json(403,{error:'Обновите страницу.'});
          const values=[cookie('mw_preferences',body.recommendations?'recommendations':'essential',180*86400)];
          const chosen=body.recommendations && validCode(body.code) && db.prepare('SELECT code FROM partners WHERE code=? AND active=1').get(body.code);
          if(!body.recommendations) values.push(cookie('mw_ref','',0));
          else if(!partner && chosen) values.push(cookie('mw_ref',signed({code:chosen.code,exp:Date.now()+30*86400000}),30*86400));
          res.setHeader('Set-Cookie',values); return json(200,{ok:true});
        }
        if (url.pathname === '/work/api/telegram') {
          if (!visitor || !equal(body.csrf,visitor.token)) return json(403,{error:'Обновите страницу.'});
          try {
            const user=telegramUser(body.initData,telegram.token);
            const code=rememberVisitor(db,user.id,partner?.code || '');
            if(code && cookies.mw_preferences === 'recommendations') res.setHeader('Set-Cookie',cookie('mw_ref',signed({code,exp:Date.now()+30*86400000}),30*86400));
            return json(200,{name:user.first_name,username:/^[A-Za-z][A-Za-z0-9_]{4,31}$/.test(user.username || '')?user.username:'',referralCode:code || ''});
          } catch { return json(401,{error:'Закройте страницу и откройте её снова кнопкой в боте.'}); }
        }
        if (url.pathname === '/work/api/lead') {
          if (!visitor || !equal(body.csrf, visitor.token)) return json(403, { error: 'Обновите страницу: срок формы закончился.' });
          if (!limiter(`lead:${ipKey}`, 6, 3600000)) return json(429, { error: 'Слишком много заявок. Попробуйте через час.' });
          try { saveLead(db, body, partner?.code); } catch (error) { return json(400, { error: error.message }); }
          void notifier.flush();
          return json(201, { ok: true });
        }
        if (url.pathname === '/partners/api/login') {
          if (!visitor || !equal(body.csrf, visitor.token)) return json(403, { error: 'Обновите страницу.' });
          if (!limiter(`login:${ipKey}`, 5, 900000)) return json(429, { error: 'Повторите вход через 15 минут.' });
          const passwordPath = join(dataDir, 'admin-password.json');
          if (!existsSync(passwordPath)) return json(503, { error: 'Вход ещё не настроен оператором.' });
          const record = JSON.parse(readFileSync(passwordPath, 'utf8'));
          const password = typeof body.password === 'string' && body.password.length <= 200 ? body.password : '';
          if (!equal(scryptSync(password, record.salt, 64).toString('hex'), record.hash)) return json(401, { error: 'Неверный пароль.' });
          const token = id(); db.prepare('DELETE FROM sessions WHERE expires<?').run(Date.now());
          db.prepare('INSERT INTO sessions(token,expires) VALUES(?,?)').run(mac(token), Date.now() + 8 * 3600000);
          res.setHeader('Set-Cookie', cookie('mw_admin', token, 8 * 3600)); return json(200, { ok: true });
        }
        if (url.pathname.startsWith('/partners/api/')) {
          if (!admin || !equal(req.headers['x-csrf-token'], mac(adminToken))) return json(403, { error: 'Войдите в кабинет снова.' });
          if (url.pathname === '/partners/api/bot-settings') {
            try { saveBotSettings(db,body); } catch(error) { return json(400,{error:error.message}); }
            return json(200,{ok:true});
          }
          if (url.pathname === '/partners/api/bonus-status') {
            if (!Number.isSafeInteger(body.telegramId) || body.telegramId < 1 || !['claimed','used'].includes(body.status)) return json(400,{error:'Проверьте участника и статус бонуса.'});
            const result=db.prepare('UPDATE bot_welcome_bonuses SET status=? WHERE telegram_id=?').run(body.status,body.telegramId);
            return json(result.changes ? 200 : 404,{ok:!!result.changes});
          }
          if (url.pathname === '/partners/api/logout') { db.prepare('DELETE FROM sessions WHERE token=?').run(mac(adminToken)); res.setHeader('Set-Cookie', cookie('mw_admin', '', 0)); return json(200, { ok: true }); }
          if (url.pathname === '/partners/api/partner') { try { addPartner(db, body.code, body.name); } catch { return json(400, { error: 'Проверьте имя и код. Возможно, такой код уже есть.' }); } return json(201, { ok: true }); }
          if (url.pathname === '/partners/api/status') {
            if (!['new', 'contacted', 'paid', 'closed'].includes(body.status)) return json(400, { error: 'Неизвестный статус.' });
            const result = db.prepare('UPDATE leads SET status=? WHERE id=?').run(body.status, String(body.id));
            return json(result.changes ? 200 : 404, { ok: !!result.changes });
          }
        }
        return json(404, { error: 'Не найдено.' });
      }
      if (req.method === 'GET' && url.pathname === '/partners/api/data') {
        if (!admin) return json(401, { error: 'Нужно войти.' });
        return json(200, { csrf: mac(adminToken), botUsername:telegram.polling?'lpsflowbot':null,
          botSettings:botSettings(db), bonuses:db.prepare('SELECT * FROM bot_welcome_bonuses ORDER BY created DESC LIMIT 500').all(),
          partners: db.prepare('SELECT p.*,count(l.id) AS leads,sum(CASE WHEN l.status=\'paid\' THEN 1 ELSE 0 END) AS paid,(SELECT coalesce(sum(count),0) FROM visits WHERE partner=p.code) AS opens,(SELECT count(*) FROM bot_visitors WHERE partner=p.code) AS botVisitors FROM partners p LEFT JOIN leads l ON l.partner=p.code GROUP BY p.code ORDER BY p.created DESC').all(), leads: db.prepare('SELECT l.*,p.name AS recommender FROM leads l LEFT JOIN partners p ON l.partner=p.code ORDER BY l.created DESC LIMIT 500').all() });
      }
      if (req.method !== 'GET' && req.method !== 'HEAD') return json(405, { error: 'Метод недоступен.' });
      const files = { '/work/': ['index.html', 'text/html'], '/work/privacy/':['privacy.html','text/html'], '/work/consent/':['consent.html','text/html'], '/work/cookies/':['cookies.html','text/html'], '/partners/': ['admin.html', 'text/html'], '/work/style.css': ['style.css', 'text/css'], '/work/page.js': ['page.js', 'text/javascript'], '/partners/admin.js': ['admin.js', 'text/javascript'] };
      if (url.pathname === '/work/media/sergey-japan.png') { res.writeHead(200, { 'Content-Type':'image/png', 'Cache-Control':'public,max-age=86400' }); return res.end(readFileSync(join(mediaDir, 'media/sergey-japan.png'))); }
      let file = files[url.pathname];
      if (file) { const bytes = readFileSync(join(here, 'public', file[0])); res.writeHead(200, { 'Content-Type': `${file[1]}; charset=utf-8` }); return res.end(req.method === 'HEAD' ? undefined : bytes); }
      const media = { '/work/media/japanese-scroll-v1.webp':['media/japanese-scroll-v1.webp','image/webp'], '/work/media/tsuba-frame-v1.webp':['media/tsuba-frame-v1.webp','image/webp'], '/work/media/katana-v1.webp':['media/katana-v1.webp','image/webp'], '/work/media/closeup.jpg':['media/closeup.jpg','image/jpeg'], '/work/media/portrait.jpg': ['media/portrait.jpg', 'image/jpeg'], '/work/media/sakura.jpg': ['media/sakura.jpg', 'image/jpeg'], '/work/media/washi-world.png': ['media/washi-world.png', 'image/png'], '/work/fonts/manrope-cyrillic.woff2': ['fonts/manrope-cyrillic.woff2', 'font/woff2'], '/work/fonts/manrope-latin.woff2': ['fonts/manrope-latin.woff2', 'font/woff2'], '/work/fonts/unbounded-cyrillic.woff2': ['fonts/unbounded-cyrillic.woff2', 'font/woff2'], '/work/fonts/unbounded-latin.woff2': ['fonts/unbounded-latin.woff2', 'font/woff2'] }[url.pathname];
      if (media) { res.writeHead(200, { 'Content-Type': media[1], 'Cache-Control': 'public,max-age=86400' }); return res.end(readFileSync(join(mediaDir, media[0]))); }
      return json(404, { error: 'Не найдено.' });
    } catch { if (!res.headersSent) json(500, { error: 'Не удалось сохранить. Попробуйте позже.' }); else res.end(); }
  });
  let pollTimer; let stopped=false;
  if (telegram.polling && telegram.token) {
    const poll=createBotPoller(db,(method,payload)=>telegramRequest(method,payload,telegram),origin);
    const tick=async()=>{let delay=250;try{await poll();}catch{delay=10000;console.error('MyWorld bot unavailable; retrying');}if(!stopped){pollTimer=setTimeout(tick,delay);pollTimer.unref();}};
    void tick();
  }
  server.on('close', () => { stopped=true;clearTimeout(pollTimer);clearInterval(notificationTimer); });
  return { server, db };
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const port = Number(process.env.PORT || 4342);
  const origin = process.env.PUBLIC_ORIGIN || `http://127.0.0.1:${port}`;
  if (process.env.NODE_ENV === 'production' && !origin.startsWith('https://')) throw new Error('Production requires HTTPS PUBLIC_ORIGIN.');
  const app = createApp({ dataDir: process.env.DATA_DIR || resolve(here, '.data'), origin, secure: origin.startsWith('https://'), mediaDir: process.env.MEDIA_DIR || resolve(here, '../public'), telegram: { token: process.env.TELEGRAM_BOT_TOKEN, chatId: process.env.TELEGRAM_OWNER_CHAT_ID, tunnelPort: process.env.TELEGRAM_API_TUNNEL_PORT, family:process.env.TELEGRAM_API_FAMILY || 0, polling: process.env.TELEGRAM_UPDATE_MODE === 'polling' } });
  app.server.listen(port, '127.0.0.1', () => console.log(`MyWorld referrals: ${origin}/work/`));
}
