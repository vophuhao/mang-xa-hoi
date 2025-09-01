import { Router } from "express";
import {
  getEngagementStatsHandler,
  getFollowerGrowthHandler,
  getUserActivityHandler,
  getUserHashtagsHandler,
  getUserStatsHandler,
} from "../controllers/analytics.controller";
import authenticate from "../middleware/authenticate";

const analyticsRoutes = Router();

// Protected routes - require authentication
analyticsRoutes.use(authenticate);

// User analytics
analyticsRoutes.get("/stats", getUserStatsHandler);
analyticsRoutes.get("/activity", getUserActivityHandler);
analyticsRoutes.get("/engagement", getEngagementStatsHandler);
analyticsRoutes.get("/follower-growth", getFollowerGrowthHandler);
analyticsRoutes.get("/hashtags", getUserHashtagsHandler);

export default analyticsRoutes;
