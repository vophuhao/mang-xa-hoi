import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  addComment,
  deleteComment,
  getCommentReplies,
  getComments,
  likeComment,
  updateComment,
} from "@/lib/api";

export const COMMENT_QUERY_KEYS = {
  comments: (postId) => ["comments", "post", postId],
  replies: (commentId) => ["comments", "replies", commentId],
};

/**
 * Hook to get comments for a post
 */
export const useComments = (postId) => {
  return useQuery({
    queryKey: COMMENT_QUERY_KEYS.comments(postId),
    queryFn: () => getComments(postId),
    enabled: !!postId,
    staleTime: 1 * 60 * 1000, // 1 minute
  });
};

/**
 * Hook to get replies for a comment
 */
export const useCommentReplies = (commentId) => {
  return useQuery({
    queryKey: COMMENT_QUERY_KEYS.replies(commentId),
    queryFn: () => getCommentReplies(commentId),
    enabled: !!commentId,
    staleTime: 1 * 60 * 1000, // 1 minute
  });
};

/**
 * Hook to add a new comment
 */
export const useAddComment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ postId, content }) => addComment(postId, { content }),
    onSuccess: (_, { postId }) => {
      // Invalidate comments for the post
      queryClient.invalidateQueries({
        queryKey: COMMENT_QUERY_KEYS.comments(postId),
      });

      // Invalidate feed queries to refresh comment counts
      queryClient.invalidateQueries({
        queryKey: ["posts", "feed"],
      });

      // Invalidate specific post query
      queryClient.invalidateQueries({
        queryKey: ["posts", postId],
      });
    },
  });
};

/**
 * Hook to update a comment
 */
export const useUpdateComment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ commentId, content }) => updateComment(commentId, { content }),
    onSuccess: (_, { postId }) => {
      if (postId) {
        queryClient.invalidateQueries({
          queryKey: COMMENT_QUERY_KEYS.comments(postId),
        });
      }
    },
  });
};

/**
 * Hook to delete a comment
 */
export const useDeleteComment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteComment,
    onSuccess: (_, commentId, { postId }) => {
      if (postId) {
        queryClient.invalidateQueries({
          queryKey: COMMENT_QUERY_KEYS.comments(postId),
        });

        // Invalidate feed queries to refresh comment counts
        queryClient.invalidateQueries({
          queryKey: ["posts", "feed"],
        });

        // Invalidate specific post query
        queryClient.invalidateQueries({
          queryKey: ["posts", postId],
        });
      }
    },
  });
};

/**
 * Hook to like/unlike a comment
 */
export const useLikeComment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: likeComment,
    onSuccess: (_, commentId, { postId }) => {
      if (postId) {
        queryClient.invalidateQueries({
          queryKey: COMMENT_QUERY_KEYS.comments(postId),
        });
      }
    },
  });
};

/**
 * Main useComment hook for actions
 */
export const useCommentActions = () => {
  const addMutation = useAddComment();
  const updateMutation = useUpdateComment();
  const deleteMutation = useDeleteComment();
  const likeMutation = useLikeComment();

  return {
    addComment: addMutation.mutate,
    isAddingComment: addMutation.isLoading,
    addCommentError: addMutation.error,

    updateComment: updateMutation.mutate,
    isUpdatingComment: updateMutation.isLoading,
    updateCommentError: updateMutation.error,

    deleteComment: deleteMutation.mutate,
    isDeletingComment: deleteMutation.isLoading,
    deleteCommentError: deleteMutation.error,

    likeComment: likeMutation.mutate,
    isLikingComment: likeMutation.isLoading,
    likeCommentError: likeMutation.error,
  };
};

export default useCommentActions;
