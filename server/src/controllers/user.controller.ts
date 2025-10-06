import type { AuthenticatedRequest } from "@/types";
import type { Response } from "express";

import UserService from "@/services/user.service";
import catchErrors from "@/utils/catchErrors";
import { ResponseUtil } from "@/utils/response";
import {
  followUserSchema,
  getUserByUsernameSchema,
  searchUsersSchema,
  updateProfileSchema,
  getUserByUserIdSchema,
} from "@/validators/user.validator";

/**
 * Get current user profile
 * @route GET /user/me
 */
export const getUserHandler = catchErrors(async (req: AuthenticatedRequest, res: Response) => {
  const user = await UserService.getCurrentUser((req.userId as any).toString());
  return ResponseUtil.success(res, user);
});

/**
 * Get suggested users
 * @route GET /user/suggestions
 */
export const getSuggestedUsersHandler = catchErrors(
  async (req: AuthenticatedRequest, res: Response) => {
    console.log("Getting suggested users for user:", req.userId);
    const suggestions = await UserService.getSuggestedUsers((req.userId as any).toString());
    console.log("Found suggestions:", suggestions.length);
    return ResponseUtil.success(res, suggestions);
  }
);

/**
 * Get user profile by username
 * @route GET /user/:username
 */
export const getUserByUsernameHandler = catchErrors(
  async (req: AuthenticatedRequest, res: Response) => {
    const { username } = getUserByUsernameSchema.parse(req.params);
    const userProfile = await UserService.getUserByUsername(
      username,
      (req.userId as any).toString()
    );
    return ResponseUtil.success(res, userProfile);
  }
);

/**
 * Get user profile by userId
 * @route GET /user/id/:userId
 */
export const getUserByIdHandler = catchErrors(
  async (req: AuthenticatedRequest, res: Response) => {
    const { userId } = getUserByUserIdSchema.parse(req.params);
    const userProfile = await UserService.getUserByUserId(
      userId,
      (req.userId as any).toString()
    );
    return ResponseUtil.success(res, userProfile);
  }
);

/**
 * Follow a user
 * @route POST /user/:userId/follow
 */
export const followUserHandler = catchErrors(async (req: AuthenticatedRequest, res: Response) => {
  const { userId: userToFollowId } = followUserSchema.parse(req.params);
  const result = await UserService.followUser(userToFollowId, (req.userId as any).toString());
  return ResponseUtil.success(res, result);
});

/**
 * Unfollow a user
 * @route DELETE /user/:userId/follow
 */
export const unfollowUserHandler = catchErrors(async (req: AuthenticatedRequest, res: Response) => {
  const { userId: userToUnfollowId } = followUserSchema.parse(req.params);
  const result = await UserService.unfollowUser(userToUnfollowId, (req.userId as any).toString());
  return ResponseUtil.success(res, result);
});

/**
 * Get user's followers
 * @route GET /user/:username/followers
 */
export const getFollowersHandler = catchErrors(async (req: AuthenticatedRequest, res: Response) => {
  const { username } = getUserByUsernameSchema.parse(req.params);
  const { page = 1, limit = 20 } = req.query as any;

  const result = await UserService.getUserFollowers(username, Number(page), Number(limit));
  return ResponseUtil.paginated(res, result.data, result.pagination);
});

/**
 * Get user's following
 * @route GET /user/:username/following
 */
export const getFollowingHandler = catchErrors(async (req: AuthenticatedRequest, res: Response) => {
  const { username } = getUserByUsernameSchema.parse(req.params);
  const { page = 1, limit = 20 } = req.query as any;

  const result = await UserService.getUserFollowing(username, Number(page), Number(limit));
  return ResponseUtil.paginated(res, result.data, result.pagination);
});

/**
 * Update user profile
 * @route PATCH /user/me
 */
export const updateProfileHandler = catchErrors(
  async (req: AuthenticatedRequest, res: Response) => {
    const updateData = updateProfileSchema.parse(req.body);
    const updatedUser = await UserService.updateProfile(
      (req.userId as any).toString(),
      updateData as any
    );
    return ResponseUtil.success(res, updatedUser, "Profile updated successfully");
  }
);

/**
 * Search users
 * @route GET /user/search
 */
export const searchUsersHandler = catchErrors(async (req: AuthenticatedRequest, res: Response) => {
  const { q: query, page = 1, limit = 20 } = searchUsersSchema.parse(req.query);

  const result = await UserService.searchUsers({
    query,
    page: Number(page),
    limit: Number(limit),
  });

  return ResponseUtil.paginated(res, result.data, result.pagination);
});

/**
 * Get user's posts
 * @route GET /user/:username/posts
 */
export const getUserPostsHandler = catchErrors(async (req: AuthenticatedRequest, res: Response) => {
  const { username } = getUserByUsernameSchema.parse(req.params);
  const { page = 1, limit = 12 } = req.query as any;

  const result = await UserService.getUserPosts(username, Number(page), Number(limit));
  return ResponseUtil.paginated(res, result.data, result.pagination);
});
