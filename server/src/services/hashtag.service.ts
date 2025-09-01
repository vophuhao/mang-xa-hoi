import HashtagModel from "@/models/hashtag.model";
import PostModel from "@/models/post.model";
import ErrorFactory from "@/utils/ErrorFactory";

interface HashtagWithPostCount {
  _id: string;
  name: string;
  postCount: number;
  createdAt: Date;
  updatedAt: Date;
}

interface GetTrendingHashtagsParams {
  limit?: number;
  minPosts?: number;
}

interface SearchHashtagsParams {
  query: string;
  page?: number;
  limit?: number;
}

interface GetHashtagPostsParams {
  hashtagName: string;
  page?: number;
  limit?: number;
}

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

class HashtagService {
  /**
   * Get trending hashtags based on usage count
   */
  async getTrendingHashtags({
    limit = 10,
    minPosts = 1,
  }: GetTrendingHashtagsParams): Promise<HashtagWithPostCount[]> {
    try {
      const trendingHashtags = await HashtagModel.aggregate([
        {
          $match: {
            postCount: { $gte: minPosts },
          },
        },
        {
          $sort: { postCount: -1, updatedAt: -1 },
        },
        {
          $limit: limit,
        },
      ]);

      return trendingHashtags;
    } catch (error: any) {
      throw ErrorFactory.internalError("Failed to fetch trending hashtags");
    }
  }

  /**
   * Search hashtags by name
   */
  async searchHashtags({
    query,
    page = 1,
    limit = 20,
  }: SearchHashtagsParams): Promise<PaginationResponse<HashtagWithPostCount>> {
    if (!query || query.trim().length === 0) {
      throw ErrorFactory.requiredField("Search query");
    }

    try {
      const skip = (page - 1) * limit;

      // Create search filter
      const searchFilter = {
        name: { $regex: query.trim(), $options: "i" },
      };

      // Get hashtags with post counts
      const hashtags = await HashtagModel.find(searchFilter)
        .sort({ postCount: -1, name: 1 })
        .skip(skip)
        .limit(limit);

      const total = await HashtagModel.countDocuments(searchFilter);

      return {
        data: hashtags.map(hashtag => ({
          _id: (hashtag._id as any).toString(),
          name: hashtag.name,
          postCount: hashtag.postCount,
          createdAt: hashtag.createdAt,
          updatedAt: hashtag.updatedAt,
        })),
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
      throw ErrorFactory.internalError("Failed to search hashtags");
    }
  }

  /**
   * Get posts for a specific hashtag
   */
  async getHashtagPosts({
    hashtagName,
    page = 1,
    limit = 12,
  }: GetHashtagPostsParams): Promise<PaginationResponse<any>> {
    if (!hashtagName || hashtagName.trim().length === 0) {
      throw ErrorFactory.requiredField("Hashtag name");
    }

    try {
      // Check if hashtag exists
      const hashtag = await HashtagModel.findOne({
        name: hashtagName.toLowerCase().replace(/^#/, ""),
      });

      if (!hashtag) {
        throw ErrorFactory.resourceNotFound("Hashtag");
      }

      const skip = (page - 1) * limit;

      // Get posts that contain this hashtag
      const posts = await PostModel.find({
        hashtags: { $in: [hashtag._id] },
        isHidden: false,
      })
        .populate("user", "username fullName avatarUrl isVerified")
        .populate("hashtags", "name")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      const total = await PostModel.countDocuments({
        hashtags: { $in: [hashtag._id] },
        isHidden: false,
      });

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
      throw ErrorFactory.internalError("Failed to fetch hashtag posts");
    }
  }

  /**
   * Create or update hashtag usage count
   */
  async createOrUpdateHashtag(hashtagName: string): Promise<any> {
    if (!hashtagName || hashtagName.trim().length === 0) {
      throw ErrorFactory.requiredField("Hashtag name");
    }

    try {
      const cleanName = hashtagName.toLowerCase().replace(/^#/, "");

      const hashtag = await HashtagModel.findOneAndUpdate(
        { name: cleanName },
        {
          $inc: { postCount: 1 },
          $setOnInsert: { name: cleanName },
          $set: { updatedAt: new Date() },
        },
        { upsert: true, new: true }
      );

      return hashtag;
    } catch (error: any) {
      throw ErrorFactory.internalError("Failed to create or update hashtag");
    }
  }

  /**
   * Decrease hashtag usage count
   */
  async decreaseHashtagCount(hashtagName: string): Promise<void> {
    if (!hashtagName || hashtagName.trim().length === 0) {
      throw ErrorFactory.requiredField("Hashtag name");
    }

    try {
      const cleanName = hashtagName.toLowerCase().replace(/^#/, "");

      const hashtag = await HashtagModel.findOneAndUpdate(
        { name: cleanName },
        {
          $inc: { postCount: -1 },
          $set: { updatedAt: new Date() },
        },
        { new: true }
      );

      // Remove hashtag if post count reaches 0
      if (hashtag && hashtag.postCount <= 0) {
        await HashtagModel.deleteOne({ _id: hashtag._id });
      }
    } catch (error: any) {
      throw ErrorFactory.internalError("Failed to decrease hashtag count");
    }
  }

  /**
   * Get hashtag by name
   */
  async getHashtagByName(hashtagName: string): Promise<any> {
    if (!hashtagName || hashtagName.trim().length === 0) {
      throw ErrorFactory.requiredField("Hashtag name");
    }

    try {
      const cleanName = hashtagName.toLowerCase().replace(/^#/, "");

      const hashtag = await HashtagModel.findOne({ name: cleanName });

      if (!hashtag) {
        throw ErrorFactory.resourceNotFound("Hashtag");
      }

      return hashtag;
    } catch (error) {
      if (error instanceof Error && error.name === "AppError") {
        throw error;
      }
      throw ErrorFactory.internalError("Failed to fetch hashtag");
    }
  }

  /**
   * Get hashtag statistics
   */
  async getHashtagStats(): Promise<{
    totalHashtags: number;
    totalPosts: number;
    averagePostsPerHashtag: number;
    topHashtags: HashtagWithPostCount[];
  }> {
    try {
      const [stats, topHashtags] = await Promise.all([
        HashtagModel.aggregate([
          {
            $group: {
              _id: null,
              totalHashtags: { $sum: 1 },
              totalPosts: { $sum: "$postCount" },
              averagePostsPerHashtag: { $avg: "$postCount" },
            },
          },
        ]),
        this.getTrendingHashtags({ limit: 5, minPosts: 1 }),
      ]);

      const statsData = stats[0] || {
        totalHashtags: 0,
        totalPosts: 0,
        averagePostsPerHashtag: 0,
      };

      return {
        ...statsData,
        topHashtags,
      };
    } catch (error: any) {
      throw ErrorFactory.internalError("Failed to fetch hashtag statistics");
    }
  }
}

export default new HashtagService();
