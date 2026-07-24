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

export interface ShopifyListResult {
  edges: Array<{ node: Record<string, unknown> }>;
  pageInfo: { hasNextPage: boolean; endCursor: string | null };
}

export async function fetchShopifyProductList(
  params: ShopifyListParams = {}
): Promise<{ products: { edges: ShopifyListResult['edges']; pageInfo: ShopifyListResult['pageInfo'] } }> {
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
): Promise<{ collectionByHandle: Record<string, unknown> | null }> {
  const first = Math.min(Math.max(1, params.first || 50), 250);
  const variables: Record<string, unknown> = { handle, first };
  if (params.after) variables.after = params.after;

  const response = await shopifyStorefrontGraphql(STOREFRONT_COLLECTION_PRODUCTS_QUERY, variables);
  return { collectionByHandle: response?.data?.collectionByHandle || null };
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
