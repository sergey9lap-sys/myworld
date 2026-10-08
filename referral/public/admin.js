let csrf = '', visitorCsrf = '';
const notice = document.querySelector('#dashboard-status');
const element = (tag, text, cls) => { const el = document.createElement(tag); if (text) el.textContent = text; if (cls) el.className = cls; return el; };
// Extend the existing paper-style dashboard; keep partner and enquiry sections intact.
const botSection=element('section','','admin-section');
botSection.append(element('h2','Приветствие в боте'),element('p','Здесь можно менять описание, услуги и ссылку на канал. Скидка на первый заказ — 30%; вознаграждения за рекомендации пока выключены.','admin-meta'));
const botForm=element('form','','bot-settings');botForm.id='bot-settings';
for (const [name,title,max,rows] of [['intro','Коротко о вас',700,3],['services','Услуги — каждая с новой строки',1400,6],['channel','Ссылка на Telegram-канал',100,0]]) {
  const label=element('label',title),input=element(rows?'textarea':'input');input.id='bot-'+name;input.name=name;input.maxLength=max;input.required=name!=='channel';label.htmlFor=input.id;
  if(rows)input.rows=rows;else{input.type='url';input.placeholder='https://t.me/имя_канала';}
  label.append(input);botForm.append(label);
}
const botStatus=element('p','','form-status');botStatus.id='bot-settings-status';botStatus.setAttribute('role','status');
const botSave=element('button','Сохранить приветствие','button');botSave.type='submit';botSave.append(document.querySelector('#partner-form button span').cloneNode(true));botForm.append(botStatus,botSave);botSection.append(botForm);
document.querySelector('#dashboard').prepend(botSection);
const bonusSection=element('section','','admin-section');bonusSection.append(element('h2','Приветственные скидки'),element('p','Отмечайте «Использована» после первого заказа со скидкой. Статус не подтверждает оплату автоматически. Последние 500 участников.','admin-meta'));
const bonusStatus=element('p','','form-status');bonusStatus.setAttribute('role','status');bonusSection.append(bonusStatus);
const bonusList=element('div');bonusList.id='bonuses';bonusSection.append(bonusList);document.querySelector('#dashboard').append(bonusSection);
async function post(path, body) {
  const response = await fetch(path, { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrf }, body: JSON.stringify(body) });
  const data = await response.json(); if (!response.ok) throw new Error(data.error || 'Не удалось выполнить действие.'); return data;
}
async function refresh() {
  const response = await fetch('/partners/api/data', { cache: 'no-store' });
  if (response.status === 401) { document.querySelector('#login').hidden = false; document.querySelector('#dashboard').hidden = true; return; }
  if (!response.ok) throw new Error('Не удалось загрузить кабинет. Попробуйте снова.');
  const data = await response.json(); csrf = data.csrf;
  document.querySelector('#login').hidden = true; document.querySelector('#dashboard').hidden = false;
  const settingsForm = document.querySelector('#bot-settings');
  if (!settingsForm.contains(document.activeElement)) for (const field of ['intro','services','channel']) settingsForm.elements[field].value = data.botSettings[field];
  const bonuses = document.querySelector('#bonuses'); bonuses.replaceChildren();
  if (!data.bonuses.length) bonuses.append(element('p','Бонусы пока никто не забрал. Здесь появятся участники, сохранившие скидку в боте.'));
  for (const bonus of data.bonuses) {
    const row=element('article','','lead-row'); row.append(element('h3',bonus.name));
    row.append(element('p',`${bonus.username ? '@'+bonus.username+' · ' : ''}Telegram ID ${bonus.telegram_id} · скидка ${bonus.discount}%`));
    row.append(element('p',new Date(bonus.created).toLocaleString('ru-RU'),'admin-meta'));
    const label=element('label','Статус скидки'), select=element('select');
    for (const [value,text] of [['claimed','Сохранена'],['used','Использована']]) { const option=element('option',text);option.value=value;option.selected=value===bonus.status;select.append(option); }
    select.addEventListener('change',async()=>{select.disabled=true;try{await post('/partners/api/bonus-status',{telegramId:bonus.telegram_id,status:select.value});bonusStatus.textContent='Статус скидки сохранён.';await refresh();}catch(error){select.value=bonus.status;bonusStatus.textContent=error.message;}finally{select.disabled=false;}});
    label.append(select);row.append(label);bonuses.append(row);
  }
  const partners = document.querySelector('#partners'); partners.replaceChildren();
  if (!data.partners.length) partners.append(element('p', 'Пока нет ссылок. Создайте первую выше.'));
  for (const partner of data.partners) {
    const row = element('div', '', 'partner-row'), info = element('div');
    info.append(element('strong', partner.name));
    const linkUrl = data.botUsername ? `https://t.me/${data.botUsername}?start=ref_${partner.code}` : `${location.origin}/r/${partner.code}`;
    const link = element('a', linkUrl); link.href = linkUrl; link.target = '_blank'; link.rel = 'noopener'; info.append(link);
    info.append(element('p', `Пришли в бота: ${partner.botVisitors || 0} · заявок: ${partner.leads} · оплачено: ${partner.paid || 0}`, 'admin-meta'));
    const copy = element('button', 'Скопировать', 'secondary'); copy.type = 'button'; copy.addEventListener('click', async () => { try { await navigator.clipboard.writeText(link.href); notice.textContent = 'Ссылка скопирована.'; } catch { notice.textContent = 'Выделите ссылку и скопируйте её вручную.'; } });
    row.append(info, copy); partners.append(row);
  }
  const leads = document.querySelector('#leads'); leads.replaceChildren();
  if (!data.leads.length) leads.append(element('p', 'Заявок пока нет. Здесь появятся настоящие обращения со страницы услуг.'));
  for (const lead of data.leads) {
    const row = element('article', '', 'lead-row'); row.append(element('h3', lead.name));
    const contact = element('a', `@${lead.contact}`); contact.href = `https://t.me/${lead.contact}`; contact.target = '_blank'; contact.rel = 'noopener'; row.append(contact);
    row.append(element('p', lead.brief || 'Описание не заполнено.'));
    row.append(element('p', `${new Date(lead.created).toLocaleString('ru-RU')} · ${lead.recommender ? `рекомендует ${lead.recommender}` : 'прямое обращение'}`, 'admin-meta'));
    const label = element('label', 'Статус заявки'), select = element('select');
    for (const [value, text] of [['new', 'Новая'], ['contacted', 'Связались'], ['paid', 'Оплачено'], ['closed', 'Закрыта']]) { const option = element('option', text); option.value = value; option.selected = value === lead.status; select.append(option); }
    select.addEventListener('change', async () => { select.disabled = true; try { await post('/partners/api/status', { id: lead.id, status: select.value }); notice.textContent = 'Статус сохранён.'; await refresh(); } catch (error) { select.value = lead.status; notice.textContent = error.message; } finally { select.disabled = false; } });
    label.append(select); row.append(label); leads.append(row);
  }
}
document.querySelector('#login-form').addEventListener('submit', async event => { event.preventDefault(); const status = document.querySelector('#login-status'), button = event.currentTarget.querySelector('button'); button.disabled = true; try { await post('/partners/api/login', { csrf: visitorCsrf, password: document.querySelector('#password').value }); document.querySelector('#password').value = ''; status.textContent = ''; await refresh(); } catch (error) { status.textContent = error.message; } finally { button.disabled = false; } });
document.querySelector('#password').addEventListener('input', () => document.querySelector('#login-status').textContent = '');
document.querySelector('#partner-form').addEventListener('submit', async event => { event.preventDefault(); const form = event.currentTarget, values = new FormData(form), button = form.querySelector('button'); button.disabled = true; try { await post('/partners/api/partner', { name: values.get('name'), code: values.get('code') }); form.reset(); await refresh(); notice.textContent = 'Персональная ссылка создана.'; } catch (error) { notice.textContent = error.message; } finally { button.disabled = false; } });
document.querySelector('#refresh').addEventListener('click', () => refresh().catch(error => notice.textContent = error.message));
document.querySelector('#logout').addEventListener('click', async () => { try { await post('/partners/api/logout', {}); await refresh(); } catch (error) { notice.textContent = error.message; } });
document.querySelector('#bot-settings').addEventListener('submit',async event=>{
  event.preventDefault();const form=event.currentTarget,button=form.querySelector('button'),status=document.querySelector('#bot-settings-status');button.disabled=true;
  try {await post('/partners/api/bot-settings',Object.fromEntries(new FormData(form)));status.textContent='Сохранено. Новое приветствие появится после /start в боте.';}
  catch(error){status.textContent=error.message;}finally{button.disabled=false;}
});
(async () => { try { const response = await fetch('/work/api/session', { cache: 'no-store' }); const data = await response.json(); visitorCsrf = data.csrf; await refresh(); } catch { document.querySelector('#login-status').textContent = 'Кабинет недоступен. Обновите страницу.'; } })();
