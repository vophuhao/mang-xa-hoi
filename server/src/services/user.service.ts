import FollowModel from "@/models/follow.model";
import NotificationModel from "@/models/notification.model";
import PostModel from "@/models/post.model";
import UserModel from "@/models/user.model";
import ErrorFactory from "@/utils/ErrorFactory";

export interface UserProfile {
  _id: string;
  username: string;
  userId: string | undefined;
  email: string;
  avatarUrl?: string;
  bio?: string;
  isVerified: boolean;
  followersCount: number;
  followingCount: number;
  postsCount: number;
  isFollowing?: boolean;
  followsBack?: boolean;
  isOwnProfile?: boolean;
}

export interface SearchUsersParams {
  query: string;
  page: number;
  limit: number;
}

export interface UpdateProfileParams {
  username?: string;
  fullName?: string;
  bio?: string;
  avatarUrl?: string;
}

/**
 * User service containing all user-related business logic
 */
export class UserService {
  /**
   * Get current user profile
   */
  static async getCurrentUser(userId: string) {
    const user = await UserModel.findById(userId).select("-password");

    if (!user) {
      throw ErrorFactory.resourceNotFound("User");
    }

    return user.toJSON();
  }

  /**
   * Get user profile by username
   */
  static async getUserByUsername(username: string, currentUserId: string): Promise<UserProfile> {
    const user = await UserModel.findOne({ username }).select("-password");

    if (!user) {
      throw ErrorFactory.resourceNotFound("User", `User with username "${username}" not found`);
    }

    // Get user stats and relationships in parallel
    const [isFollowing, followsBack, followersCount, followingCount, postsCount] =
      await Promise.all([
        FollowModel.exists({ follower: currentUserId, following: user._id }),
        FollowModel.exists({ follower: user._id, following: currentUserId }),
        FollowModel.countDocuments({ following: user._id }),
        FollowModel.countDocuments({ follower: user._id }),
        PostModel.countDocuments({ user: user._id, isHidden: false }),
      ]);

    const userProfile = {
      _id: (user._id as any).toString(),
      username: user.username,
      userId: user.userId,
      email: user.email,
      avatarUrl: user.avatarUrl,
      bio: user.bio,
      isVerified: user.isVerified,
      followersCount,
      followingCount,
      postsCount,
      isFollowing: !!isFollowing,
      followsBack: !!followsBack,
      isOwnProfile: (user._id as any).toString() === currentUserId.toString(),
    };

    return userProfile as UserProfile;
  }

  /**
   * Get user profile by userId
   */
  static async getUserByUserId(userId: string, currentUserId: string): Promise<UserProfile> {
    const user = await UserModel.findOne({userId}).select("-password");

    if (!user) {
      throw ErrorFactory.resourceNotFound("User", `User with id "${userId}" not found`);
    }

    // Get user stats and relationships in parallel
    const [isFollowing, followsBack, followersCount, followingCount, postsCount] =
      await Promise.all([
        FollowModel.exists({ follower: currentUserId, following: user._id }),
        FollowModel.exists({ follower: user._id, following: currentUserId }),
        FollowModel.countDocuments({ following: user._id }),
        FollowModel.countDocuments({ follower: user._id }),
        PostModel.countDocuments({ user: user._id, isHidden: false }),
      ]);

    const userProfile = {
      _id: (user._id as any).toString(),
      username: user.username,
      userId: user.userId,
      email: user.email,
      avatarUrl: user.avatarUrl,
      bio: user.bio,
      isVerified: user.isVerified,
      followersCount,
      followingCount,
      postsCount,
      isFollowing: !!isFollowing,
      followsBack: !!followsBack,
      isOwnProfile: (user._id as any).toString() === currentUserId.toString(),
    };

    return userProfile as UserProfile;
  }

  /**
   * Follow a user
   */
  static async followUser(userToFollowId: string, currentUserId: string) {
    // Validate inputs
    if (userToFollowId === currentUserId) {
      throw ErrorFactory.forbiddenAction("follow yourself");
    }

    // Check if target user exists
    const targetUser = await UserModel.findById(userToFollowId);
    if (!targetUser) {
      throw ErrorFactory.resourceNotFound("User");
    }

    // Check if already following
    const existingFollow = await FollowModel.findOne({
      follower: currentUserId,
      following: userToFollowId,
    });

    if (existingFollow) {
      throw ErrorFactory.resourceExists("Follow relationship", "Already following this user");
    }

    // Create follow relationship and notification in parallel
    await Promise.all([
      FollowModel.create({ follower: currentUserId, following: userToFollowId }),
      NotificationModel.create({
        recipient: userToFollowId,
        sender: currentUserId,
        type: "follow",
        message: "started following you",
      }),
      UserModel.findByIdAndUpdate(userToFollowId, { $inc: { followersCount: 1 } }),
      UserModel.findByIdAndUpdate(currentUserId, { $inc: { followingCount: 1 } }),
    ]);

    return { message: "User followed successfully" };
  }

