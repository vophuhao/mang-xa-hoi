import CollectionModel from "@/models/collection.model";
import PostModel from "@/models/post.model";
import SavedPostModel from "@/models/savedPost.model";
import ErrorFactory from "@/utils/ErrorFactory";

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

interface PaginationResponse<T> {
  data: T[];
  pagination: PaginationInfo;
}

interface GetSavedPostsParams {
  userId: string;
  page?: number;
  limit?: number;
}

class SavedPostService {
  /**
   * Save a post for a user
   */
  async savePost(
    userId: string,
    postId: string,
    collectionId?: string
  ): Promise<{ message: string }> {
    if (!userId || !postId) {
      throw ErrorFactory.requiredField("User ID and Post ID");
    }

    try {
      // Check if post exists
      const post = await PostModel.findById(postId);
      if (!post) {
        throw ErrorFactory.resourceNotFound("Post");
      }

      // Check if post is already saved in the same collection (or without collection)
      const query: any = {
        user: userId,
        post: postId,
      };

      if (collectionId) {
        query.collection = collectionId;
      } else {
        query.collection = { $exists: false };
      }

      const existingSave = await SavedPostModel.findOne(query);

      if (existingSave) {
        const location = collectionId ? "in this collection" : "";
        throw ErrorFactory.resourceExists("Saved post", `Post is already saved ${location}`);
      }

      // Save the post
      await SavedPostModel.create({
        user: userId,
        post: postId,
        ...(collectionId && { collection: collectionId }),
      });

      return { message: "Post saved successfully" };
    } catch (error) {
      if (error instanceof Error && error.name === "AppError") {
        throw error;
      }
      throw ErrorFactory.internalError("Failed to save post");
    }
  }

  /**
   * Unsave a post for a user
   */
  async unsavePost(userId: string, postId: string): Promise<{ message: string }> {
    if (!userId || !postId) {
      throw ErrorFactory.requiredField("User ID and Post ID");
    }

    try {
      // Find saved post to check if it's in a collection
      const savedPost = await SavedPostModel.findOne({
        user: userId,
        post: postId,
      });

      if (savedPost) {
        // If post is in a collection, update the collection's postCount
        if (savedPost.collection) {
          await CollectionModel.findByIdAndUpdate(savedPost.collection, {
            $inc: { postCount: -1 },
          });
        }

        // Remove the saved post
        await SavedPostModel.deleteOne({
          user: userId,
          post: postId,
        });
      }

      // Even if no document was deleted (post wasn't saved), consider it successful
      // This prevents errors when user clicks unsave multiple times

      return { message: "Post unsaved successfully" };
    } catch (error) {
      if (error instanceof Error && error.name === "AppError") {
        throw error;
      }
      throw ErrorFactory.internalError("Failed to unsave post");
    }
  }

