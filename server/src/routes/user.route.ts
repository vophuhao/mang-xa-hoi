import {
  followUserHandler,
  getSuggestedUsersHandler,
  getUserHandler,
  getUserProfileHandler,
  searchUsersHandler,
  unfollowUserHandler,
  updateUserProfileHandler,
} from "@/controllers/user.controller";
import authenticate from "@/middleware/authenticate";
import { Router } from "express";

const userRoutes = Router();

// Protected routes - require authentication
userRoutes.use(authenticate);

// Get current user profile
userRoutes.get("/me", getUserHandler);

// Update current user profile
userRoutes.patch("/me", updateUserProfileHandler);

// Get user profile by username
userRoutes.get("/:username", getUserProfileHandler);

// Follow/unfollow users
userRoutes.post("/:userId/follow", followUserHandler);
userRoutes.delete("/:userId/follow", unfollowUserHandler);

// Search users
userRoutes.get("/search", searchUsersHandler);

// Get suggested users
userRoutes.get("/suggestions", getSuggestedUsersHandler);

export default userRoutes;
