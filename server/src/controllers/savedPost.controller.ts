import type { AuthenticatedRequest } from "@/types";
import type { Response } from "express";

import catchErrors from "@/utils/catchErrors";
import { ResponseUtil } from "@/utils/response";
import SavedPostService from "@/services/savedPost.service";
import { savePostSchema } from "@/validators/post.validator";

/**
 * Save a post
 * @route POST /saved-posts/:postId
 */
export const savePostHandler = catchErrors(async (req: AuthenticatedRequest, res: Response) => {
  const { postId } = savePostSchema.parse(req.params);
  const result = await SavedPostService.savePost((req.userId as any).toString(), postId);
  return ResponseUtil.success(res, result);
});

/**
 * Unsave a post
 * @route DELETE /saved-posts/:postId
 */
export const unsavePostHandler = catchErrors(async (req: AuthenticatedRequest, res: Response) => {
  const { postId } = savePostSchema.parse(req.params);
  const result = await SavedPostService.unsavePost((req.userId as any).toString(), postId);
  return ResponseUtil.success(res, result);
});

/**
 * Get user's saved posts
 * @route GET /saved-posts
 */
export const getSavedPostsHandler = catchErrors(
  async (req: AuthenticatedRequest, res: Response) => {
    const { page = 1, limit = 12 } = req.query as any;
    
    const result = await SavedPostService.getSavedPosts({
      userId: (req.userId as any).toString(),
      page: Number(page),
      limit: Number(limit),
    });
    
    return ResponseUtil.paginated(res, result.data, result.pagination);
  }
);

/**
 * Check if a post is saved
 * @route GET /saved-posts/:postId/status
 */
export const checkSavedStatusHandler = catchErrors(
  async (req: AuthenticatedRequest, res: Response) => {
    const { postId } = savePostSchema.parse(req.params);
    const isSaved = await SavedPostService.isPostSaved((req.userId as any).toString(), postId);
    return ResponseUtil.success(res, { isSaved });
  }
);

/**
 * Get saved posts count
 * @route GET /saved-posts/count
 */
export const getSavedPostCountHandler = catchErrors(
  async (req: AuthenticatedRequest, res: Response) => {
    const count = await SavedPostService.getSavedPostCount((req.userId as any).toString());
    return ResponseUtil.success(res, { count });
  }
);

/**
 * Get saved post statistics
 * @route GET /saved-posts/stats
 */
export const getSavedPostStatsHandler = catchErrors(
  async (req: AuthenticatedRequest, res: Response) => {
    const stats = await SavedPostService.getSavedPostStats((req.userId as any).toString());
    return ResponseUtil.success(res, stats);
  }
);