  /**
   * Get user's saved posts with pagination
   */
  async getSavedPosts({
    userId,
    page = 1,
    limit = 12,
  }: GetSavedPostsParams): Promise<PaginationResponse<any>> {
    if (!userId) {
      throw ErrorFactory.requiredField("User ID");
    }

    try {
      const skip = (page - 1) * limit;

      // Get saved posts with post details
      const savedPosts = await SavedPostModel.find({ user: userId })
        .populate({
          path: "post",
          populate: [
            {
              path: "user",
              select: "username userId avatarUrl isVerified",
            },
            {
              path: "hashtags",
              select: "name",
            },
          ],
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      // Filter out saved posts where the actual post no longer exists
      const validSavedPosts = savedPosts.filter(savedPost => savedPost.post);

      // Extract the post data
      const posts = validSavedPosts.map(savedPost => ({
        ...savedPost.post,
        savedAt: savedPost.createdAt,
      }));

      const total = await SavedPostModel.countDocuments({ user: userId });

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
    } catch (error) {
      if (error instanceof Error && error.name === "AppError") {
        throw error;
      }
      throw ErrorFactory.internalError("Failed to fetch saved posts");
    }
  }

  /**
   * Check if a post is saved by a user
   */
  async isPostSaved(userId: string, postId: string): Promise<boolean> {
    if (!userId || !postId) {
      return false;
    }

    try {
      const savedPost = await SavedPostModel.findOne({
        user: userId,
        post: postId,
      });

      return !!savedPost;
    } catch (error: any) {
      // Return false on error instead of throwing
      return false;
    }
  }

  /**
   * Get saved post count for a user
   */
  async getSavedPostCount(userId: string): Promise<number> {
    if (!userId) {
      throw ErrorFactory.requiredField("User ID");
    }

    try {
      const count = await SavedPostModel.countDocuments({ user: userId });
      return count;
    } catch (error: any) {
      throw ErrorFactory.internalError("Failed to get saved post count");
    }
  }

  /**
   * Get users who saved a specific post
   */
  async getPostSavers(postId: string, page = 1, limit = 20): Promise<PaginationResponse<any>> {
    if (!postId) {
      throw ErrorFactory.requiredField("Post ID");
    }

    try {
      const skip = (page - 1) * limit;

      const savedPosts = await SavedPostModel.find({ post: postId })
        .populate("user", "username userId avatarUrl isVerified followersCount")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      const users = savedPosts.map(savedPost => ({
        ...savedPost.user,
        savedAt: savedPost.createdAt,
      }));

      const total = await SavedPostModel.countDocuments({ post: postId });

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
    } catch (error) {
      if (error instanceof Error && error.name === "AppError") {
        throw error;
      }
      throw ErrorFactory.internalError("Failed to fetch post savers");
    }
  }

  /**
   * Remove saved posts for deleted posts
   */
  async removeSavedPostsForDeletedPost(postId: string): Promise<void> {
    if (!postId) {
      return;
    }

    try {
      // Find all saved posts for this post to update collection counts
      const savedPosts = await SavedPostModel.find({
        post: postId,
        collection: { $exists: true },
      }).select("collection");

      // Group by collection to get counts
      const collectionCounts = savedPosts.reduce(
        (acc, savedPost) => {
          const collectionId = savedPost.collection.toString();
          acc[collectionId] = (acc[collectionId] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      );

      // Update collection counts
      const updatePromises = Object.entries(collectionCounts).map(([collectionId, count]) =>
        CollectionModel.findByIdAndUpdate(collectionId, {
          $inc: { postCount: -count },
        })
      );

      await Promise.all([...updatePromises, SavedPostModel.deleteMany({ post: postId })]);
    } catch (error: any) {
      // Log error but don't throw - this is a cleanup operation
      console.error("Failed to remove saved posts for deleted post:", error);
    }
  }

  /**
   * Get saved post statistics for a user
   */
  async getSavedPostStats(userId: string): Promise<{
    totalSaved: number;
    savedThisMonth: number;
    savedThisWeek: number;
    mostSavedHashtags: any[];
  }> {
    if (!userId) {
      throw ErrorFactory.requiredField("User ID");
    }

    try {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay());

      const [totalSaved, savedThisMonth, savedThisWeek, mostSavedHashtags] = await Promise.all([
        SavedPostModel.countDocuments({ user: userId }),
        SavedPostModel.countDocuments({
          user: userId,
          createdAt: { $gte: startOfMonth },
        }),
        SavedPostModel.countDocuments({
          user: userId,
          createdAt: { $gte: startOfWeek },
        }),
        SavedPostModel.aggregate([
          { $match: { user: userId } },
          {
            $lookup: {
              from: "posts",
              localField: "post",
              foreignField: "_id",
              as: "postData",
            },
          },
          { $unwind: "$postData" },
          { $unwind: "$postData.hashtags" },
          {
            $lookup: {
              from: "hashtags",
              localField: "postData.hashtags",
              foreignField: "_id",
              as: "hashtagData",
            },
          },
          { $unwind: "$hashtagData" },
          {
            $group: {
              _id: "$hashtagData._id",
              name: { $first: "$hashtagData.name" },
              count: { $sum: 1 },
            },
          },
          { $sort: { count: -1 } },
          { $limit: 5 },
        ]),
      ]);

      return {
        totalSaved,
        savedThisMonth,
        savedThisWeek,
        mostSavedHashtags,
      };
    } catch (error: any) {
      throw ErrorFactory.internalError("Failed to get saved post statistics");
    }
  }
}

export default new SavedPostService();
