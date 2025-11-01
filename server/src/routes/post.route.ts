import {
  createPostHandler,
  deletePostHandler,
  getAllPostHandler,
  getFeedPostsHandler,
  getPostByIdHandler,
  getReelByIdHandler,
  getReelsFeedHandler,
  getTrendingPostsHandler,
  increasePostViewHandler,
  likePostHandler,
  updatePostHandler,
} from "@/controllers/post.controller";
import authenticate from "@/middleware/authenticate";
import { Router } from "express";

const postRoutes = Router();

// Protected routes - require authentication
postRoutes.use(authenticate);

// Post CRUD
postRoutes.get("/reels", getReelsFeedHandler);
postRoutes.post("/", createPostHandler);
postRoutes.get("/feed", getFeedPostsHandler);
postRoutes.get("/trending", getTrendingPostsHandler);
postRoutes.post("/:postId/like", likePostHandler);
postRoutes.get("/:id", getPostByIdHandler);
postRoutes.put("/:id", updatePostHandler);
postRoutes.delete("/:id", deletePostHandler);
postRoutes.post("/views/:id", increasePostViewHandler);
postRoutes.get("/reels/:id", getReelByIdHandler);
postRoutes.get("/all/posts", getAllPostHandler);

export default postRoutes;