import { getHomeListImageUrl } from './list-product';

/**
 * Deals card shape used by the Deals screen and flash sale surfaces.
 * The raw Shopify product nodes use `priceRange`/`compareAtPriceRange`
 * and have no social-proof counters, so we normalize + seed deterministic
 * (handle-seeded) sold counts until real analytics are wired up.
 */
export type DealsCardProduct = {
  id: string;
  handle: string;
  title: string;
  price: string;
  compareAt: string;
  discount: number | null;
  image: string;
  soldCount: number;
  totalStock: number;
  category: string;
  endingSoon: boolean;
};

function hashString(value: string): number {
  let hash = 0;
  const input = String(value || '');
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function getPriceAmount(node: any): number {
  const direct = Number(node?.priceRange?.minVariantPrice?.amount);
  if (Number.isFinite(direct) && direct > 0) return direct;
  const variant = Number(node?.variants?.edges?.[0]?.node?.price?.amount);
  if (Number.isFinite(variant) && variant > 0) return variant;
  return Number(node?.price) || 0;
}

function getCompareAtAmount(node: any): number {
  const direct = Number(node?.compareAtPriceRange?.maxVariantPrice?.amount);
  if (Number.isFinite(direct) && direct > 0) return direct;
  const variant = Number(node?.variants?.edges?.[0]?.node?.compareAtPrice?.amount);
  if (Number.isFinite(variant) && variant > 0) return variant;
  return Number(node?.compareAt) || 0;
}

function resolveCategory(node: any): string {
  const productType = String(node?.productType || '').trim().toLowerCase();
  if (productType) return productType;
  const collectionHandle = String(node?.collections?.edges?.[0]?.node?.handle || '').trim().toLowerCase();
  if (collectionHandle) return collectionHandle;
  return 'deals';
}

export function mapShopifyNodesToDealsCards(nodes: any[]): DealsCardProduct[] {
  const cards: DealsCardProduct[] = [];

  for (const node of nodes || []) {
    if (!node?.handle) continue;

    const handle = String(node.handle);
    const priceAmount = getPriceAmount(node);
    const compareAmount = getCompareAtAmount(node);
    const discount =
      priceAmount > 0 && compareAmount > priceAmount
        ? Math.round(((compareAmount - priceAmount) / compareAmount) * 100)
        : null;

    const seed = hashString(handle);
    const totalStock = 800 + (seed % 19200); // 800 – 20,000
    const soldPct = 0.2 + ((seed % 76) / 100); // 20% – 95%
    const soldCount = Math.round(totalStock * soldPct);
    const endingSoon = soldPct > 0.68;

    const imageUrl =
      node?.featuredImage?.url ||
      node?.images?.edges?.[0]?.node?.url ||
      node?.media?.edges?.[0]?.node?.image?.url ||
      node?.image;

    cards.push({
      id: String(node?.id || handle),
      handle,
      title: String(node?.title || 'Product'),
      price: priceAmount ? priceAmount.toFixed(2) : '',
      compareAt: compareAmount ? compareAmount.toFixed(2) : '',
      discount,
      image: getHomeListImageUrl(imageUrl),
      soldCount,
      totalStock,
      category: resolveCategory(node),
      endingSoon,
    });
  }

  return cards;
}
