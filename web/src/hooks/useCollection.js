import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";

import {
  addPostToCollection,
  createCollection,
  deleteCollection,
  getCollectionById,
  getCollectionPosts,
  getCollections,
  movePostToCollection,
  removePostFromCollection,
  updateCollection,
} from "@/lib/api";

// Query keys for caching
export const COLLECTION_QUERY_KEYS = {
  collections: ["collections"],
  userCollections: (userId) => ["collections", "user", userId],
  collection: (id) => ["collections", id],
  collectionPosts: (id, page) => ["collections", id, "posts", page],
};

/**
 * Hook to get user's collections
 */
export const useCollections = (options = {}) => {
  return useQuery({
    queryKey: COLLECTION_QUERY_KEYS.collections,
    queryFn: () => getCollections(options),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Hook to get collection by ID
 */
export const useCollection = (id) => {
  return useQuery({
    queryKey: COLLECTION_QUERY_KEYS.collection(id),
    queryFn: () => getCollectionById(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
};

/**
 * Hook to get collection posts with infinite scroll
 */
export const useCollectionPosts = (collectionId) => {
  return useInfiniteQuery({
    queryKey: COLLECTION_QUERY_KEYS.collectionPosts(collectionId),
    queryFn: ({ pageParam = 1 }) => getCollectionPosts(collectionId, { page: pageParam }),
    enabled: !!collectionId,
    getNextPageParam: (lastPage) => {
      const { pagination } = lastPage;
      return pagination.hasNext ? pagination.page + 1 : undefined;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

/**
 * Hook to create a collection
 */
export const useCreateCollection = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createCollection,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: COLLECTION_QUERY_KEYS.collections });
      toast.success(data.message || "Collection created successfully!");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create collection");
    },
  });
};

/**
 * Hook to update a collection
 */
export const useUpdateCollection = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }) => updateCollection(id, data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: COLLECTION_QUERY_KEYS.collections });
      queryClient.invalidateQueries({ queryKey: COLLECTION_QUERY_KEYS.collection(variables.id) });
      toast.success(data.message || "Collection updated successfully!");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update collection");
    },
  });
};

/**
 * Hook to delete a collection
 */
export const useDeleteCollection = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteCollection,
    onSuccess: (data, collectionId) => {
      queryClient.invalidateQueries({ queryKey: COLLECTION_QUERY_KEYS.collections });
      queryClient.removeQueries({ queryKey: COLLECTION_QUERY_KEYS.collection(collectionId) });
      queryClient.removeQueries({ queryKey: COLLECTION_QUERY_KEYS.collectionPosts(collectionId) });
      toast.success(data.message || "Collection deleted successfully!");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete collection");
    },
  });
};

/**
 * Hook to add post to collection
 */
export const useAddPostToCollection = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ collectionId, postId }) => addPostToCollection(collectionId, postId),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: COLLECTION_QUERY_KEYS.collections });
      queryClient.invalidateQueries({
        queryKey: COLLECTION_QUERY_KEYS.collection(variables.collectionId),
      });
      queryClient.invalidateQueries({
        queryKey: COLLECTION_QUERY_KEYS.collectionPosts(variables.collectionId),
      });
      // Invalidate saved posts queries
      queryClient.invalidateQueries({ queryKey: ["savedPosts"] });
      toast.success(data.message || "Post added to collection!");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to add post to collection");
    },
  });
};

/**
 * Hook to remove post from collection
 */
export const useRemovePostFromCollection = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ collectionId, postId }) => removePostFromCollection(collectionId, postId),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: COLLECTION_QUERY_KEYS.collections });
      queryClient.invalidateQueries({
        queryKey: COLLECTION_QUERY_KEYS.collection(variables.collectionId),
      });
      queryClient.invalidateQueries({
        queryKey: COLLECTION_QUERY_KEYS.collectionPosts(variables.collectionId),
      });
      // Invalidate saved posts queries
      queryClient.invalidateQueries({ queryKey: ["savedPosts"] });
      toast.success(data.message || "Post removed from collection!");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to remove post from collection");
    },
  });
};

/**
 * Hook to move post between collections
 */
export const useMovePostToCollection = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ fromCollectionId, postId, toCollectionId }) =>
      movePostToCollection(fromCollectionId, postId, toCollectionId),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: COLLECTION_QUERY_KEYS.collections });
      queryClient.invalidateQueries({
        queryKey: COLLECTION_QUERY_KEYS.collection(variables.fromCollectionId),
      });
      queryClient.invalidateQueries({
        queryKey: COLLECTION_QUERY_KEYS.collection(variables.toCollectionId),
      });
      queryClient.invalidateQueries({
        queryKey: COLLECTION_QUERY_KEYS.collectionPosts(variables.fromCollectionId),
      });
      queryClient.invalidateQueries({
        queryKey: COLLECTION_QUERY_KEYS.collectionPosts(variables.toCollectionId),
      });
      toast.success(data.message || "Post moved successfully!");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to move post");
    },
  });
};
