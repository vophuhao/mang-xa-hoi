import { Router } from "express";
import {
  createStoryHandler,
  deleteStoryHandler,
  getStoriesByUsernameHandler,
  getStoriesHandler,
  getStoryAnalyticsHandler,
  getStoryViewersHandler,
  getUserStoriesHandler,
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
storyRoutes.delete("/:storyId", deleteStoryHandler);

// Story interactions
storyRoutes.post("/:storyId/view", viewStoryHandler);

// Story analytics (for owner)
storyRoutes.get("/:storyId/viewers", getStoryViewersHandler);
storyRoutes.get("/:storyId/analytics", getStoryAnalyticsHandler);

// Get stories by username
storyRoutes.get("/user/:username", getStoriesByUsernameHandler);

export default storyRoutes;
