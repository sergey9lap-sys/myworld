// Explicitly scoped to Sergey's existing space.lpsflow.ru host. No packages or servers are purchased.
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync, mkdirSync, copyFileSync, realpathSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { DatabaseSync } from 'node:sqlite';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const run = (program, args) => execFileSync(program, args, { stdio: 'inherit' });
if (process.getuid?.() !== 0 || root !== '/opt/myworld-referrals') throw new Error('Run only as root from the reviewed /opt/myworld-referrals release.');
const config = realpathSync('/etc/nginx/sites-enabled/space');
const original = readFileSync(config, 'utf8');
const anchor = '    server_name space.lpsflow.ru;';
if (!original.includes(anchor)) throw new Error('Unexpected server configuration; manual review required.');
const include = '    include /etc/nginx/myworld-referrals-locations.conf;';
if (!original.includes(include) && /location\s+(?:\^~\s+)?\/(?:work|r|partners)(?:\/|\s)/.test(original)) throw new Error('Existing routes conflict. Nothing changed.');
if (Number(process.versions.node.split('.')[0]) < 22) throw new Error('A runtime supporting node:sqlite is required; no automatic upgrade.');
const listeners = execFileSync('ss', ['-ltnp'], { encoding: 'utf8' });
if (/:4342\s/.test(listeners)) {
  let owned = false;
  try { owned = execFileSync('systemctl', ['is-active', 'myworld-referrals'], { encoding: 'utf8' }).trim() === 'active'; } catch {}
  if (!owned) throw new Error('Port 4342 is used by another service; nothing changed.');
}
try { execFileSync('id', ['myworldref'], { stdio: 'ignore' }); } catch { run('useradd', ['--system', '--home', '/var/lib/myworld-referrals', '--shell', '/usr/sbin/nologin', 'myworldref']); }
mkdirSync('/var/lib/myworld-referrals', { recursive: true, mode: 0o700 });
run('chown', ['myworldref:myworldref', '/var/lib/myworld-referrals']);
mkdirSync('/var/backups/myworld-referrals', { recursive: true, mode: 0o700 });
run('chown', ['myworldref:myworldref', '/var/backups/myworld-referrals']);
const backup = '/var/backups/myworld-referrals-' + Date.now();
mkdirSync(backup, { recursive: true, mode: 0o700 });
copyFileSync(config, backup + '/nginx-space');
if (existsSync('/var/lib/myworld-referrals/referrals.sqlite')) {
  const db = new DatabaseSync('/var/lib/myworld-referrals/referrals.sqlite');
  db.exec(`VACUUM INTO '${backup}/referrals.sqlite'`); db.close();
  for (const file of ['secret', 'admin-password.json']) if (existsSync('/var/lib/myworld-referrals/' + file)) copyFileSync('/var/lib/myworld-referrals/' + file, backup + '/' + file);
}
const env = '/etc/myworld-referrals.env';
if (!existsSync(env)) writeFileSync(env, 'NODE_ENV=production\nPUBLIC_ORIGIN=https://space.lpsflow.ru\nPORT=4342\nDATA_DIR=/var/lib/myworld-referrals\nMEDIA_DIR=/opt/myworld-referrals/public\n', { mode: 0o600 });
run('install', ['-m', '644', root + '/referral/deploy/myworld-referrals.service', '/etc/systemd/system/myworld-referrals.service']);
for (const unit of ['myworld-referrals-backup.service', 'myworld-referrals-backup.timer']) run('install', ['-m', '644', root + '/referral/deploy/' + unit, '/etc/systemd/system/' + unit]);
run('install', ['-m', '644', root + '/referral/deploy/nginx-locations.conf', '/etc/nginx/myworld-referrals-locations.conf']);
if (!original.includes(include)) writeFileSync(config, original.replace(anchor, anchor + '\n' + include));
try { run('nginx', ['-t']); } catch (error) { copyFileSync(backup + '/nginx-space', config); throw error; }
run('systemctl', ['daemon-reload']);
run('systemctl', ['enable', '--now', 'myworld-referrals']);
run('systemctl', ['restart', 'myworld-referrals']);
let healthy = false;
for (let attempt = 0; attempt < 20; attempt++) {
  try { const response = await fetch('http://127.0.0.1:4342/work/api/health', { signal: AbortSignal.timeout(1000) }); healthy = response.ok && (await response.json()).service === 'myworld-referrals'; } catch {}
  if (healthy) break;
  await new Promise(done => setTimeout(done, 500));
}
if (!healthy) { copyFileSync(backup + '/nginx-space', config); throw new Error('New service unhealthy. Nginx restored and not reloaded.'); }
run('systemctl', ['reload', 'nginx']);
run('systemctl', ['enable', '--now', 'myworld-referrals-backup.timer']);
console.log('Service installed; backups at ' + backup + '. Verify the public domain before sharing links.');