  /**
   * Unfollow a user
   */
  static async unfollowUser(userToUnfollowId: string, currentUserId: string) {
    const existingFollow = await FollowModel.findOne({
      follower: currentUserId,
      following: userToUnfollowId,
    });

    if (!existingFollow) {
      throw ErrorFactory.resourceNotFound("Follow relationship", "Not following this user");
    }

    // Remove follow relationship and related notification
    await Promise.all([
      FollowModel.deleteOne({ follower: currentUserId, following: userToUnfollowId }),
      NotificationModel.findOneAndDelete({
        recipient: userToUnfollowId,
        sender: currentUserId,
        type: "follow",
      }),
      UserModel.updateOne(
        { _id: userToUnfollowId, followersCount: { $gt: 0 } },
        { $inc: { followersCount: -1 } }
      ),
      UserModel.updateOne(
        { _id: currentUserId, followingCount: { $gt: 0 } },
        { $inc: { followingCount: -1 } }
      ),
    ]);

    return { message: "User unfollowed successfully" };
  }

  /**
   * Get user's followers
   */
  static async getUserFollowers(username: string, page: number = 1, limit: number = 20) {
    const user = await UserModel.findOne({ username });
    if (!user) {
      throw ErrorFactory.resourceNotFound("User");
    }

    const skip = (page - 1) * limit;

    const [followers, total] = await Promise.all([
      FollowModel.find({ following: user._id })
        .populate("follower", "username fullName avatarUrl isVerified")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      FollowModel.countDocuments({ following: user._id }),
    ]);

    const followersData = followers.map(follow => follow.follower);

    return {
      data: followersData,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1,
      },
    };
  }

  /**
   * Get user's following
   */
  static async getUserFollowing(userId: string, page: number = 1, limit: number = 20) {
    const user = await UserModel.findOne({ userId });
    if (!user) {
      throw ErrorFactory.resourceNotFound("User");
    }

    const skip = (page - 1) * limit;

    const [following, total] = await Promise.all([
      FollowModel.find({ follower: user._id })
        .populate("following", "username userId avatarUrl isVerified")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      FollowModel.countDocuments({ follower: user._id }),
    ]);

    const followingData = following.map(follow => follow.following);

    return {
      data: followingData,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1,
      },
    };
  }

  /**
   * Update user profile
   */
  static async updateProfile(userId: string, updateData: UpdateProfileParams) {
    // Check if username is taken (if updating username)
    if (updateData.username) {
      const existingUser = await UserModel.findOne({
        username: updateData.username,
        _id: { $ne: userId },
      });

      if (existingUser) {
        throw ErrorFactory.resourceExists("Username", "Username already taken");
      }
    }

    const updatedUser = await UserModel.findByIdAndUpdate(
      userId,
      { $set: updateData },
      { new: true, runValidators: true }
    ).select("-password");

    if (!updatedUser) {
      throw ErrorFactory.resourceNotFound("User");
    }

    return updatedUser.toJSON();
  }

  /**
   * Search users
   */
  static async searchUsers({ query, page = 1, limit = 20 }: SearchUsersParams) {
    if (!query?.trim()) {
      throw ErrorFactory.requiredField("Search query");
    }

    const skip = (page - 1) * limit;
    const searchRegex = new RegExp(query.trim(), "i");

    const searchFilter = {
      $or: [{ username: searchRegex }, { fullName: searchRegex }],
    };

    const [users, total] = await Promise.all([
      UserModel.find(searchFilter)
        .select("username fullName avatarUrl isVerified followersCount userId")
        .sort({ followersCount: -1, username: 1 })
        .skip(skip)
        .limit(limit),
      UserModel.countDocuments(searchFilter),
    ]);

    return {
      data: users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1,
      },
    };
  }

  /**
   * Get user's posts
   */
  static async getUserPosts(userId: string, page: number = 1, limit: number = 12) {
    const user = await UserModel.findOne({ userId });
    if (!user) {
      throw ErrorFactory.resourceNotFound("User");
    }

    const skip = (page - 1) * limit;

    const [posts, total] = await Promise.all([
      PostModel.find({
        user: user._id,
        isHidden: false,
      })
        .select("_id caption mediaUrls mediaType likeCount commentCount createdAt location")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      PostModel.countDocuments({
        user: user._id,
        isHidden: false,
      }),
    ]);

    return {
      data: posts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1,
      },
    };
  }

  /**
   * Get suggested users for the current user
   */
  static async getSuggestedUsers(currentUserId: string, limit: number = 10) {
    try {
      // Get users that the current user is not following
      const followingIds = await FollowModel.find({
        follower: currentUserId,
      }).select("following");

      const followingUserIds = followingIds.map(follow => follow.following.toString());
      followingUserIds.push(currentUserId); // Exclude current user

      // Find users not being followed, sorted by followers count
      const suggestedUsers = await UserModel.find({
        _id: { $nin: followingUserIds },
      })
        .select("_id username fullName avatarUrl bio isVerified")
        .limit(limit)
        .sort({ createdAt: -1 }); // Sort by newest users first

      return suggestedUsers.map(user => ({
        _id: user._id,
        username: user.username,
        fullName: user.fullName,
        avatar: user.avatarUrl,
        bio: user.bio,
        isVerified: user.isVerified,
        isFollowing: false,
      }));
    } catch (error) {
      console.error("Error fetching suggested users:", error);
      return [];
    }
  }
}

export default UserService;
