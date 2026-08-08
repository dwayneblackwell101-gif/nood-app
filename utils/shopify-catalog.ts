import { shopifyStorefrontGraphql } from './shopify';

const SHOPIFY_LIST_PRODUCTS_LIMIT = 50;
const SHOPIFY_LIST_IMAGES_LIMIT = 30;
const SHOPIFY_LIST_MEDIA_LIMIT = 20;
const SHOPIFY_LIST_VARIANTS_LIMIT = 50;
const SHOPIFY_LIST_COLLECTIONS_LIMIT = 10;
const SHOPIFY_DETAIL_IMAGES_LIMIT = 100;
const SHOPIFY_DETAIL_MEDIA_LIMIT = 50;
const SHOPIFY_DETAIL_VARIANTS_LIMIT = 250;

const PRODUCT_LIST_FRAGMENT = `
  id
  title
  handle
  descriptionHtml
  vendor
  productType
  tags
  availableForSale
  featuredImage { url altText }
  images(first: ${SHOPIFY_LIST_IMAGES_LIMIT}) {
    edges { node { url altText width height } }
  }
  media(first: ${SHOPIFY_LIST_MEDIA_LIMIT}) {
    edges {
      node {
        __typename
        ... on MediaImage { id image { url altText width height } }
        ... on Video { id previewImage { url } sources { url mimeType } }
      }
    }
  }
  priceRange { minVariantPrice { amount currencyCode } maxVariantPrice { amount currencyCode } }
  compareAtPriceRange { maxVariantPrice { amount currencyCode } }
  variants(first: ${SHOPIFY_LIST_VARIANTS_LIMIT}) {
    edges {
      node {
        id title availableForSale quantityAvailable currentlyNotInStock
        price { amount currencyCode }
        image { url altText }
        selectedOptions { name value }
      }
    }
  }
  collections(first: ${SHOPIFY_LIST_COLLECTIONS_LIMIT}) {
    edges { node { handle title } }
  }
`;

/**
 * LIGHTWEIGHT list fragment — used by grid queries (home feed, categories,
 * collections, deals). Omits heavy fields (full description, media, all
 * variants) that grids don't render, cutting the Storefront payload
 * dramatically → faster first paint.
 *
 * Keeps everything the grid card needs: image, price, discount, availability.
 */
const PRODUCT_GRID_FRAGMENT = `
  id
  title
  handle
  vendor
  productType
  tags
  availableForSale
  featuredImage { url altText }
  images(first: 4) { edges { node { url altText width height } } }
  priceRange { minVariantPrice { amount currencyCode } maxVariantPrice { amount currencyCode } }
  compareAtPriceRange { maxVariantPrice { amount currencyCode } }
  variants(first: 4) {
    edges {
      node {
        id title availableForSale quantityAvailable currentlyNotInStock
        price { amount currencyCode }
        image { url altText }
        selectedOptions { name value }
      }
    }
  }
  collections(first: 5) { edges { node { handle title } } }
`;

/**
 * Fetch a list of products using the LIGHT grid fragment.
 * Much faster than the full fragment for grids.
 */
export async function fetchShopifyGridProducts(params: {
  first?: number;
  after?: string | null;
  sortKey?: string;
  query?: string;
}): Promise<any> {
  const first = Math.min(Math.max(1, params.first || 50), 250);
  const variables: Record<string, unknown> = { first };
  if (params.after) variables.after = params.after;
  if (params.sortKey) variables.sortKey = params.sortKey;
  if (params.query) variables.query = params.query;

  const query = `
    query StorefrontGridProducts($first: Int!, $after: String, $sortKey: ProductSortKeys, $query: String) {
      products(first: $first, after: $after, sortKey: $sortKey, reverse: true, query: $query) {
        edges { node { ${PRODUCT_GRID_FRAGMENT} } }
        pageInfo { hasNextPage endCursor }
      }
    }
  `;

  const response = await shopifyStorefrontGraphql(query, variables);
  return response?.data?.products || null;
}

/**
 * Fetch collection products using the LIGHT grid fragment.
 */
export async function fetchShopifyCollectionGridProducts(
  handle: string,
  params: { first?: number; after?: string | null } = {}
): Promise<any> {
  const first = Math.min(Math.max(1, params.first || 50), 250);
  const variables: Record<string, unknown> = { handle, first };
  if (params.after) variables.after = params.after;

  const query = `
    query StorefrontCollectionGridProducts($handle: String!, $first: Int!, $after: String) {
      collectionByHandle(handle: $handle) {
        title
        handle
        products(first: $first, after: $after) {
          edges { node { ${PRODUCT_GRID_FRAGMENT} } }
          pageInfo { hasNextPage endCursor }
        }
      }
    }
  `;

  const response = await shopifyStorefrontGraphql(query, variables);
  return response?.data?.collectionByHandle || null;
}

const PRODUCT_DETAIL_FRAGMENT = `
  id
  title
  handle
  descriptionHtml
  vendor
  productType
  tags
  availableForSale
  featuredImage { url altText }
  images(first: ${SHOPIFY_DETAIL_IMAGES_LIMIT}) {
    edges { node { url altText width height } }
  }
  media(first: ${SHOPIFY_DETAIL_MEDIA_LIMIT}) {
    edges {
      node {
        __typename
        ... on MediaImage { id image { url altText width height } }
        ... on Video { id previewImage { url } sources { url mimeType } }
      }
    }
  }
  priceRange { minVariantPrice { amount currencyCode } maxVariantPrice { amount currencyCode } }
  compareAtPriceRange { maxVariantPrice { amount currencyCode } }
  variants(first: ${SHOPIFY_DETAIL_VARIANTS_LIMIT}) {
    edges {
      node {
        id title availableForSale quantityAvailable currentlyNotInStock
        price { amount currencyCode }
        image { url altText }
        selectedOptions { name value }
      }
    }
  }
  collections(first: ${SHOPIFY_LIST_COLLECTIONS_LIMIT}) {
    edges { node { handle title } }
  }
`;

