import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** The API origin (without the /api/v1 suffix), used to resolve relative asset paths. */
export function apiOrigin(): string {
  const base = import.meta.env.VITE_API_URL ?? "https://api.codagenz.com/api/v1";
  return base.replace(/\/api\/v1\/?$/, "").replace(/\/+$/, "");
}

/**
 * Resolve an instructor-uploaded asset URL (image/video/file) to an absolute URL.
 * Absolute http(s)/data URLs are returned unchanged; root-relative paths are
 * prefixed with the API origin; bare paths are assumed to live under /storage.
 */
export function resolveAssetUrl(url: string): string {
  if (!url) return url;
  if (/^(https?:)?\/\//i.test(url) || /^data:/i.test(url)) return url;
  const origin = apiOrigin();
  if (url.startsWith("/")) return `${origin}${url}`;
  return `${origin}/storage/${url}`;
}

/** Rewrite every src="..."/src='...' in an HTML string to an absolute asset URL. */
export function resolveHtmlAssetUrls(html: string): string {
  if (!html) return html;
  return html.replace(/\bsrc=(["'])(.*?)\1/gi, (_m, q, url) => `src=${q}${resolveAssetUrl(url)}${q}`);
}
