import {
  followUserHandler,
  getAllUser,
  getFollowersHandler,
  getFollowingHandler,
  getSuggestedUsersHandler,
  getUserByIdHandler,
  getUserHandler,
  getUserPostsHandler,
  getUserTaggedPostsHandler,
  searchUsersHandler,
  unfollowUserHandler,
  updateProfileHandler,
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
userRoutes.get("/:userId", getUserByIdHandler);

// Get user's posts
userRoutes.get("/:userId/posts", getUserPostsHandler);

// Get user's tagged posts
userRoutes.get("/:userId/tagged", getUserTaggedPostsHandler);

// Get user's followers
userRoutes.get("/:userId/followers", getFollowersHandler);

// Get user's following
userRoutes.get("/:userId/following", getFollowingHandler);

// Follow/unfollow users
userRoutes.post("/:userId/follow", followUserHandler);
userRoutes.delete("/:userId/follow", unfollowUserHandler);
userRoutes.get("/userid/:userId", getUserByIdHandler);

userRoutes.get("/all/users", getAllUser);

export default userRoutes;