const STOREFRONT_PRODUCTS_LIST_QUERY = `
  query StorefrontProductsList($first: Int!, $after: String, $sortKey: ProductSortKeys, $query: String) {
    products(first: $first, after: $after, sortKey: $sortKey, reverse: true, query: $query) {
      edges { node { ${PRODUCT_LIST_FRAGMENT} } }
      pageInfo { hasNextPage endCursor }
    }
  }
`;

const STOREFRONT_PRODUCT_DETAIL_QUERY = `
  query StorefrontProductDetail($handle: String!) {
    productByHandle(handle: $handle) {
      ${PRODUCT_DETAIL_FRAGMENT}
    }
  }
`;

const STOREFRONT_COLLECTION_PRODUCTS_QUERY = `
  query StorefrontCollectionProducts($handle: String!, $first: Int!, $after: String) {
    collectionByHandle(handle: $handle) {
      title
      handle
      products(first: $first, after: $after) {
        edges { node { ${PRODUCT_LIST_FRAGMENT} } }
        pageInfo { hasNextPage endCursor }
      }
    }
  }
`;

export interface ShopifyListParams {
  first?: number;
  after?: string | null;
  sortKey?: string;
  query?: string;
}

export interface ShopifyProductEdge {
  node: Record<string, unknown>;
}

export interface ShopifyPageInfo {
  hasNextPage: boolean;
  endCursor: string | null;
}

export interface ShopifyProductsConnection {
  edges: ShopifyProductEdge[];
  pageInfo: ShopifyPageInfo;
}

export interface ShopifyCollectionProducts {
  products: ShopifyProductsConnection;
}

export interface ShopifyCollectionByHandle {
  title: string;
  handle: string;
  products: ShopifyProductsConnection;
}

export interface ShopifyCollectionProductsResult {
  collectionByHandle: ShopifyCollectionByHandle | null;
}

export async function fetchShopifyProductList(
  params: ShopifyListParams = {}
): Promise<{ products: ShopifyProductsConnection }> {
  const first = Math.min(Math.max(1, params.first || SHOPIFY_LIST_PRODUCTS_LIMIT), 250);
  const sortKey = (params.sortKey || 'UPDATED_AT').toUpperCase();
  const variables: Record<string, unknown> = { first, sortKey };
  if (params.after) variables.after = params.after;
  if (params.query) variables.query = params.query;

  const response = await shopifyStorefrontGraphql(STOREFRONT_PRODUCTS_LIST_QUERY, variables);
  const products = response?.data?.products || { edges: [], pageInfo: { hasNextPage: false, endCursor: null } };
  return { products };
}

export async function fetchShopifyProductDetail(
  handle: string
): Promise<{ productByHandle: Record<string, unknown> | null }> {
  const response = await shopifyStorefrontGraphql(STOREFRONT_PRODUCT_DETAIL_QUERY, { handle });
  return { productByHandle: response?.data?.productByHandle || null };
}

export async function fetchShopifyCollectionProducts(
  handle: string,
  params: { first?: number; after?: string | null } = {}
): Promise<ShopifyCollectionProductsResult> {
  const first = Math.min(Math.max(1, params.first || 50), 250);
  const variables: Record<string, unknown> = { handle, first };
  if (params.after) variables.after = params.after;

  const response = await shopifyStorefrontGraphql(STOREFRONT_COLLECTION_PRODUCTS_QUERY, variables);
  return { collectionByHandle: response?.data?.collectionByHandle || null };
}

const STOREFRONT_COLLECTIONS_LIST_QUERY = `
  query StorefrontCollectionsList($first: Int!) {
    collections(first: $first, sortKey: UPDATED_AT, reverse: true) {
      edges {
        node {
          id
          title
          handle
          image { url altText }
        }
      }
    }
  }
`;

export interface CollectionSummary {
  id: string;
  title: string;
  handle: string;
  imageUrl: string | null;
}

export async function fetchShopifyCollectionsList(
  first = 15
): Promise<CollectionSummary[]> {
  const response = await shopifyStorefrontGraphql(STOREFRONT_COLLECTIONS_LIST_QUERY, {
    first: Math.min(Math.max(1, first), 50),
  });
  const edges = response?.data?.collections?.edges || [];
  return edges
    .map((edge: any) => {
      const node = edge?.node;
      if (!node?.handle) return null;
      return {
        id: node.id || node.handle,
        title: node.title || node.handle,
        handle: node.handle,
        imageUrl: node.image?.url || null,
      };
    })
    .filter(Boolean) as CollectionSummary[];
}

/**
 * Check if a Storefront API response indicates a product miss or empty catalog.
 */
export function isStorefrontCatalogEmpty(data: Record<string, unknown> | null | undefined): boolean {
  if (!data) return true;

  const products = (data as any)?.products;
  if (products && Array.isArray(products.edges) && products.edges.length === 0) {
    return true;
  }

  const collection = (data as any)?.collectionByHandle;
  if (collection && collection.products && Array.isArray(collection.products.edges) && collection.products.edges.length === 0) {
    return true;
  }

  return false;
}
