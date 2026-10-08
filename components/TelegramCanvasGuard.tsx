'use client';
import Script from 'next/script';

// Only the Telegram container changes; the board itself keeps its gestures.
export default function TelegramCanvasGuard() {
  function initialise() {
    const tg=(window as Window & {Telegram?:{WebApp?:{initData?:string;ready:()=>void;expand:()=>void;isVersionAtLeast?:(version:string)=>boolean;disableVerticalSwipes?:()=>void}}}).Telegram?.WebApp;
    if(!tg?.initData) return;
    tg.ready();tg.expand();
    if(tg.isVersionAtLeast?.('7.7')) tg.disableVerticalSwipes?.();
  }
  return <Script src="https://telegram.org/js/telegram-web-app.js" strategy="afterInteractive" onReady={initialise}/>;
}
