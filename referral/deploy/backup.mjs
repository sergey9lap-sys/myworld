import { DatabaseSync } from 'node:sqlite';
import { mkdirSync, copyFileSync, chmodSync, existsSync } from 'node:fs';
const source = '/var/lib/myworld-referrals';
const root = '/var/backups/myworld-referrals';
if (process.platform !== 'linux' || !existsSync(source + '/referrals.sqlite')) throw new Error('Only the installed MyWorld referral service can be backed up.');
const destination = root + '/' + new Date().toISOString().replace(/[:.]/g, '-');
mkdirSync(destination, { recursive: true, mode: 0o700 });
const db = new DatabaseSync(source + '/referrals.sqlite');
db.exec(`VACUUM INTO '${destination}/referrals.sqlite'`); db.close();
chmodSync(destination + '/referrals.sqlite', 0o600);
for (const file of ['secret', 'admin-password.json']) if (existsSync(source + '/' + file)) { copyFileSync(source + '/' + file, destination + '/' + file); chmodSync(destination + '/' + file, 0o600); }
console.log('Closed backup created: ' + destination);
