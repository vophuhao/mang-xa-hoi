import type { AuthenticatedRequest } from '@/types';
import type { Response } from 'express';

import { createPost } from '@/services/post.service';
import { AppError } from '@/utils/AppError';
import catchErrors from '@/utils/catchErrors';
import { ResponseUtil } from '@/utils/response';

export const createPostHandler = catchErrors(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.userId;

  if (!userId) {
    throw AppError.unauthorized('User not authenticated');
  }

  const { caption, mediaUrls } = req.body;

  // Gọi service tạo post
  const post = await createPost({
    user: userId,
    caption,
    mediaUrls,
  });

  return ResponseUtil.created(res, post, 'Post created successfully');
});

// export const getPostsHandler = catchErrors(async (req: Request, res: Response) => {
//   const posts = await PostModel.find().sort({ createdAt: -1 }).populate("user", "email avatarUrl");
//   return res.status(OK).json({ posts });
// });

// export const getPostByIdHandler = catchErrors(async (req: Request, res: Response) => {
//   const postId = req.params.id;
//   if (!postId) return res.status(BAD_REQUEST).json({ message: "Missing post ID" });

//   const post = await PostModel.findById(postId).populate("user", "email avatarUrl");
//   if (!post) return res.status(BAD_REQUEST).json({ message: "Post not found" });

//   return res.status(OK).json({ post });
// });
