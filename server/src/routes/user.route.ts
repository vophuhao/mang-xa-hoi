import {
  followUserHandler,
  getFollowersHandler,
  getFollowingHandler,
  getUserByUsernameHandler,
  getUserHandler,
  getUserPostsHandler,
  searchUsersHandler,
  unfollowUserHandler,
  updateProfileHandler,
} from "@/controllers/user.controller";
import authenticate from "@/middleware/authenticate";
import { Router } from "express";

const userRoutes = Router();

// Protected routes - require authentication
userRoutes.use(authenticate);

// Get current user profile
userRoutes.get("/me", getUserHandler);

// Update current user profile
userRoutes.patch("/me", updateProfileHandler);

// Get user profile by username
userRoutes.get("/:username", getUserByUsernameHandler);

// Get user's posts
userRoutes.get("/:username/posts", getUserPostsHandler);

// Get user's followers
userRoutes.get("/:username/followers", getFollowersHandler);

// Get user's following
userRoutes.get("/:username/following", getFollowingHandler);

// Follow/unfollow users
userRoutes.post("/:userId/follow", followUserHandler);
userRoutes.delete("/:userId/follow", unfollowUserHandler);

// Search users
userRoutes.get("/search", searchUsersHandler);

export default userRoutes;
