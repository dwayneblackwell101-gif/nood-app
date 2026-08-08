/**
 * Shoppable Video Feed — real video → product mappings.
 * Each entry links a video asset to a Shopify product handle.
 * The product details (price, image) are fetched live from the Shopify
 * catalog at render time, so they stay in sync with your store.
 *
 * NOTE: Metro requires every `require()` to be a static string literal —
 * dynamic require paths (template literals) crash the bundler. So each
 * video is required explicitly below.
 *
 * Order is randomized per app launch by the feed component so videos
 * never appear in the same sequence twice.
 */

export type VideoFeedEntry = {
  id: string;
  videoUri: any;             // Local require() or remote URL
  productHandle: string;     // Shopify product handle
  caption?: string;
  creatorName?: string;
};

// Pool of real product handles to attach videos to. Each video gets one
// of these (round-robin) so every video is shoppable. Swap these for the
// exact product each video features once Shopify is live.
const PRODUCT_HANDLE_POOL = [
  'glo-gang-stitching-printed-zipper-stitching-casual-trousers-shorts-two-way-sweater-suit',
  'premium-lace-front-wig',
  'men-new-season-streetwear',
  'designer-streetwear-jacket',
  'luxury-silk-dress',
];

const CAPTION_POOL = [
  '🔥 Fresh drop — shop the look',
  '✨ This is trending right now',
  '🛍️ Limited stock — grab it before it’s gone',
  '💖 Everyone’s talking about this one',
  '🔥 Styled by @noodshop',
  '✨ New arrival — you’ll love this',
  '🛒 Add to cart — it’s moving fast',
  '🔥 10/10 would wear again',
];

// Static require()s so Metro can bundle them.
const VID_GLO_GANG = require('../assets/videos/shop/glo-gang-trousers.mp4');
const VID_15053190 = require('../assets/videos/shop/15053190.mp4');
const VID_16951202 = require('../assets/videos/shop/16951202.mp4');
const VID_17469710 = require('../assets/videos/shop/17469710.mp4');
const VID_19655991 = require('../assets/videos/shop/19655991.mp4');
const VID_20240708 = require('../assets/videos/shop/20240708_12844d8ef150b735_471188409964_140359438916717_published_mp4_264_hd_taobao.mp4');
const VID_20250306 = require('../assets/videos/shop/20250306_bd4794e7e89edd92_510287673191_245879207373988_published_mp4_264_hd_taobao.mp4');
const VID_20250917 = require('../assets/videos/shop/20250917_ad8d13cf890c76d9_534499254252_329330057880284_published_mp4_264_hd_taobao.mp4');
const VID_20251012 = require('../assets/videos/shop/20251012_71fa108f15a8f52d_537324935286_339633504022767_published_mp4_264_hd_taobao.mp4');
const VID_20260125 = require('../assets/videos/shop/20260125_d51c36009151181d_551725169470_393718514376750_published_mp4_264_hd_taobao.mp4');
const VID_20260205 = require('../assets/videos/shop/20260205_e37681aa9cfa7d20_552905163898_399435940144075_published_mp4_264_hd_taobao.mp4');
const VID_20260312 = require('../assets/videos/shop/20260312_c0e38875bad57204_556473888192_410077026105132_published_mp4_264_hd_taobao.mp4');
const VID_20260806 = require('../assets/videos/shop/20260806_c27d1645bbfda169_4449272132649349_490685421030709_published_mp4_264_hd_taobao.mp4');
const VID_LACE_1 = require('../assets/videos/lace-front-1.mp4');
const VID_LACE_2 = require('../assets/videos/lace-front-2.mp4');
const VID_LACE_3 = require('../assets/videos/lace-front-3.mp4');
const VID_LACE_4 = require('../assets/videos/lace-front-4.mp4');

function entry(
  id: string,
  videoUri: any,
  handleIndex: number,
  captionIndex: number
): VideoFeedEntry {
  return {
    id,
    videoUri,
    productHandle: PRODUCT_HANDLE_POOL[handleIndex % PRODUCT_HANDLE_POOL.length],
    caption: CAPTION_POOL[captionIndex % CAPTION_POOL.length],
    creatorName: 'noodshop',
  };
}

export const VIDEO_FEED_DATA: VideoFeedEntry[] = [
  entry('glo-gang-trousers', VID_GLO_GANG, 0, 0),
  entry('vid-15053190', VID_15053190, 2, 1),
  entry('vid-16951202', VID_16951202, 1, 1),
  entry('vid-17469710', VID_17469710, 2, 2),
  entry('vid-19655991', VID_19655991, 3, 3),
  entry('vid-20240708', VID_20240708, 4, 4),
  entry('vid-20250306', VID_20250306, 0, 5),
  entry('vid-20250917', VID_20250917, 1, 6),
  entry('vid-20251012', VID_20251012, 2, 7),
  entry('vid-20260125', VID_20260125, 3, 0),
  entry('vid-20260205', VID_20260205, 4, 1),
  entry('vid-20260312', VID_20260312, 0, 2),
  entry('vid-20260806', VID_20260806, 1, 3),
  entry('lace-front-1', VID_LACE_1, 1, 4),
  entry('lace-front-2', VID_LACE_2, 1, 5),
  entry('lace-front-3', VID_LACE_3, 1, 6),
  entry('lace-front-4', VID_LACE_4, 1, 7),
];

/** Shuffle a copy of the feed so the order changes every launch. */
export function getShuffledVideoFeed(): VideoFeedEntry[] {
  const copy = [...VIDEO_FEED_DATA];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function getVideoById(id: string): VideoFeedEntry | undefined {
  return VIDEO_FEED_DATA.find((v) => v.id === id);
}
