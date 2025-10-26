import CollectionModel from "@/models/collection.model";
import PostModel from "@/models/post.model";
import SavedPostModel from "@/models/savedPost.model";
import { ErrorFactory } from "@/utils/errors";

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

interface GetCollectionsParams {
  userId: string;
  page?: number;
  limit?: number;
  includePrivate?: boolean;
}

interface CreateCollectionParams {
  userId: string;
  name: string;
  description?: string | undefined;
  isPrivate?: boolean | undefined;
}

interface UpdateCollectionParams {
  collectionId: string;
  userId: string;
  name?: string | undefined;
  description?: string | undefined;
  isPrivate?: boolean | undefined;
}

interface GetCollectionPostsParams {
  collectionId: string;
  userId: string;
  page?: number;
  limit?: number;
}

export class CollectionService {
  /**
   * Create a new collection
   */
  static async createCollection(params: CreateCollectionParams) {
    const { userId, name, description, isPrivate = false } = params;

    // Check if collection with same name already exists for user
    const existingCollection = await CollectionModel.findOne({
      user: userId,
      name: name.trim(),
    });

    if (existingCollection) {
      throw ErrorFactory.resourceExists("Collection", "Collection with this name already exists");
    }

    const collection = await CollectionModel.create({
      user: userId,
      name: name.trim(),
      description: description?.trim(),
      isPrivate,
    });

    return collection.toJSON();
  }

