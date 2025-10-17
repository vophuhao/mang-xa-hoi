import { Router } from "express";
import {
  cleanupDuplicateViewersHandler,
  createHighlightHandler,
  createStoryHandler,
  deleteHighlightHandler,
  deleteStoryHandler,
  getAllUserStoriesHandler,
  getHighlightsHandler,
  getStoriesByUsernameHandler,
  getStoriesHandler,
  getStoryAnalyticsHandler,
  getStoryLikesHandler,
  getStoryViewersHandler,
  getUserStoriesHandler,
  likeStoryHandler,
  removeFromHighlightHandler,
  viewStoryHandler,
} from "../controllers/story.controller";
import authenticate from "../middleware/authenticate";

const storyRoutes = Router();

// Protected routes - require authentication
storyRoutes.use(authenticate);

// Story CRUD
storyRoutes.post("/", createStoryHandler);
storyRoutes.get("/", getStoriesHandler);
storyRoutes.get("/me", getUserStoriesHandler);
storyRoutes.get("/me/all", getAllUserStoriesHandler);
storyRoutes.delete("/:storyId", deleteStoryHandler);

// Story interactions
storyRoutes.post("/:storyId/view", viewStoryHandler);
storyRoutes.post("/:storyId/like", likeStoryHandler);
storyRoutes.get("/:storyId/likes", getStoryLikesHandler);

// Story analytics (for owner)
storyRoutes.get("/:storyId/viewers", getStoryViewersHandler);
storyRoutes.get("/:storyId/analytics", getStoryAnalyticsHandler);

// Cleanup utilities (temporary)
storyRoutes.post("/cleanup/viewers", cleanupDuplicateViewersHandler);

// Get stories by username
storyRoutes.get("/user/:userId", getStoriesByUsernameHandler);

// Highlights
storyRoutes.post("/highlights", createHighlightHandler);
storyRoutes.get("/highlights/:userId", getHighlightsHandler);
storyRoutes.delete("/highlights/:highlightTitle", deleteHighlightHandler);
storyRoutes.delete("/:storyId/highlight", removeFromHighlightHandler);

export default storyRoutes;
