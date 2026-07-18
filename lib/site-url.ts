export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
  "https://ugurbeyspot.com"
).replace(/\/$/, "");

export function absoluteUrl(path = "/"): string {
  return new URL(path, `${SITE_URL}/`).toString();
}
