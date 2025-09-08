import { Router } from "express";
import {
  getHashtagDetailsHandler,
  getHashtagPostsHandler,
  getHashtagStatsHandler,
  getTrendingHashtagsHandler,
  searchHashtagsHandler,
} from "../controllers/hashtag.controller";
import authenticate from "../middleware/authenticate";

const hashtagRoutes = Router();

// Protected routes - require authentication
hashtagRoutes.use(authenticate);

// Get hashtags
hashtagRoutes.get("/trending", getTrendingHashtagsHandler);
hashtagRoutes.get("/search", searchHashtagsHandler);
hashtagRoutes.get("/stats", getHashtagStatsHandler);

// Get hashtag details and posts
hashtagRoutes.get("/:hashtagName", getHashtagDetailsHandler);
hashtagRoutes.get("/:hashtagName/posts", getHashtagPostsHandler);

export default hashtagRoutes;
