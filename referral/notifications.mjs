// A durable outbox: never make saving an enquiry depend on Telegram availability.
export function notificationText(lead) {
  return `Новая заявка MyWorld\nИмя: ${lead.name}\nTelegram: @${lead.contact}\nО проекте: ${lead.brief || 'не заполнено'}\nРекомендатель: ${lead.recommender || 'прямой переход'}\nЗаявка: ${lead.id}`;
}
export function createNotifier(db, { token = '', chatId = '', request = fetch, api } = {}) {
  let busy = false;
  const configured = /^[0-9]+:[A-Za-z0-9_-]+$/.test(token) && /^-?[0-9]+$/.test(chatId);
  return { configured, async flush() {
    if (!configured || busy) return;
    busy = true;
    try {
      const jobs = db.prepare(`SELECT n.*,l.name,l.contact,l.brief,p.name AS recommender FROM notifications n JOIN leads l ON l.id=n.lead_id LEFT JOIN partners p ON p.code=l.partner WHERE n.sent_at IS NULL AND n.next_attempt<=? ORDER BY l.created LIMIT 5`).all(Date.now());
      for (const job of jobs) {
        try {
          const payload = { chat_id: chatId, text: notificationText({ ...job, id: job.lead_id }), link_preview_options: { is_disabled: true } };
          const response = api ? null : await request(`https://api.telegram.org/bot${token}/sendMessage`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
            signal: AbortSignal.timeout(10000),
          });
          if (api) await api('sendMessage', payload);
          else { const result = await response.json(); if (!response.ok || result.ok !== true) throw new Error('delivery failed'); }
          db.prepare('UPDATE notifications SET sent_at=?,last_error=NULL WHERE lead_id=?').run(new Date().toISOString(), job.lead_id);
        } catch {
          // Never log the token, transport exception or private message content.
          const delay = Math.min(3600000, 30000 * 2 ** Math.min(job.attempts, 7));
          db.prepare('UPDATE notifications SET attempts=attempts+1,next_attempt=?,last_error=? WHERE lead_id=?').run(Date.now() + delay, 'Не доставлено; повторим автоматически', job.lead_id);
        }
      }
    } finally { busy = false; }
  } };
}
