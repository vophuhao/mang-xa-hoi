import {
  followUserHandler,
  getFollowersHandler,
  getFollowingHandler,
  getSuggestedUsersHandler,
  getUserByUsernameHandler,
  getUserHandler,
  getUserPostsHandler,
  searchUsersHandler,
  unfollowUserHandler,
  updateProfileHandler,
  getUserByIdHandler,
} from "@/controllers/user.controller";
import authenticate from "@/middleware/authenticate";
import { Router } from "express";

const userRoutes = Router();

// Protected routes - require authentication
userRoutes.use(authenticate);

// Search users
userRoutes.get("/search", searchUsersHandler);

// Get current user profile
userRoutes.get("/me", getUserHandler);

// Get suggested users
userRoutes.get("/suggestions", getSuggestedUsersHandler);

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
userRoutes.get("/userid/:userId", getUserByIdHandler);



export default userRoutes;
