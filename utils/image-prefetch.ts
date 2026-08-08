import { Image } from 'expo-image';

/**
 * Image prefetch helpers — warm the disk/memory cache so product images
 * appear instantly when a grid renders. Uses expo-image's built-in cache.
 */

const PREFETCH_CONCURRENCY = 6;
const PREFETCHED = new Set<string>();

function normalizeUrl(url: string): string {
  // Trim Shopify width params to a reasonable size for grid cards.
  try {
    const parsed = new URL(url);
    parsed.searchParams.set('width', '600');
    return parsed.toString();
  } catch {
    return url;
  }
}

/**
 * Prefetch a batch of image URLs with a concurrency cap.
 * Deduplicates URLs already prefetched this session.
 */
export function prefetchImages(urls: string[], width = 600): void {
  const unique = Array.from(new Set(urls.filter(Boolean).map(normalizeUrl)));
  if (!unique.length) return;

  let index = 0;
  const worker = async () => {
    while (index < unique.length) {
      const url = unique[index];
      index += 1;
      if (PREFETCHED.has(url)) continue;
      PREFETCHED.add(url);
      try {
        await Image.prefetch(url, 'memory-disk');
      } catch {
        // non-fatal
      }
    }
  };

  for (let i = 0; i < Math.min(PREFETCH_CONCURRENCY, unique.length); i += 1) {
    void worker();
  }
}

/** Prefetch the first N images from a product list (grid thumbnails). */
export function prefetchProductImages<T extends { image?: string; featuredImage?: { url?: string } }>(
  products: T[],
  count = 24
): void {
  const urls = (products || [])
    .slice(0, count)
    .map((p) => p?.image || p?.featuredImage?.url || '')
    .filter(Boolean);
  prefetchImages(urls);
}
