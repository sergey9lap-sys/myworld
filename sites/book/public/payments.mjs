// Public invoices supplied by the organizer; no payment keys, amounts or paid-state logic.
export const paymentOptions=Object.freeze({
  solo:{id:'DcPY1nBgJka3xOSTkgmzDg',title:'Билет на одного · 4 990 Р',test:false},
  duo:{id:'kCF_VClF5kuziMJPCRwtmw',title:'Путешествие на двоих · 8 980 Р',test:false},
  test:{id:'5dXUIL7Shki2Utb203YJXQ',title:'Проверка оплаты · 10 Р',test:true}
});
export const invoiceUrl=key=>paymentOptions[key]?`https://auth.robokassa.ru/merchant/Invoice/${paymentOptions[key].id}`:null;
// Native required-checkbox forms in index.html navigate in the same top-level tab.
// No JavaScript interception, nested checkout frame or simulated payment success.
