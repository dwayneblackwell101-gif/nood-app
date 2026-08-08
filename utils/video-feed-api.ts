import { getBackendJson, postBackendJson } from './backend';

/**
 * Client for the video feed engagement API (backend routes/video-feed.js).
 * Real likes/comments/shares shared across all users via Supabase.
 */

export type VideoFeedEngagement = {
  success: boolean;
  source: 'supabase' | 'unconfigured';
  videoId: string;
  likes: number;
  shares: number;
  comments: Array<{
    id: string;
    author: string;
    body: string;
    createdAt: string;
  }>;
};

export async function fetchVideoEngagement(videoId: string): Promise<VideoFeedEngagement | null> {
  try {
    const data = await getBackendJson<VideoFeedEngagement>(`/api/video-feed/${encodeURIComponent(videoId)}`, {
      timeoutMs: 8000,
    });
    return data;
  } catch (error) {
    if (__DEV__) {
      console.log('[VIDEO FEED API] fetch failed', String((error as any)?.message || error));
    }
    return null;
  }
}

export async function toggleVideoLike(
  videoId: string,
  userId: string
): Promise<{ liked: boolean; likes: number } | null> {
  try {
    const data = await postBackendJson<{ success: boolean; liked: boolean; likes: number }>(
      `/api/video-feed/${encodeURIComponent(videoId)}/like`,
      { userId }
    );
    return { liked: Boolean(data?.liked), likes: Number(data?.likes || 0) };
  } catch (error) {
    if (__DEV__) {
      console.log('[VIDEO FEED API] like failed', String((error as any)?.message || error));
    }
    return null;
  }
}

export async function postVideoComment(
  videoId: string,
  body: string,
  author = 'noodshop',
  userId = 'guest'
): Promise<VideoFeedEngagement['comments'][number] | null> {
  try {
    const data = await postBackendJson<{ success: boolean; comment: VideoFeedEngagement['comments'][number] | null }>(
      `/api/video-feed/${encodeURIComponent(videoId)}/comment`,
      { body, author, userId }
    );
    return data?.comment || null;
  } catch (error) {
    if (__DEV__) {
      console.log('[VIDEO FEED API] comment failed', String((error as any)?.message || error));
    }
    return null;
  }
}

export async function recordVideoShare(videoId: string): Promise<number | null> {
  try {
    const data = await postBackendJson<{ success: boolean; shares: number }>(
      `/api/video-feed/${encodeURIComponent(videoId)}/share`,
      {}
    );
    return Number(data?.shares || 0);
  } catch (error) {
    if (__DEV__) {
      console.log('[VIDEO FEED API] share failed', String((error as any)?.message || error));
    }
    return null;
  }
}