  /**
   * Get user's collections
   */
  static async getCollections(params: GetCollectionsParams): Promise<PaginationResponse<any>> {
    const { userId, page = 1, limit = 10, includePrivate = true } = params;

    const query: any = { user: userId };
    if (!includePrivate) {
      query.isPrivate = false;
    }

    const skip = (page - 1) * limit;

    const [collections, total] = await Promise.all([
      CollectionModel.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      CollectionModel.countDocuments(query),
    ]);

    // Get cover image for each collection (first post's image)
    const collectionsWithCovers = await Promise.all(
      collections.map(async collection => {
        const firstPost = await SavedPostModel.findOne({
          collection: collection._id,
        })
          .populate({
            path: "post",
            select: "mediaUrls",
          })
          .lean();

        return {
          ...collection,
          coverImage: (firstPost?.post as any)?.mediaUrls?.[0] || null,
        };
      })
    );

    const totalPages = Math.ceil(total / limit);

    return {
      data: collectionsWithCovers,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
  }

  /**
   * Get collection by ID
   */
  static async getCollectionById(collectionId: string, userId: string) {
    const collection = await CollectionModel.findById(collectionId).lean();

    if (!collection) {
      throw ErrorFactory.resourceNotFound("Collection");
    }

    // Check if user can access this collection
    if (collection.isPrivate && collection.user.toString() !== userId) {
      throw ErrorFactory.forbiddenAction("Access to private collection");
    }

    // Get cover image
    const firstPost = await SavedPostModel.findOne({
      collection: collectionId,
    })
      .populate({
        path: "post",
        select: "mediaUrls",
      })
      .lean();

    return {
      ...collection,
      coverImage: (firstPost?.post as any)?.mediaUrls?.[0] || null,
    };
  }

  /**
   * Update collection
   */
  static async updateCollection(params: UpdateCollectionParams) {
    const { collectionId, userId, name, description, isPrivate } = params;

    const collection = await CollectionModel.findById(collectionId);

    if (!collection) {
      throw ErrorFactory.resourceNotFound("Collection");
    }

    // Check ownership
    if (collection.user.toString() !== userId) {
      throw ErrorFactory.forbiddenAction("Update collection");
    }

    // Check for duplicate name if name is being updated
    if (name && name.trim() !== collection.name) {
      const existingCollection = await CollectionModel.findOne({
        user: userId,
        name: name.trim(),
        _id: { $ne: collectionId },
      });

      if (existingCollection) {
        throw ErrorFactory.resourceExists("Collection", "Collection with this name already exists");
      }
    }

    // Update fields
    if (name !== undefined) collection.name = name.trim();
    if (description !== undefined) collection.description = description?.trim();
    if (isPrivate !== undefined) collection.isPrivate = isPrivate;

    await collection.save();
    return collection.toJSON();
  }

  /**
   * Delete collection
   */
  static async deleteCollection(collectionId: string, userId: string) {
    const collection = await CollectionModel.findById(collectionId);

    if (!collection) {
      throw ErrorFactory.resourceNotFound("Collection");
    }

    // Check ownership
    if (collection.user.toString() !== userId) {
      throw ErrorFactory.forbiddenAction("Delete collection");
    }

    // Move saved posts back to default (no collection)
    await SavedPostModel.updateMany({ collection: collectionId }, { $unset: { collection: 1 } });

    await CollectionModel.findByIdAndDelete(collectionId);

    return { message: "Collection deleted successfully" };
  }

  /**
   * Get posts in a collection
   */
  static async getCollectionPosts(
    params: GetCollectionPostsParams
  ): Promise<PaginationResponse<any>> {
    const { collectionId, userId, page = 1, limit = 12 } = params;

    // Check if collection exists and user can access it
    const collection = await CollectionModel.findById(collectionId);
    if (!collection) {
      throw ErrorFactory.resourceNotFound("Collection");
    }

    if (collection.isPrivate && collection.user.toString() !== userId) {
      throw ErrorFactory.forbiddenAction("Access to private collection");
    }

    const skip = (page - 1) * limit;

    const [savedPosts, total] = await Promise.all([
      SavedPostModel.find({ collection: collectionId })
        .populate({
          path: "post",
          populate: {
            path: "user",
            select: "username userId avatarUrl isVerified",
          },
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      SavedPostModel.countDocuments({ collection: collectionId }),
    ]);

    const posts = savedPosts.map(savedPost => savedPost.post);
    const totalPages = Math.ceil(total / limit);

    return {
      data: posts,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
  }

  /**
   * Add post to collection
   */
  static async addPostToCollection(userId: string, postId: string, collectionId: string) {
    // Check if collection exists and belongs to user
    const collection = await CollectionModel.findById(collectionId);
    if (!collection) {
      throw ErrorFactory.resourceNotFound("Collection");
    }

    if (collection.user.toString() !== userId) {
      throw ErrorFactory.forbiddenAction("Add to collection");
    }

    // Check if post exists
    const post = await PostModel.findById(postId);
    if (!post) {
      throw ErrorFactory.resourceNotFound("Post");
    }

    // Check if post is already in this collection
    const existingSave = await SavedPostModel.findOne({
      user: userId,
      post: postId,
      collection: collectionId,
    });

    if (existingSave) {
      throw ErrorFactory.resourceExists("Saved post", "Post is already in this collection");
    }

    // If post is saved without collection, update it
    const existingSaveWithoutCollection = await SavedPostModel.findOne({
      user: userId,
      post: postId,
      collection: { $exists: false },
    });

    if (existingSaveWithoutCollection) {
      existingSaveWithoutCollection.collection = collectionId as any;
      await existingSaveWithoutCollection.save();
    } else {
      // Create new saved post with collection
      await SavedPostModel.create({
        user: userId,
        post: postId,
        collection: collectionId,
      });
    }

    // Update collection post count
    await CollectionModel.findByIdAndUpdate(collectionId, {
      $inc: { postCount: 1 },
    });

    return { message: "Post added to collection successfully" };
  }

  /**
   * Remove post from collection
   */
  static async removePostFromCollection(userId: string, postId: string, collectionId: string) {
    const savedPost = await SavedPostModel.findOne({
      user: userId,
      post: postId,
      collection: collectionId,
    });

    if (!savedPost) {
      throw ErrorFactory.resourceNotFound("Saved post in collection");
    }

    // Remove collection reference (keep as saved post without collection)
    await SavedPostModel.findByIdAndUpdate(savedPost._id, {
      $unset: { collection: 1 },
    });

    // Update collection post count
    await CollectionModel.findByIdAndUpdate(collectionId, {
      $inc: { postCount: -1 },
    });

    return { message: "Post removed from collection successfully" };
  }

  /**
   * Move post between collections
   */
  static async movePostToCollection(
    userId: string,
    postId: string,
    fromCollectionId: string,
    toCollectionId: string
  ) {
    // Check if both collections exist and belong to user
    const [fromCollection, toCollection] = await Promise.all([
      CollectionModel.findById(fromCollectionId),
      CollectionModel.findById(toCollectionId),
    ]);

    if (!fromCollection || !toCollection) {
      throw ErrorFactory.resourceNotFound("Collection");
    }

    if (fromCollection.user.toString() !== userId || toCollection.user.toString() !== userId) {
      throw ErrorFactory.forbiddenAction("Move between collections");
    }

    // Check if post exists in from collection
    const savedPost = await SavedPostModel.findOne({
      user: userId,
      post: postId,
      collection: fromCollectionId,
    });

    if (!savedPost) {
      throw ErrorFactory.resourceNotFound("Saved post in source collection");
    }

    // Check if post already exists in target collection
    const existingInTarget = await SavedPostModel.findOne({
      user: userId,
      post: postId,
      collection: toCollectionId,
    });

    if (existingInTarget) {
      throw ErrorFactory.resourceExists("Saved post", "Post already exists in target collection");
    }

    // Update the saved post
    savedPost.collection = toCollectionId as any;
    await savedPost.save();

    // Update post counts
    await Promise.all([
      CollectionModel.findByIdAndUpdate(fromCollectionId, { $inc: { postCount: -1 } }),
      CollectionModel.findByIdAndUpdate(toCollectionId, { $inc: { postCount: 1 } }),
    ]);

    return { message: "Post moved successfully" };
  }
}
