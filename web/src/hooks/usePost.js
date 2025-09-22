import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { getFeedPosts, getPostById, likePost } from "@/lib/api";

export const POST_QUERY_KEYS = {
  feed: (page) => ["posts", "feed", page],
  post: (id) => ["posts", id],
};

/**
 * Hook to get feed posts with pagination
 */
export const useFeedPosts = (page = 1) => {
  return useQuery({
    queryKey: POST_QUERY_KEYS.feed(page),
    queryFn: () => getFeedPosts({ page, limit: 10 }),
    keepPreviousData: true,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

/**
 * Hook to get single post
 */
export const useSinglePost = (postId) => {
  return useQuery({
    queryKey: POST_QUERY_KEYS.post(postId),
    queryFn: () => getPostById(postId),
    enabled: !!postId,
  });
};

/**
 * Hook to like/unlike posts
 */
export const useLikePost = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: likePost,
    onSuccess: (_, postId) => {
      // Invalidate feed queries to refresh like counts
      queryClient.invalidateQueries({
        queryKey: ["posts", "feed"],
      });

      // Invalidate specific post query
      queryClient.invalidateQueries({
        queryKey: POST_QUERY_KEYS.post(postId),
      });
    },
  });
};

/**
 * Main usePost hook for actions
 */
export const usePostActions = () => {
  const likeMutation = useLikePost();

  return {
    likePost: likeMutation.mutate,
    isLiking: likeMutation.isLoading,
    likeError: likeMutation.error,
  };
};

export default usePostActions;
