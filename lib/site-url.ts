// lib/site-url.ts

/**
 * Sitenin tek resmi adresi.
 * Canonical, sitemap, robots ve metadata burada kullanılır.
 */
export const SITE_URL = "https://ugurbeyspot.com";

/**
 * Relative path'i tam URL'ye çevirir.
 *
 * absoluteUrl("/") =>
 * https://ugurbeyspot.com/
 *
 * absoluteUrl("/urunler") =>
 * https://ugurbeyspot.com/urunler
 */
export function absoluteUrl(path: string = "/"): string {
  const cleanPath = path.startsWith("/") ? path : `/${path}`;

  return new URL(cleanPath, SITE_URL).toString();
}