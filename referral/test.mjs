import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { scryptSync } from 'node:crypto';
import { createApp, addPartner, validateLead, openStore, saveLead } from './server.mjs';
import { createNotifier, notificationText } from './notifications.mjs';

test('durable Telegram outbox retries without duplicate enquiries or exposing transport errors', async () => {
  const db = openStore(mkdtempSync(join(tmpdir(), 'myworld-outbox-')));
  const body = { name: 'Тест', contact: '@synthetic_test', brief: '', consent: true };
  const lead = saveLead(db, body);
  assert.equal(saveLead(db, body), lead);
  assert.equal(db.prepare('SELECT count(*) AS n FROM notifications').get().n, 1);
  const disabled = createNotifier(db);
  await disabled.flush(); assert.equal(disabled.configured, false);
  let calls = 0;
  const notifier = createNotifier(db, { token: '12345:synthetic_token', chatId: '12345', request: async (_url, options) => {
    calls++; assert.equal(JSON.parse(options.body).chat_id, '12345');
    if (calls === 1) throw new Error('private transport details');
    return { ok: true, json: async () => ({ ok: true }) };
  } });
  await notifier.flush();
  const job = db.prepare('SELECT * FROM notifications').get();
  assert.equal(job.sent_at, null); assert.equal(job.attempts, 1); assert.ok(!job.last_error.includes('private'));
  db.prepare('UPDATE notifications SET next_attempt=0').run();
  await notifier.flush(); await notifier.flush();
  assert.equal(calls, 2); assert.ok(db.prepare('SELECT sent_at FROM notifications').get().sent_at);
  assert.match(notificationText({ id: lead, ...body }), /не заполнено/);
  db.close();
});

