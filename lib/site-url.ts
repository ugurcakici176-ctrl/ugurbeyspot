// Search engines must see one stable origin in canonicals, sitemaps and
// structured data. Firebase App Hosting exposes a hosted.app URL as well, so
// deriving this value from the deployment environment can accidentally leak
// that temporary hostname into Google Search Console.
export const SITE_URL = "https://ugurbeyspot.com";

export function absoluteUrl(path = "/"): string {
  return new URL(path, `${SITE_URL}/`).toString();
}
