import type { MetadataRoute } from 'next';
import seo from '../sites/ilmira/seo-config.json';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', disallow: '/p/', allow: ['/p/ilmira$', '/p/ilmira/', '/p/ilmira?'] },
    sitemap: new URL('/sitemap.xml', seo.publicUrl).href,
  };
}
