import { randomBytes } from 'node:crypto';

export const defaultBotSettings = {
  intro: 'Я Сергей, веб-разработчик. Помогаю превратить вашу идею в сайт, Telegram-бот или мини-приложение.',
  services: '🌐 Дизайн и разработка сайтов, интернет-магазинов и личных кабинетов.\n🤖 Telegram-боты, мини-приложения и автоворонки.\n📄 Оформление лид-магнитов, PDF, чек-листов и других материалов.\n🎬 Монтаж видео.',
  channel: ''
};
const escape = text => text.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
export function openMenuStore(db) {
  db.exec(`CREATE TABLE IF NOT EXISTS bot_settings(id INTEGER PRIMARY KEY CHECK(id=1),value TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS bot_partner_accounts(telegram_id INTEGER PRIMARY KEY,code TEXT NOT NULL UNIQUE REFERENCES partners(code));
    CREATE TABLE IF NOT EXISTS bot_welcome_bonuses(telegram_id INTEGER PRIMARY KEY,name TEXT NOT NULL,username TEXT NOT NULL,discount INTEGER NOT NULL CHECK(discount=30),status TEXT NOT NULL DEFAULT 'claimed' CHECK(status IN ('claimed','used')),created TEXT NOT NULL);`);
}
export function botSettings(db) {
  const row = db.prepare('SELECT value FROM bot_settings WHERE id=1').get();
  return row ? JSON.parse(row.value) : { ...defaultBotSettings };
}
export function saveBotSettings(db, value) {
  if (!value || Object.keys(value).some(key => !['intro','services','channel'].includes(key)) ||
    typeof value.intro !== 'string' || !value.intro.trim() || value.intro.length > 700 ||
    typeof value.services !== 'string' || !value.services.trim() || value.services.length > 1400 ||
    typeof value.channel !== 'string' || (value.channel && !/^https:\/\/t\.me\/[A-Za-z][A-Za-z0-9_]{4,31}$/.test(value.channel))) throw new Error('Проверьте описание, список услуг и ссылку https://t.me/имя_канала.');
  const settings = { intro: value.intro.trim(), services: value.services.trim(), channel: value.channel };
  db.prepare('INSERT INTO bot_settings VALUES(1,?) ON CONFLICT(id) DO UPDATE SET value=excluded.value').run(JSON.stringify(settings));
  return settings;
}
export function welcomeMenu(chatId, origin, settings = defaultBotSettings) {
  return { chat_id: chatId, parse_mode: 'HTML', disable_web_page_preview: true,
    text: ['👋 Добрый день! Добро пожаловать в мой бот.', '', escape(settings.intro), '', '<b>Что можно заказать:</b>', escape(settings.services), '',
      'В этом боте вы можете открыть мою страницу: познакомиться со мной, посмотреть работы и оставить заявку.', '',
      '🎁 Для первого заказа есть <b>скидка 30%</b>. Нажмите «Забрать бонус», чтобы сохранить её за собой.', '',
      '👇 Откройте приложение или напишите мне — обсудим вашу идею.'].join('\n'),
    reply_markup: { inline_keyboard: [
      [{ text: '🎁 Забрать бонус −30%', style: 'success', callback_data: 'welcome_bonus' }, { text: '🔗 Моя ссылка', callback_data: 'my_referral' }],
      [{ text: 'Открыть приложение', style: 'primary', web_app: { url: new URL('/work/', origin).href } }],
      [{ text: '💬 Написать мне', url: 'https://t.me/lp_sergey' }],
      [settings.channel ? { text: 'Мой канал ↗', url: settings.channel } : { text: 'Мой канал · скоро', callback_data: 'channel_soon' }]
    ] } };
}
export function personalPartner(db, user) {
  const old = db.prepare('SELECT code FROM bot_partner_accounts WHERE telegram_id=?').get(user.id);
  if (old) return old.code;
  db.exec('BEGIN IMMEDIATE');
  try {
    const code = 'p-' + randomBytes(12).toString('hex');
    db.prepare('INSERT INTO partners(code,name,created) VALUES(?,?,?)').run(code, String(user.first_name || 'Участник').slice(0,100), new Date().toISOString());
    db.prepare('INSERT INTO bot_partner_accounts VALUES(?,?)').run(user.id,code);
    db.exec('COMMIT'); return code;
  } catch(error) { db.exec('ROLLBACK'); throw error; }
}
export async function menuCallback(db, api, callback, origin) {
  const user = callback.from, chat = callback.message?.chat;
  if (!user || !Number.isSafeInteger(user.id) || user.id < 1 || user.is_bot || chat?.type !== 'private' || chat.id !== user.id ||
    typeof callback.id !== 'string' || !callback.id || callback.id.length > 256 || callback.message?.from?.is_bot !== true || callback.message.from.username?.toLowerCase() !== 'lpsflowbot') return;
  if (!['welcome_bonus','my_referral','channel_soon'].includes(callback.data)) return;
  if (callback.data === 'channel_soon') {
    await api('answerCallbackQuery', { callback_query_id: callback.id, text: 'Ссылка на канал появится здесь скоро.', show_alert: true }); return;
  }
  let message;
  if (callback.data === 'welcome_bonus') {
    db.prepare('INSERT OR IGNORE INTO bot_welcome_bonuses(telegram_id,name,username,discount,created) VALUES(?,?,?,?,?)')
      .run(user.id,String(user.first_name || 'Участник').slice(0,100),/^[A-Za-z][A-Za-z0-9_]{4,31}$/.test(user.username || '') ? user.username : '',30,new Date().toISOString());
    const bonus = db.prepare('SELECT status FROM bot_welcome_bonuses WHERE telegram_id=?').get(user.id);
    message = { chat_id: user.id, text: bonus.status === 'used' ? 'Ваш приветственный бонус уже использован.' :
      '🎁 Ваш бонус сохранён: скидка 30% на первый заказ.\n\nНапишите мне, чтобы обсудить проект. Сообщите, что забрали бонус в боте — я проверю его и учту скидку при согласовании стоимости. Это скидка, не денежный баланс.',
      reply_markup: { inline_keyboard: [[{text:'💬 Написать мне',url:'https://t.me/lp_sergey'}],[{text:'Открыть приложение',web_app:{url:new URL('/work/',origin).href}}]] } };
  } else {
    const code = personalPartner(db,user), link = `https://t.me/lpsflowbot?start=ref_${code}`;
    message = { chat_id: user.id, disable_web_page_preview: true,
      text: `🔗 Ваша персональная ссылка для рекомендаций:\n\n${link}\n\nПоделитесь ею с теми, кому нужен сайт, бот или другой проект. Ссылка ведёт в этот бот и сохраняет вашу рекомендацию. Начисления и вознаграждения пока не включены.`,
      reply_markup: { inline_keyboard: [[{text:'Скопировать ссылку',copy_text:{text:link}}],[{text:'Поделиться',url:`https://t.me/share/url?url=${encodeURIComponent(link)}`}]] } };
  }
  await api('sendMessage',message);
  // A stale acknowledgement must not retry a message already delivered.
  try { await api('answerCallbackQuery',{callback_query_id:callback.id}); } catch {}
}
