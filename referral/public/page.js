const form = document.querySelector('#lead-form');
const status = document.querySelector('#form-status');
const submit = form.querySelector('button');
let csrf = '';
let pendingRecommendation = new URLSearchParams(location.search).get('ref') || '';
const cookieNotice = document.querySelector('#cookie-notice');
document.querySelector('#cookie-settings')?.addEventListener('click', () => { cookieNotice.hidden = false; cookieNotice.querySelector('button')?.focus({preventScroll:true}); });
for (const button of document.querySelectorAll('[data-cookie-choice]')) button.addEventListener('click',async()=>{
  const buttons=[...document.querySelectorAll('[data-cookie-choice]')]; buttons.forEach(item=>item.disabled=true);
  try {
    const response=await fetch('/work/api/preferences',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({csrf,recommendations:button.dataset.cookieChoice==='recommendations',code:pendingRecommendation})});
    if(!response.ok) throw new Error();
    cookieNotice.hidden=true;
  } catch { document.querySelector('#cookie-status').textContent='Не удалось сохранить выбор. Обновите страницу и попробуйте ещё раз.'; }
  finally {buttons.forEach(item=>item.disabled=false);}
});
async function initialise() {
  try {
    const response = await fetch('/work/api/session', { cache: 'no-store' });
    if (!response.ok) throw new Error();
    const data = await response.json(); csrf = data.csrf;
    if(cookieNotice) cookieNotice.hidden=!!data.cookieChoice;
    const tg = window.Telegram?.WebApp;
    if (tg?.initData) {
      tg.ready(); tg.expand();
      if(tg.isVersionAtLeast?.('7.7')) tg.disableVerticalSwipes?.();
      const identity = await fetch('/work/api/telegram', {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({csrf,initData:tg.initData})});
      if(!identity.ok) throw new Error();
      const own = await identity.json();
      if(own.referralCode) pendingRecommendation=own.referralCode;
      if(!form.elements.name.value) form.elements.name.value=own.name;
      if(!form.elements.contact.value && own.username) form.elements.contact.value='@'+own.username;
    }
    // Referral attribution is private server-side bookkeeping, not visitor-facing copy.
    submit.disabled = false;
  } catch { status.textContent = 'Форма сейчас недоступна. Обновите страницу или напишите @lp_sergey в Телеграм.'; }
}
form.addEventListener('submit', async event => {
  event.preventDefault(); if (!form.reportValidity() || !csrf) return;
  const values = new FormData(form); submit.disabled = true; status.textContent = 'Сохраняем заявку…';
  try {
    const response = await fetch('/work/api/lead', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ csrf, name: values.get('name'), contact: values.get('contact'), brief: values.get('brief'), website: values.get('website'), consent: values.get('consent') === 'on' }) });
    const data = await response.json(); if (!response.ok) throw new Error(data.error || 'Не удалось сохранить заявку. Попробуйте снова.');
    const message = `Добрый день, хотел бы обсудить сотрудничество.\nМеня зовут ${String(values.get('name')).trim()}.\nМой Телеграм: ${String(values.get('contact')).trim()}.` + (String(values.get('brief')).trim() ? `\nО проекте: ${String(values.get('brief')).trim()}` : '');
    const telegramUrl = `https://t.me/lp_sergey?text=${encodeURIComponent(message)}`;
    form.hidden = true; const success = document.querySelector('#success'); success.hidden = false; success.setAttribute('tabindex', '-1'); success.querySelector('a').href = telegramUrl; success.focus();
    // The enquiry is safely persisted first. Telegram prepares a draft, never sends it.
    if(window.Telegram?.WebApp?.initData) window.Telegram.WebApp.openTelegramLink(telegramUrl);
    else window.location.assign(telegramUrl);
  } catch (error) { status.textContent = error.message || 'Нет соединения. Проверьте интернет и попробуйте ещё раз.'; submit.disabled = false; }
});
initialise();