test('referral API: attribution, durable leads, isolation, CSRF, validation and owner actions', async () => {
  const dataDir = mkdtempSync(join(tmpdir(), 'myworld-referral-test-'));
  const origin = 'http://127.0.0.1:4349';
  const { server, db } = createApp({ dataDir, origin, secure: false });
  addPartner(db, 'ilmira', 'Ильмира'); addPartner(db, 'other', 'Другой партнёр');
  await new Promise(done => server.listen(4349, '127.0.0.1', done));
  const get = (path, cookie = '') => fetch(origin + path, { headers: { cookie }, redirect: 'manual' });
  const post = (path, body, cookie = '', extra = {}) => fetch(origin + path, { method: 'POST', headers: { Origin: origin, 'Content-Type': 'application/json', cookie, ...extra }, body: JSON.stringify(body) });
  try {
    assert.equal((await get('/partners/api/data')).status, 401);
    assert.equal((await get('/r/missing')).status, 404);
    const pending = await get('/r/ilmira'); assert.equal(pending.headers.get('set-cookie'),null);
    assert.equal(pending.headers.get('location'), '/work/?ref=ilmira');
    const referral = await get('/r/ilmira','mw_preferences=recommendations'); assert.equal(referral.status, 302);
    assert.equal(referral.headers.get('location'), '/work/?ref=ilmira');
    const refCookie = referral.headers.get('set-cookie').split(';')[0];
    const second = await get('/r/other', refCookie); assert.equal(second.headers.get('set-cookie'), null);
    const session = await get('/work/api/session', refCookie);
    const data = await session.json(); assert.equal(data.recommender, 'Ильмира');
    const cookie = refCookie + '; ' + session.headers.get('set-cookie').split(';')[0];
    assert.equal((await post('/work/api/preferences',{csrf:data.csrf,recommendations:false})).status,403);
    const reject = await post('/work/api/preferences',{csrf:data.csrf,recommendations:false},cookie);
    assert.equal(reject.status,200); assert.ok(reject.headers.get('set-cookie').includes('mw_ref=;'));
    assert.equal((await (await get('/work/api/session',cookie+'; mw_preferences=essential')).json()).recommender,null);
    const allow = await post('/work/api/preferences',{csrf:data.csrf,recommendations:true,code:'ilmira'},cookie);
    assert.equal(allow.status,200); assert.ok(allow.headers.get('set-cookie').includes('mw_preferences=recommendations'));
    for(const path of ['/work/privacy/','/work/consent/','/work/cookies/']) {const doc=await get(path);assert.equal(doc.status,200);assert.match(await doc.text(),/Проект от 08.10.2026, не утверждён/);}
    const body = { name: 'Тестовый клиент', contact: '@synthetic_test', brief: '<script>no execution</script>', consent: true, website: '', csrf: data.csrf };
    assert.equal((await post('/work/api/lead', body)).status, 403);
    assert.equal((await post('/work/api/lead', { ...body, consent: false }, cookie)).status, 400);
    assert.equal((await post('/work/api/lead', { ...body, contact: '../bad' }, cookie)).status, 400);
    assert.equal((await post('/work/api/lead', body, cookie, { Origin: 'https://evil.example' })).status, 403);
    assert.equal((await post('/work/api/lead', body, cookie)).status, 201);
    assert.equal((await post('/work/api/lead', body, cookie)).status, 201);
    assert.equal(db.prepare('SELECT count(*) AS n FROM leads').get().n, 1);
    assert.equal(db.prepare('SELECT partner FROM leads').get().partner, 'ilmira');
    const tampered = refCookie.slice(0, -4) + 'xxxx';
    assert.equal((await (await get('/work/api/session', tampered)).json()).recommender, null);
    writeFileSync(join(dataDir, 'admin-password.json'), JSON.stringify({ salt: 'synthetic-only', hash: scryptSync('synthetic-test-password', 'synthetic-only', 64).toString('hex') }));
    assert.equal((await post('/partners/api/login', { csrf: data.csrf, password: 'wrong' }, cookie)).status, 401);
    const login = await post('/partners/api/login', { csrf: data.csrf, password: 'synthetic-test-password' }, cookie); assert.equal(login.status, 200);
    const adminCookie = login.headers.get('set-cookie').split(';')[0];
    const admin = await (await get('/partners/api/data', adminCookie)).json();
    assert.equal(admin.leads.length, 1);
    assert.equal((await post('/partners/api/partner', { code: 'client-one', name: 'Клиент' }, adminCookie)).status, 403);
    assert.equal((await post('/partners/api/partner', { code: 'client-one', name: 'Клиент' }, adminCookie, { 'X-CSRF-Token': admin.csrf })).status, 201);
    assert.equal((await post('/partners/api/status', { id: admin.leads[0].id, status: 'paid' }, adminCookie, { 'X-CSRF-Token': admin.csrf })).status, 200);
    const settings={intro:'Тестовое описание',services:'Сайты\nБоты',channel:'https://t.me/test_channel'};
    assert.equal((await post('/partners/api/bot-settings',settings,adminCookie)).status,403);
    assert.equal((await post('/partners/api/bot-settings',{...settings,channel:'https://evil.example'},adminCookie,{'X-CSRF-Token':admin.csrf})).status,400);
    assert.equal((await post('/partners/api/bot-settings',settings,adminCookie,{'X-CSRF-Token':admin.csrf})).status,200);
    db.prepare('INSERT INTO bot_welcome_bonuses(telegram_id,name,username,discount,created) VALUES(42,?,?,30,?)').run('Тест','test_user',new Date().toISOString());
    assert.equal((await post('/partners/api/bonus-status',{telegramId:42,status:'used'},adminCookie,{'X-CSRF-Token':admin.csrf})).status,200);
    assert.equal(db.prepare('SELECT status FROM bot_welcome_bonuses WHERE telegram_id=42').get().status,'used');
    assert.equal((await post('/partners/api/logout', {}, adminCookie, { 'X-CSRF-Token': admin.csrf })).status, 200);
    assert.equal((await get('/partners/api/data', adminCookie)).status, 401);
    assert.equal((await get('/work/')).headers.get('content-security-policy').includes('frame-ancestors https://web.telegram.org'), true);
    assert.equal((await get('/partners/')).headers.get('content-security-policy').includes("frame-ancestors 'none'"), true);
    assert.equal((await get('/work/../../server.mjs')).status, 404);
    assert.throws(() => validateLead({ ...body, website: 'bot' }));
    assert.match(readFileSync(new URL('./public/admin.js', import.meta.url), 'utf8'), /textContent/);
  } finally { await new Promise(done => server.close(done)); db.close(); }
  const reopened = createApp({ dataDir, origin, secure: false });
  assert.equal(reopened.db.prepare('SELECT count(*) AS n FROM leads').get().n, 1); reopened.db.close();
});

test('production-cookie policy and unknown contacts', () => {
  assert.throws(() => validateLead({ name: 'X', contact: '@username', consent: true }));
  assert.throws(() => validateLead({ name: 'Имя', contact: 'https://t.me/user', consent: true }));
  assert.throws(() => validateLead({ name: 'Имя', contact: '@username', consent: true, brief: 'x'.repeat(2001) }));
});
