import React, { useEffect } from 'react';
import { useSite } from '../context/SiteContext';

interface DynamicSEOProps {
  pageKey?: string;
  customTitle?: string;
  customDescription?: string;
  customImage?: string;
}

function setMetaTag(attr: 'name' | 'property', key: string, content: string): void {
  if (!content) return;
  let el = document.querySelector(`meta[${attr}="${key}"]`) as HTMLMetaElement | null;
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

export const DynamicSEO: React.FC<DynamicSEOProps> = ({
  pageKey,
  customTitle,
  customDescription,
  customImage,
}) => {
  const { data } = useSite();

  useEffect(() => {
    if (!data) return;

    const matched = pageKey ? data.seo.find((s) => s.pageKey === pageKey) : undefined;
    const title =
      customTitle ||
      matched?.title ||
      `${data.settings.siteName} — Lahore Property & Al Jalil Garden`;
    const description =
      customDescription ||
      matched?.description ||
      data.settings.tagline;
    const keywords = matched?.keywords || 'Al Amaan Real Estate, Al Jalil Garden Lahore, plots in Lahore';
    const ogImage = customImage || matched?.ogImage || data.content.heroImage;

    document.title = title;
    setMetaTag('name', 'description', description);
    setMetaTag('name', 'keywords', keywords);
    setMetaTag('property', 'og:title', title);
    setMetaTag('property', 'og:description', description);
    setMetaTag('property', 'og:site_name', data.settings.siteName);
    setMetaTag('name', 'twitter:title', title);
    setMetaTag('name', 'twitter:description', description);
    if (ogImage) {
      const fullImg = ogImage.startsWith('http') ? ogImage : `${window.location.origin}${ogImage}`;
      setMetaTag('property', 'og:image', fullImg);
    }

    if (data.settings.faviconUrl) {
      let icon = document.querySelector('link[rel="icon"]') as HTMLLinkElement | null;
      if (!icon) {
        icon = document.createElement('link');
        icon.rel = 'icon';
        document.head.appendChild(icon);
      }
      icon.href = data.settings.faviconUrl;
    }
  }, [data, pageKey, customTitle, customDescription, customImage]);

  return null;
};
