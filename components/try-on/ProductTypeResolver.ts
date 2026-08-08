/**
 * ProductTypeResolver.ts
 *
 * Determines the best AR visualization mode for a product based on its metadata.
 * Data-driven and extensible for adding new modes (e.g. DeepAR later).
 */

export type ARMode =
  | 'world-placement'   // Furniture: plane detection, tap-to-place on floor
  | 'body-overlay'      // Clothing/wigs: front camera, overlay on body
  | 'face-overlay'      // Jewelry: face tracking, overlay on face/ears
  | 'hand-overlay'      // Rings/bracelets: hand tracking
  | 'model-viewer'      // 3D model viewer: glTF/GLB/USDZ model viewer
  | 'fallback-overlay'; // Simple image overlay fallback

export interface ProductMetadata {
  handle: string;
  title: string;
  productType?: string;
  tags?: string[];
  collections?: Array<{ handle?: string }>;
  media?: Array<{
    __typename?: string;
    preview?: { url?: string };
    id?: string;
    sources?: Array<{ url: string; format?: string }>;
  }>;
  featuredImage?: { url?: string };
  images?: { edges: Array<{ node: { url: string; altText?: string } }> };
}

/**
 * Normalizes text for matching: lowercase, trim, remove special chars
 */
function normalizeText(text: string): string {
  return text.toLowerCase().trim().replace(/[^a-z0-9\s]/g, ' ');
}

/**
 * Checks if any tag/collection matches a keyword list
 */
function matchesAny(text: string, keywords: string[]): boolean {
  const normalized = normalizeText(text);
  return keywords.some((kw) => normalized.includes(normalizeText(kw)));
}

/**
 * Resolves the best AR mode for a product based on its metadata.
 * Priority: explicit model > product type/tags > fallback
 */
export function resolveARMode(product: ProductMetadata): ARMode {
  // 1. Check for 3D model (highest priority)
  if (product.media) {
    const has3DModel = product.media.some((m) => {
      const type = (m.__typename || '').toLowerCase();
      return type.includes('model3d') || type === 'model3d' || type === 'model3dmedia';
    });
    if (has3DModel) return 'model-viewer';
  }

  // 2. Check product type for furniture
  const productType = (product.productType || '').toLowerCase();
  const furnitureKeywords = [
    'furniture', 'sofa', 'chair', 'table', 'bed', 'cabinet', 'shelf',
    'desk', 'stool', 'bench', 'ottoman', 'armchair', 'recliner',
    'dining', 'coffee table', 'side table', 'bookshelf', 'wardrobe',
    'dresser', 'nightstand', 'entertainment', 'tv stand',
  ];
  if (matchesAny(productType, furnitureKeywords)) return 'world-placement';

  // 3. Check tags for furniture
  if (product.tags?.some((tag) => matchesAny(tag, furnitureKeywords))) {
    return 'world-placement';
  }

  // 4. Check for clothing/wigs
  const clothingKeywords = [
    'clothing', 'apparel', 'dress', 'shirt', 'pants', 'jeans', 'top',
    'blouse', 'skirt', 'jacket', 'coat', 'sweater', 'hoodie', 'cardigan',
    'leggings', 'shorts', 'socks', 'underwear', 'bra', 'lingerie',
    'swimwear', 'activewear', 'sportswear',
  ];
  if (matchesAny(productType, clothingKeywords)) return 'body-overlay';
  if (product.tags?.some((tag) => matchesAny(tag, clothingKeywords))) {
    return 'body-overlay';
  }

  // 5. Check for wigs/hair (special case - face overlay)
  const wigKeywords = ['wig', 'lacefront', 'lace front', 'frontal', 'closure', 'hair'];
  if (matchesAny(productType, wigKeywords) || product.tags?.some((tag) => matchesAny(tag, wigKeywords))) {
    return 'face-overlay';
  }

  // 6. Check for jewelry
  const jewelryKeywords = [
    'jewelry', 'jewellery', 'ring', 'necklace', 'earring', 'bracelet',
    'pendant', 'bracelet', 'anklet', 'piercing', 'stud', 'hoop',
    'choker', 'chain', 'gemstone', 'diamond', 'gold', 'silver',
    'platinum', 'pearl', 'gem', 'watch',
  ];
  if (matchesAny(productType, jewelryKeywords)) return 'face-overlay';
  if (product.tags?.some((tag) => matchesAny(tag, jewelryKeywords))) {
    return 'face-overlay';
  }

  // 7. Check collections for category hints
  const collectionHandles = product.collections?.map((c) => c.handle?.toLowerCase() || '') || [];
  const collectionKeywords = {
    'world-placement': ['furniture', 'home-decor', 'living-room', 'bedroom', 'office-furniture'],
    'body-overlay': ['clothing', 'womens-clothing', 'mens-clothing', 'apparel', 'fashion'],
    'face-overlay': ['wigs', 'hair', 'jewelry', 'accessories', 'beauty'],
    'hand-overlay': ['rings', 'bracelets', 'watches'],
  };

  for (const [mode, keywords] of Object.entries(collectionKeywords)) {
    if (collectionHandles.some((h) => keywords.some((k) => h.includes(k)))) {
      return mode as ARMode;
    }
  }

  // 8. Default fallback
  return 'fallback-overlay';
}

export function getARModeDescription(mode: ARMode): string {
  switch (mode) {
    case 'world-placement':
      return 'Tap a flat surface to place the item. Drag to move, pinch to resize, two fingers to rotate.';
    case 'body-overlay':
      return 'Position the item on your body. Pinch to resize, drag to move.';
    case 'face-overlay':
      return 'Point camera at your face. Item will follow your face movements.';
    case 'hand-overlay':
      return 'Hold your hand up. Pinch to resize, drag to position on hand.';
    case 'model-viewer':
      return 'View the 3D model in your space. Tap to place, pinch to scale, rotate with two fingers.';
    case 'fallback-overlay':
    default:
      return 'Still learning how to visualize this product in full AR. Showing 3D preview instead.';
  }
}