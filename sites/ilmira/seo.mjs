import { readFile } from 'node:fs/promises';

export const config = JSON.parse(await readFile(new URL('./seo-config.json', import.meta.url), 'utf8'));
const parsed = new URL(config.publicUrl);
if (parsed.protocol !== 'https:' || parsed.search || parsed.hash || parsed.username || parsed.password) {
  throw new Error('SEO publicUrl must be a clean absolute HTTPS URL');
}
export const publicUrl = parsed.href;
const assetRoot = publicUrl.endsWith('/') ? publicUrl : `${publicUrl}/`;
const escape = value => value.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');

export function addSeo(html) {
  const title = html.match(/<title>(.*?)<\/title>/s)?.[1];
  const description = html.match(/<meta name="description" content="([^"]*)"/)?.[1];
  if (!title || !description || !html.includes('<!-- ILMIRA_SEO -->')) throw new Error('Missing SEO source metadata');
  const image = new URL('assets/hero.jpg', assetRoot).href;
  const graph = {
    '@context': 'https://schema.org',
    '@graph': [
      { '@type': 'Person', '@id': `${publicUrl}#person`, name: config.name, alternateName: 'Ильмира Ганеева', jobTitle: config.jobTitle,
        url: publicUrl, image, sameAs: ['https://t.me/Ilmirakirim', 'https://www.youtube.com/channel/UC8gE2sFN1QuCtX1hdNEyp-w'],
        email: 'ilmiraganeeva.com@yandex.ru', telephone: '+79174678700', areaServed: 'Worldwide', knowsLanguage: 'ru' },
      { '@type': 'WebSite', '@id': `${publicUrl}#website`, url: publicUrl, name: `${config.name} — стратегический консультант`, inLanguage: 'ru',
        publisher: { '@id': `${publicUrl}#person` } },
      { '@type': 'WebPage', '@id': `${publicUrl}#webpage`, url: publicUrl, name: title,
        description, inLanguage: 'ru', isPartOf: { '@id': `${publicUrl}#website` }, mainEntity: { '@id': `${publicUrl}#person` } },
      { '@type': 'Service', '@id': `${publicUrl}#service`, name: 'Стратегические консультации для предпринимателей и экспертов',
        description: 'Персональная стратегия роста в доходе, влиянии и масштабе с опорой на экономику, инвестиции и психологию.',
        provider: { '@id': `${publicUrl}#person` }, areaServed: 'Worldwide', availableChannel: { '@type': 'ServiceChannel', serviceUrl: `${publicUrl}#request`, availableLanguage: 'ru' } }
    ]
  };
  const metadata = [
    `<link rel="canonical" href="${escape(publicUrl)}">`,
    '<meta property="og:type" content="website">',
    '<meta property="og:locale" content="ru_RU">',
    `<meta property="og:url" content="${escape(publicUrl)}">`,
    `<meta property="og:title" content="${escape(title)}">`,
    `<meta property="og:description" content="${escape(description)}">`,
    `<meta property="og:image" content="${escape(image)}">`,
    `<meta property="og:image:alt" content="${escape(config.name)}">`,
    '<meta name="twitter:card" content="summary_large_image">',
    `<meta name="twitter:title" content="${escape(title)}">`,
    `<meta name="twitter:description" content="${escape(description)}">`,
    `<meta name="twitter:image" content="${escape(image)}">`,
    `<script type="application/ld+json">${JSON.stringify(graph).replaceAll('<', '\\u003c')}</script>`
  ].join('\n  ');
  return html.replace('<!-- ILMIRA_SEO -->', metadata);
}
export const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>${escape(publicUrl)}</loc></url></urlset>\n`;
export const robots = `User-agent: *\nAllow: /\nSitemap: ${new URL('sitemap.xml', assetRoot).href}\n`;
