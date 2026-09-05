import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = { title: 'Личный архив Сергея', description: 'Сайты, фотографии, мысли и немного кошки. Личный архив, который можно исследовать.' };
export default function Layout({children}: Readonly<{children: React.ReactNode}>) { return <html lang="ru"><body>{children}</body></html> }
