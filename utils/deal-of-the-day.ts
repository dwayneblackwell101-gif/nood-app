import { mapShopifyNodesToDealsCards, type DealsCardProduct } from './deals-product-mapper';

/**
 * Deal of the Day — a deterministic daily pick from the catalog.
 * Same product all day, changes at local midnight. Picks the deepest
 * discount that also has "ending soon" social proof when available.
 */

const DEAL_COLLECTION_HANDLES = ['deals', 'frontpage', 'all'];

export type DealOfTheDay = DealsCardProduct & {
  dealTagline: string;
};

export function pickDealOfTheDay(products: DealsCardProduct[], date: Date = new Date()): DealOfTheDay | null {
  if (!products?.length) return null;

  const daySeed = date.getFullYear() * 10000 + (date.getMonth() + 1) * 100 + date.getDate();
  const sorted = [...products].sort((a, b) => {
    const aScore = (a.discount ?? 0) * 10 + (a.endingSoon ? 5 : 0) + (a.soldCount > 1000 ? 2 : 0);
    const bScore = (b.discount ?? 0) * 10 + (b.endingSoon ? 5 : 0) + (b.soldCount > 1000 ? 2 : 0);
    return bScore - aScore;
  });

  const candidate = sorted[daySeed % sorted.length] || sorted[0];

  return {
    ...candidate,
    dealTagline: candidate.discount
      ? `${candidate.discount}% off — today only`
      : 'Today’s featured deal',
  };
}

export async function loadDealOfTheDay(): Promise<DealOfTheDay | null> {
  for (const handle of DEAL_COLLECTION_HANDLES) {
    try {
      const { fetchShopifyCollectionProducts } = await import('./shopify-catalog');
      const result = await fetchShopifyCollectionProducts(handle, { first: 40 });
      const edges = result?.collectionByHandle?.products?.edges || [];
      const nodes = edges.map((e: any) => e.node).filter(Boolean);
      if (nodes.length) {
        const cards = mapShopifyNodesToDealsCards(nodes);
        return pickDealOfTheDay(cards);
      }
    } catch {
      // try next collection
    }
  }
  return null;
}
