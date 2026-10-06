let csrf = '', visitorCsrf = '';
const notice = document.querySelector('#dashboard-status');
const element = (tag, text, cls) => { const el = document.createElement(tag); if (text) el.textContent = text; if (cls) el.className = cls; return el; };
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
  const partners = document.querySelector('#partners'); partners.replaceChildren();
  if (!data.partners.length) partners.append(element('p', 'Пока нет ссылок. Создайте первую выше.'));
  for (const partner of data.partners) {
    const row = element('div', '', 'partner-row'), info = element('div');
    info.append(element('strong', partner.name));
    const link = element('a', `${location.origin}/r/${partner.code}`); link.href = `/r/${partner.code}`; link.target = '_blank'; link.rel = 'noopener'; info.append(link);
    info.append(element('p', `Открытий: ${partner.opens} · заявок: ${partner.leads} · оплачено: ${partner.paid || 0}`, 'admin-meta'));
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
(async () => { try { const response = await fetch('/work/api/session', { cache: 'no-store' }); const data = await response.json(); visitorCsrf = data.csrf; await refresh(); } catch { document.querySelector('#login-status').textContent = 'Кабинет недоступен. Обновите страницу.'; } })();
