import { readFileSync, writeFileSync, chmodSync } from 'node:fs';
import { telegramRequest } from '../telegram.mjs';
const path='/etc/myworld-referrals.env', original=readFileSync(path,'utf8');
const env=Object.fromEntries(original.split(/\r?\n/).filter(line=>/^[A-Z_]+=/.test(line)).map(line=>{const n=line.indexOf('=');return [line.slice(0,n),line.slice(n+1).replace(/^['"]|['"]$/g,'')];}));
const token=(process.env.MYWORLD_BOT_TOKEN || env.TELEGRAM_BOT_TOKEN || '').trim();
const transport={token,tunnelPort:env.TELEGRAM_API_TUNNEL_PORT,family:env.TELEGRAM_API_FAMILY || 6};
const bot=await telegramRequest('getMe',{},transport);
if(bot.username?.toLowerCase()!=='lpsflowbot') throw new Error('Другой бот; настройки не изменены');
if((await telegramRequest('getWebhookInfo',{},transport)).url) throw new Error('У бота уже есть другой обработчик; настройки не изменены');
await telegramRequest('setChatMenuButton',{menu_button:{type:'web_app',text:'Обсудить проект',web_app:{url:'https://space.lpsflow.ru/work/'}}},transport);
let output=original;
for(const [key,value] of Object.entries({TELEGRAM_BOT_TOKEN:token,TELEGRAM_UPDATE_MODE:'polling',TELEGRAM_API_FAMILY:'6'})) {
  const expression=new RegExp(`^${key}=.*$`,'m');output=expression.test(output)?output.replace(expression,`${key}=${value}`):output.trimEnd()+`\n${key}=${value}\n`;
}
writeFileSync(path,output,{mode:0o600});chmodSync(path,0o600);
console.log('Подключён @'+bot.username+'. Токен сохранён только на сервере.');
