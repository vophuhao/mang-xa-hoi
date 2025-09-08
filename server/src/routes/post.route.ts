import {
  createPostHandler,
  deletePostHandler,
  getFeedPostsHandler,
  getPostByIdHandler,
  getTrendingPostsHandler,
  likePostHandler,
  updatePostHandler,
} from "@/controllers/post.controller";
import authenticate from "@/middleware/authenticate";
import { Router } from "express";

const postRoutes = Router();

// Protected routes - require authentication
postRoutes.use(authenticate);

// Post CRUD
postRoutes.post("/", createPostHandler);
postRoutes.get("/feed", getFeedPostsHandler);
postRoutes.get("/trending", getTrendingPostsHandler);
postRoutes.get("/:id", getPostByIdHandler);
postRoutes.put("/:id", updatePostHandler);
postRoutes.delete("/:id", deletePostHandler);

// Post interactions
postRoutes.post("/:postId/like", likePostHandler);

export default postRoutes;