const form = document.querySelector('#lead-form');
const status = document.querySelector('#form-status');
const submit = form.querySelector('button');
let csrf = '';
async function initialise() {
  try {
    const response = await fetch('/work/api/session', { cache: 'no-store' });
    if (!response.ok) throw new Error();
    const data = await response.json(); csrf = data.csrf;
    if (data.recommender) {
      document.querySelector('#invitation').textContent = `Вы здесь по рекомендации. Ваш рекомендатель: ${data.recommender}. Привет, я Сергей.`;
      const note = document.querySelector('#ref-note'); note.textContent = `Ваш рекомендатель: ${data.recommender}. Сохраним эту рекомендацию вместе с заявкой.`; note.hidden = false;
    }
    submit.disabled = false;
  } catch { status.textContent = 'Форма сейчас недоступна. Обновите страницу или напишите @lp_sergey в Telegram.'; }
}
form.addEventListener('submit', async event => {
  event.preventDefault(); if (!form.reportValidity() || !csrf) return;
  const values = new FormData(form); submit.disabled = true; status.textContent = 'Сохраняем заявку…';
  try {
    const response = await fetch('/work/api/lead', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ csrf, name: values.get('name'), contact: values.get('contact'), brief: values.get('brief'), website: values.get('website'), consent: values.get('consent') === 'on' }) });
    const data = await response.json(); if (!response.ok) throw new Error(data.error || 'Не удалось сохранить заявку. Попробуйте снова.');
    const message = `Добрый день, хотел бы обсудить сотрудничество.\nМеня зовут ${String(values.get('name')).trim()}.\nМой Telegram: ${String(values.get('contact')).trim()}.` + (String(values.get('brief')).trim() ? `\nО проекте: ${String(values.get('brief')).trim()}` : '');
    const telegramUrl = `https://t.me/lp_sergey?text=${encodeURIComponent(message)}`;
    form.hidden = true; const success = document.querySelector('#success'); success.hidden = false; success.setAttribute('tabindex', '-1'); success.querySelector('a').href = telegramUrl; success.focus();
    // The enquiry is safely persisted first. Telegram prepares a draft, never sends it.
    window.location.assign(telegramUrl);
  } catch (error) { status.textContent = error.message || 'Нет соединения. Проверьте интернет и попробуйте ещё раз.'; submit.disabled = false; }
});
initialise();
