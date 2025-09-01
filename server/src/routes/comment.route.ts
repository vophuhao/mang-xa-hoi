import { Router } from "express";
import {
  addCommentHandler,
  deleteCommentHandler,
  getCommentRepliesHandler,
  getCommentsHandler,
  likeCommentHandler,
  updateCommentHandler,
} from "../controllers/comment.controller";
import authenticate from "../middleware/authenticate";

const commentRoutes = Router();

// Protected routes - require authentication
commentRoutes.use(authenticate);

// Comment CRUD for posts
commentRoutes.post("/post/:postId", addCommentHandler);
commentRoutes.get("/post/:postId", getCommentsHandler);
commentRoutes.put("/:commentId", updateCommentHandler);
commentRoutes.delete("/:commentId", deleteCommentHandler);

// Comment interactions
commentRoutes.post("/:commentId/like", likeCommentHandler);

// Reply system
commentRoutes.get("/:commentId/replies", getCommentRepliesHandler);

export default commentRoutes;
