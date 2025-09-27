import type { AuthenticatedRequest } from "@/types";
import type { Response } from "express";

import { CommentService } from "@/services/comment.service";
import catchErrors from "@/utils/catchErrors";
import { ResponseUtil } from "@/utils/response";

/**
 * Add comment to a post
 * @route POST /posts/:postId/comments
 */
export const addCommentHandler = catchErrors(async (req: AuthenticatedRequest, res: Response) => {
  const { postId } = req.params;
  const { content, parentId } = req.body;

  if (!postId) {
    throw new Error("Post ID is required");
  }

  const comment = await CommentService.createComment({
    postId,
    userId: (req.userId as any).toString(),
    content,
    parentId,
  });

  return ResponseUtil.created(res, comment, "Comment added successfully");
});

/**
 * Get comments for a post
 * @route GET /posts/:postId/comments
 */
export const getCommentsHandler = catchErrors(async (req: AuthenticatedRequest, res: Response) => {
  const { postId } = req.params;
  const { page = 1, limit = 10 } = req.query as any;

  if (!postId) {
    throw new Error("Post ID is required");
  }

  const result = await CommentService.getComments({
    postId,
    page: Number(page),
    limit: Number(limit),
    userId: (req.userId as any).toString(),
  });

  return ResponseUtil.paginated(res, result.data, result.pagination);
});

/**
 * Like/Unlike a comment
 * @route POST /comments/:commentId/like
 */
export const likeCommentHandler = catchErrors(async (req: AuthenticatedRequest, res: Response) => {
  const { commentId } = req.params;

  if (!commentId) {
    throw new Error("Comment ID is required");
  }

  const result = await CommentService.toggleCommentLike(commentId, (req.userId as any).toString());

  return ResponseUtil.success(res, result);
});

/**
 * Update a comment
 * @route PATCH /comments/:commentId
 */
export const updateCommentHandler = catchErrors(
  async (req: AuthenticatedRequest, res: Response) => {
    const { commentId } = req.params;
    const { content } = req.body;

    if (!commentId) {
      throw new Error("Comment ID is required");
    }

    const updatedComment = await CommentService.updateComment(
      commentId,
      (req.userId as any).toString(),
      { content }
    );

    return ResponseUtil.success(res, updatedComment, "Comment updated successfully");
  }
);

/**
 * Delete a comment
 * @route DELETE /comments/:commentId
 */
export const deleteCommentHandler = catchErrors(
  async (req: AuthenticatedRequest, res: Response) => {
    const { commentId } = req.params;

    if (!commentId) {
      throw new Error("Comment ID is required");
    }

    await CommentService.deleteComment(commentId, (req.userId as any).toString());

    return ResponseUtil.success(res, null, "Comment deleted successfully");
  }
);

/**
 * Get comment replies
 * @route GET /comments/:commentId/replies
 */
export const getCommentRepliesHandler = catchErrors(
  async (req: AuthenticatedRequest, res: Response) => {
    const { commentId } = req.params;
    const { page = 1, limit = 5 } = req.query as any;

    if (!commentId) {
      throw new Error("Comment ID is required");
    }

    const result = await CommentService.getCommentReplies(
      commentId,
      Number(page),
      Number(limit),
      (req.userId as any)?.toString()
    );

    return ResponseUtil.paginated(res, result.data, result.pagination);
  }
);
