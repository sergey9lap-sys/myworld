import type { MetadataRoute } from 'next';
import seo from '../sites/ilmira/seo-config.json';

export default function sitemap(): MetadataRoute.Sitemap {
  return [{ url: seo.publicUrl, lastModified: new Date(seo.lastModified) }];
}
