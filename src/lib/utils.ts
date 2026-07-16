import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getMediaUrl(key: string | null | undefined): string {
  if (!key) return '';
  const domain = process.env.NEXT_PUBLIC_MEDIA_DOMAIN;
  if (domain) {
    return `https://${domain}/${key}`;
  }
  return `/uploads/${key}`;
}
