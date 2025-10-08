import type { AuthenticatedRequest } from "@/types";
import type { Response } from "express";

import { PostService } from "@/services/post.service";
import catchErrors from "@/utils/catchErrors";
import { ResponseUtil } from "@/utils/response";
import {
  createPostSchema,
  getFeedPostsSchema,
  getPostByIdSchema,
  likePostSchema,
} from "@/validators";


/**
 * Create a new post
 * @route POST /posts
 */
export const createPostHandler = catchErrors(async (req: AuthenticatedRequest, res: Response) => {
  const validatedData = createPostSchema.parse(req.body);


  const post = await PostService.createPost({
    user: req.userId,
    mediaUrls: validatedData.mediaUrls,
    caption: req.body.caption,
    hideLikes: req.body.hideLikes,
    disableComments: req.body.disableComments,
    mentions: req.body.mentions,
    audioId: req.body.audioId,
    tags: validatedData.tags || [],
    ...(validatedData.location && { location: validatedData.location }),
  });

  return ResponseUtil.created(res, post, "Post created successfully");
});

/**
 * Get user's feed posts
 * @route GET /posts/feed
 */
export const getFeedPostsHandler = catchErrors(async (req: AuthenticatedRequest, res: Response) => {
  const { page = 1, limit = 10 } = getFeedPostsSchema.parse(req.query);

  const result = await PostService.getFeed({
    userId: (req.userId as any).toString(),
    page: Number(page),
    limit: Number(limit),
  });

  return ResponseUtil.paginated(res, result.data, result.pagination);
});

/**
 * Get post by ID
 * @route GET /posts/:id
 */
export const getPostByIdHandler = catchErrors(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = getPostByIdSchema.parse(req.params);

  const post = await PostService.getPostById({
    postId: id,
    userId: (req.userId as any).toString(),
  });

  return ResponseUtil.success(res, post);
});

/**
 * Like/Unlike a post
 * @route POST /posts/:postId/like
 */
export const likePostHandler = catchErrors(async (req: AuthenticatedRequest, res: Response) => {
  const { postId } = likePostSchema.parse(req.params);
  const result = await PostService.togglePostLike(postId, (req.userId as any).toString());
  return ResponseUtil.success(res, result);
});

/**
 * Update a post
 * @route PATCH /posts/:id
 */
export const updatePostHandler = catchErrors(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const updateData = req.body;

  if (!id) {
    throw new Error("Post ID is required");
  }

  const updatedPost = await PostService.updatePost(id, (req.userId as any).toString(), updateData);

  return ResponseUtil.success(res, updatedPost, "Post updated successfully");
});

/**
 * Delete a post
 * @route DELETE /posts/:id
 */
export const deletePostHandler = catchErrors(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;

  if (!id) {
    throw new Error("Post ID is required");
  }

  await PostService.deletePost(id, (req.userId as any).toString());

  return ResponseUtil.success(res, null, "Post deleted successfully");
});

/**
 * Get trending posts
 * @route GET /posts/trending
 */
export const getTrendingPostsHandler = catchErrors(
  async (req: AuthenticatedRequest, res: Response) => {
    const { page = 1, limit = 10 } = req.query as any;

    const posts = await PostService.getTrendingPosts(Number(page), Number(limit));

    return ResponseUtil.success(res, posts);
  }
);

export const getReelsFeedHandler = catchErrors(async (req: AuthenticatedRequest, res: Response) => {
  const page = parseInt((req.query.page as string) || "1", 10);
  const limit = parseInt((req.query.limit as string) || "10", 10);

  const reels = await PostService.getReelsFeed(page, limit);

  return ResponseUtil.success(res, reels);
});

// controllers/post.controller.ts
export const increasePostViewHandler = catchErrors(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;

  if (!id) {
    throw new Error("Post ID is missing");
  }

  const views = await PostService.incrementViewCount(id);

  return ResponseUtil.success(res, { viewCount: views }, "View count increased");
});
