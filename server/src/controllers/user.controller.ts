import type { AuthenticatedRequest } from "@/types";
import type { Response } from "express";

import FollowModel from "@/models/follow.model";
import UserModel from "@/models/user.model";
import { AppError } from "@/utils/AppError";
import catchErrors from "@/utils/catchErrors";
import { ResponseUtil } from "@/utils/response";
import {
  followUserSchema,
  getUserByUsernameSchema as getUserProfileSchema,
  searchUsersSchema,
  updateProfileSchema as updateUserProfileSchema,
} from "@/validators";

// Get current user profile
export const getUserHandler = catchErrors(async (req: AuthenticatedRequest, res: Response) => {
  const user = await UserModel.findById(req.userId);

  if (!user) {
    throw AppError.notFound("User not found");
  }

  return ResponseUtil.success(res, user.omitPassword(), "User profile retrieved successfully");
});

// Get user profile by username
export const getUserProfileHandler = catchErrors(
  async (req: AuthenticatedRequest, res: Response) => {
    const { username } = getUserProfileSchema.parse(req.params);

    const user = await UserModel.findOne({ username }).select("-password");

    if (!user) {
      throw AppError.notFound("User not found");
    }

    // Check if current user is following this user
    let isFollowing = false;
    let isFollowedBy = false;

    if (req.userId) {
      const followRelation = await FollowModel.findOne({
        follower: req.userId,
        following: user._id,
      });
      isFollowing = !!followRelation;

      const followedByRelation = await FollowModel.findOne({
        follower: user._id,
        following: req.userId,
      });
      isFollowedBy = !!followedByRelation;
    }

    const profile = {
      ...user.toObject(),
      isFollowing,
      isFollowedBy,
      isOwnProfile: req.userId?.toString() === (user._id as any).toString(),
    };

    return ResponseUtil.success(res, profile);
  }
);

// Update user profile
export const updateUserProfileHandler = catchErrors(
  async (req: AuthenticatedRequest, res: Response) => {
    const updateData = updateUserProfileSchema.parse(req.body);

    const user = await UserModel.findByIdAndUpdate(
      req.userId,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!user) {
      throw AppError.notFound("User not found");
    }

    return ResponseUtil.success(res, user.omitPassword());
  }
);

// Follow a user
export const followUserHandler = catchErrors(async (req: AuthenticatedRequest, res: Response) => {
  const { userId: targetUserId } = followUserSchema.parse(req.params);
  const currentUserId = req.userId;

  if (currentUserId.toString() === targetUserId) {
    throw AppError.badRequest("Cannot follow yourself");
  }

  // Check if target user exists
  const targetUser = await UserModel.findById(targetUserId);
  if (!targetUser) {
    throw AppError.notFound("User not found");
  }

  // Check if already following
  const existingFollow = await FollowModel.findOne({
    follower: currentUserId,
    following: targetUserId,
  });

  if (existingFollow) {
    return ResponseUtil.success(res, { message: "Already following this user", isFollowing: true });
  }

  // Create follow relationship
  await FollowModel.create({
    follower: currentUserId,
    following: targetUserId,
  });

  // Update follower/following counts
  await Promise.all([
    UserModel.findByIdAndUpdate(currentUserId, { $inc: { followingCount: 1 } }),
    UserModel.findByIdAndUpdate(targetUserId, { $inc: { followersCount: 1 } }),
  ]);

  return ResponseUtil.success(res, { message: "User followed successfully", isFollowing: true });
});

// Unfollow a user
export const unfollowUserHandler = catchErrors(async (req: AuthenticatedRequest, res: Response) => {
  const { userId: targetUserId } = followUserSchema.parse(req.params);
  const currentUserId = req.userId;

  // Remove follow relationship
  const deletedFollow = await FollowModel.findOneAndDelete({
    follower: currentUserId,
    following: targetUserId,
  });

  if (deletedFollow) {
    // Update follower/following counts
    await Promise.all([
      UserModel.findByIdAndUpdate(currentUserId, { $inc: { followingCount: -1 } }),
      UserModel.findByIdAndUpdate(targetUserId, { $inc: { followersCount: -1 } }),
    ]);
  }

  return ResponseUtil.success(res, { message: "User unfollowed successfully", isFollowing: false });
});

// Search users
export const searchUsersHandler = catchErrors(async (req: AuthenticatedRequest, res: Response) => {
  const { q, page = 1, limit = 20 } = searchUsersSchema.parse(req.query);
  const skip = (page - 1) * limit;

  const users = await UserModel.find({
    $or: [{ username: { $regex: q, $options: "i" } }, { fullName: { $regex: q, $options: "i" } }],
  })
    .select("username fullName avatarUrl isVerified isPrivate followersCount")
    .skip(skip)
    .limit(limit)
    .sort({ followersCount: -1, username: 1 });

  const total = await UserModel.countDocuments({
    $or: [{ username: { $regex: q, $options: "i" } }, { fullName: { $regex: q, $options: "i" } }],
  });

  return ResponseUtil.paginated(res, users, {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
    hasNext: page < Math.ceil(total / limit),
    hasPrev: page > 1,
  });
});

// Get suggested users (people you might know)
export const getSuggestedUsersHandler = catchErrors(
  async (req: AuthenticatedRequest, res: Response) => {
    const currentUserId = req.userId;
    const limit = 10;

    // Get users that current user is not following
    const followingIds = await FollowModel.find({ follower: currentUserId }).distinct("following");

    const suggestedUsers = await UserModel.find({
      _id: {
        $nin: [...followingIds, currentUserId],
      },
      isPrivate: false,
    })
      .select("username fullName avatarUrl isVerified followersCount")
      .limit(limit)
      .sort({ followersCount: -1, createdAt: -1 });

    return ResponseUtil.success(res, suggestedUsers);
  }
);
