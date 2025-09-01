import { Router } from "express";
import {
  checkSavedStatusHandler,
  getSavedPostCountHandler,
  getSavedPostsHandler,
  getSavedPostStatsHandler,
  savePostHandler,
  unsavePostHandler,
} from "../controllers/savedPost.controller";
import authenticate from "../middleware/authenticate";

const savedPostRoutes = Router();

// Protected routes - require authentication
savedPostRoutes.use(authenticate);

// Save/unsave posts
savedPostRoutes.post("/:postId", savePostHandler);
savedPostRoutes.delete("/:postId", unsavePostHandler);

// Get saved posts
savedPostRoutes.get("/", getSavedPostsHandler);
savedPostRoutes.get("/count", getSavedPostCountHandler);
savedPostRoutes.get("/stats", getSavedPostStatsHandler);
savedPostRoutes.get("/:postId/status", checkSavedStatusHandler);

export default savedPostRoutes;
