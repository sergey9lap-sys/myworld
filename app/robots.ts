import type { MetadataRoute } from 'next';
import seo from '../sites/ilmira/seo-config.json';

export default function robots(): MetadataRoute.Robots {
  const routeRule = { disallow: '/p/', allow: ['/p/ilmira$', '/p/ilmira/', '/p/ilmira?'] };
  return {
    rules: [
      { userAgent: '*', ...routeRule },
      { userAgent: 'OAI-SearchBot', ...routeRule },
      { userAgent: 'ChatGPT-User', ...routeRule },
      { userAgent: 'GPTBot', ...routeRule },
      { userAgent: 'Google-Extended', ...routeRule },
    ],
    sitemap: new URL('/sitemap.xml', seo.publicUrl).href,
  };
}
