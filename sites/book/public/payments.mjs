// Public invoices supplied by the organizer; no payment keys, amounts or paid-state logic.
export const paymentOptions=Object.freeze({
  solo:{id:'DcPY1nBgJka3xOSTkgmzDg',title:'Билет на одного · 4 990 Р',test:false},
  duo:{id:'35Vu3FnlHEaj5C-T3T898Q',title:'Путешествие на двоих · 8 980 Р',test:false},
  test:{id:'jz5rphMXq0uM4AYTCUEX2w',title:'Проверка оплаты · 10 Р',test:true}
});
export const invoiceUrl=key=>paymentOptions[key]?`https://auth.robokassa.ru/merchant/Invoice/${paymentOptions[key].id}`:null;
// Native required-checkbox forms in index.html open a new top-level tab with noopener noreferrer.
// No JavaScript interception, nested checkout frame or simulated payment success.
