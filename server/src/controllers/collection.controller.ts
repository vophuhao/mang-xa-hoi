import type { AuthenticatedRequest } from "@/types";
import type { Response } from "express";

import { CollectionService } from "@/services/collection.service";
import catchErrors from "@/utils/catchErrors";
import { ResponseUtil } from "@/utils/response";
import {
  collectionIdSchema,
  collectionPostParamsSchema,
  createCollectionSchema,
  getCollectionPostsSchema,
  getCollectionsSchema,
  movePostParamsSchema,
  updateCollectionSchema,
} from "@/validators";

/**
 * Create a new collection
 * @route POST /collections
 */
export const createCollectionHandler = catchErrors(
  async (req: AuthenticatedRequest, res: Response) => {
    const validatedData = createCollectionSchema.parse(req.body);

    const collection = await CollectionService.createCollection({
      userId: req.userId.toString(),
      ...validatedData,
    });

    return ResponseUtil.created(res, collection, "Collection created successfully");
  }
);

/**
 * Get user's collections
 * @route GET /collections
 */
export const getCollectionsHandler = catchErrors(
  async (req: AuthenticatedRequest, res: Response) => {
    const validatedQuery = getCollectionsSchema.parse(req.query);

    const result = await CollectionService.getCollections({
      userId: req.userId.toString(),
      ...validatedQuery,
    });

    return ResponseUtil.paginated(res, result.data, result.pagination);
  }
);

/**
 * Get collection by ID
 * @route GET /collections/:id
 */
export const getCollectionByIdHandler = catchErrors(
  async (req: AuthenticatedRequest, res: Response) => {
    const { id } = collectionIdSchema.parse(req.params);

    const collection = await CollectionService.getCollectionById(id, req.userId.toString());

    return ResponseUtil.success(res, collection);
  }
);

/**
 * Update collection
 * @route PUT /collections/:id
 */
export const updateCollectionHandler = catchErrors(
  async (req: AuthenticatedRequest, res: Response) => {
    const { id } = collectionIdSchema.parse(req.params);
    const validatedData = updateCollectionSchema.parse(req.body);

    const collection = await CollectionService.updateCollection({
      collectionId: id,
      userId: req.userId.toString(),
      ...validatedData,
    });

    return ResponseUtil.success(res, collection, "Collection updated successfully");
  }
);

/**
 * Delete collection
 * @route DELETE /collections/:id
 */
export const deleteCollectionHandler = catchErrors(
  async (req: AuthenticatedRequest, res: Response) => {
    const { id } = collectionIdSchema.parse(req.params);

    const result = await CollectionService.deleteCollection(id, req.userId.toString());

    return ResponseUtil.success(res, result);
  }
);

/**
 * Get posts in a collection
 * @route GET /collections/:id/posts
 */
export const getCollectionPostsHandler = catchErrors(
  async (req: AuthenticatedRequest, res: Response) => {
    const { id } = collectionIdSchema.parse(req.params);
    const validatedQuery = getCollectionPostsSchema.parse(req.query);

    const result = await CollectionService.getCollectionPosts({
      collectionId: id,
      userId: req.userId.toString(),
      ...validatedQuery,
    });

    return ResponseUtil.paginated(res, result.data, result.pagination);
  }
);

/**
 * Add post to collection
 * @route POST /collections/:id/posts/:postId
 */
export const addPostToCollectionHandler = catchErrors(
  async (req: AuthenticatedRequest, res: Response) => {
    const { id, postId } = collectionPostParamsSchema.parse(req.params);

    const result = await CollectionService.addPostToCollection(req.userId.toString(), postId, id);

    return ResponseUtil.success(res, result);
  }
);

/**
 * Remove post from collection
 * @route DELETE /collections/:id/posts/:postId
 */
export const removePostFromCollectionHandler = catchErrors(
  async (req: AuthenticatedRequest, res: Response) => {
    const { id, postId } = collectionPostParamsSchema.parse(req.params);

    const result = await CollectionService.removePostFromCollection(
      req.userId.toString(),
      postId,
      id
    );

    return ResponseUtil.success(res, result);
  }
);

/**
 * Move post between collections
 * @route PUT /collections/:fromId/posts/:postId/move/:toId
 */
export const movePostToCollectionHandler = catchErrors(
  async (req: AuthenticatedRequest, res: Response) => {
    const { fromId, postId, toId } = movePostParamsSchema.parse(req.params);

    const result = await CollectionService.movePostToCollection(
      req.userId.toString(),
      postId,
      fromId,
      toId
    );

    return ResponseUtil.success(res, result);
  }
);
