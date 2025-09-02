import { Request, Response } from "express";
import { CREATED, BAD_REQUEST, OK } from "../constants/http";
import catchErrors from "../utils/catchErrors";
import { createPost } from "../services/post.service";

export const createPostHandler = catchErrors(async (req, res) => {
  const userId = req.userId; // middleware auth gán req.user
  if (!userId) {
    return res.status(BAD_REQUEST).json({ message: "User not authenticated" });
  }

  const { caption, mediaUrls } = req.body;

  // Gọi service tạo post
  const post = await createPost({
    user: userId,
    caption,
    mediaUrls,
  });

  return res.status(CREATED).json({
    status : OK,
    message: "Post created successfully",
    post,
  });
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
