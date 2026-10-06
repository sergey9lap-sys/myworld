import { openStore, addPartner } from './server.mjs';
import { randomBytes, scryptSync } from 'node:crypto';
import { writeFileSync, existsSync } from 'node:fs';
import { resolve, join } from 'node:path';
const dataDir = process.env.DATA_DIR || resolve('referral/.data');
const db = openStore(dataDir);
const [command, code, name] = process.argv.slice(2);
if (command === 'partner') { addPartner(db, code, name); console.log(`Создана ссылка: ${process.env.PUBLIC_ORIGIN || 'http://127.0.0.1:4342'}/r/${code}`); }
else if (command === 'setup') {
  const path = join(dataDir, 'admin-password.json');
  if (existsSync(path)) throw new Error('Пароль уже настроен. Существующий доступ не изменён.');
  const password = randomBytes(24).toString('base64url'), salt = randomBytes(32).toString('hex');
  writeFileSync(path, JSON.stringify({ salt, hash: scryptSync(password, salt, 64).toString('hex') }), { mode: 0o600, flag: 'wx' });
  writeFileSync(join(dataDir, 'owner-access.txt'), `Кабинет: ${process.env.PUBLIC_ORIGIN || 'http://127.0.0.1:4342'}/partners/\nПароль: ${password}\nХраните файл приватно. Не передавайте партнёрам.\n`, { mode: 0o600, flag: 'wx' });
  console.log('Доступ сохранён в приватном owner-access.txt. Пароль не выводится в журнал.');
} else if (command === 'list') console.table(db.prepare('SELECT code,name,active FROM partners').all());
else throw new Error('Команды: setup | partner CODE NAME | list');
db.close();
