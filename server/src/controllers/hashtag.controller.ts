import type { AuthenticatedRequest } from "@/types";
import type { Response } from "express";

import HashtagService from "@/services/hashtag.service";
import catchErrors from "@/utils/catchErrors";
import { ResponseUtil } from "@/utils/response";
import { getHashtagPostsSchema, searchHashtagsSchema } from "@/validators/hashtag.validator";

/**
 * Get trending hashtags
 * @route GET /hashtags/trending
 */
export const getTrendingHashtagsHandler = catchErrors(
  async (req: AuthenticatedRequest, res: Response) => {
    const { limit = 10, minPosts = 1 } = req.query as any;

    const trendingHashtags = await HashtagService.getTrendingHashtags({
      limit: Number(limit),
      minPosts: Number(minPosts),
    });

    return ResponseUtil.success(res, trendingHashtags);
  }
);

/**
 * Search hashtags
 * @route GET /hashtags/search
 */
export const searchHashtagsHandler = catchErrors(
  async (req: AuthenticatedRequest, res: Response) => {
    const { q: query, page = 1, limit = 20 } = searchHashtagsSchema.parse(req.query);

    const result = await HashtagService.searchHashtags({
      query,
      page: Number(page),
      limit: Number(limit),
    });

    return ResponseUtil.paginated(res, result.data, result.pagination);
  }
);

/**
 * Get posts by hashtag
 * @route GET /hashtags/:hashtagName/posts
 */
export const getHashtagPostsHandler = catchErrors(
  async (req: AuthenticatedRequest, res: Response) => {
    const { hashtagName } = getHashtagPostsSchema.parse(req.params);
    const { page = 1, limit = 12 } = req.query as any;

    const result = await HashtagService.getHashtagPosts({
      hashtagName,
      page: Number(page),
      limit: Number(limit),
    });

    return ResponseUtil.paginated(res, result.data, result.pagination);
  }
);

/**
 * Get hashtag details
 * @route GET /hashtags/:hashtagName
 */
export const getHashtagDetailsHandler = catchErrors(
  async (req: AuthenticatedRequest, res: Response) => {
    const { hashtagName } = getHashtagPostsSchema.parse(req.params);

    const hashtag = await HashtagService.getHashtagByName(hashtagName);

    return ResponseUtil.success(res, hashtag);
  }
);

/**
 * Get hashtag statistics (admin only)
 * @route GET /hashtags/stats
 */
export const getHashtagStatsHandler = catchErrors(
  async (_req: AuthenticatedRequest, res: Response) => {
    const stats = await HashtagService.getHashtagStats();

    return ResponseUtil.success(res, stats);
  }
);
