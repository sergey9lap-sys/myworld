import type { Metadata } from 'next';
import './globals.css';
import TelegramCanvasGuard from '../components/TelegramCanvasGuard';
export const metadata: Metadata = { title: 'Личный архив Сергея', description: 'Сайты, фотографии, мысли и немного кошки. Личный архив, который можно исследовать.' };
export default function Layout({children}: Readonly<{children: React.ReactNode}>) { return <html lang="ru"><body>{children}<TelegramCanvasGuard/></body></html> }
