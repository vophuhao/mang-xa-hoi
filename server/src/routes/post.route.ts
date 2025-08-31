import {
  createPostHandler,
  deletePostHandler,
  getExplorePostsHandler,
  getFeedHandler,
  getPostHandler,
  likePostHandler,
} from "@/controllers/post.controller";
import authenticate from "@/middleware/authenticate";
import { Router } from "express";

const postRoutes = Router();

// Protected routes - require authentication
postRoutes.use(authenticate);

// Post CRUD
postRoutes.post("/", createPostHandler);
postRoutes.get("/feed", getFeedHandler);
postRoutes.get("/explore", getExplorePostsHandler);
postRoutes.get("/:id", getPostHandler);
postRoutes.delete("/:id", deletePostHandler);

// Post interactions
postRoutes.post("/like", likePostHandler);

export default postRoutes;
