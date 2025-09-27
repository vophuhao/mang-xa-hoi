import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

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
  commentsInfinite: (postId) => ["comments", "post", postId, "infinite"],
  replies: (commentId) => ["comments", "replies", commentId],
  repliesInfinite: (commentId) => ["comments", "replies", commentId, "infinite"],
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
 * Hook to get comments with infinite loading
 */
export const useInfiniteComments = (postId, limit = 10) => {
  return useInfiniteQuery({
    queryKey: COMMENT_QUERY_KEYS.commentsInfinite(postId),
    queryFn: ({ pageParam = 1 }) => getComments(postId, { page: pageParam, limit }),
    enabled: !!postId,
    getNextPageParam: (lastPage) => {
      console.log("getNextPageParam - lastPage:", lastPage);
      // lastPage has structure: { success: true, data: [...], pagination: {...} }
      const pagination = lastPage?.pagination;
      console.log("getNextPageParam - pagination:", pagination);
      console.log("getNextPageParam - hasNext:", pagination?.hasNext);
      console.log(
        "getNextPageParam - nextPage:",
        pagination?.hasNext ? pagination.page + 1 : undefined
      );
      return pagination?.hasNext ? pagination.page + 1 : undefined;
    },
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
 * Hook to get replies with infinite loading
 */
export const useInfiniteCommentReplies = (commentId, limit = 5) => {
  return useInfiniteQuery({
    queryKey: COMMENT_QUERY_KEYS.repliesInfinite(commentId),
    queryFn: ({ pageParam = 1 }) => getCommentReplies(commentId, { page: pageParam, limit }),
    enabled: !!commentId,
    getNextPageParam: (lastPage) => {
      const pagination = lastPage?.pagination;
      return pagination?.hasNext ? pagination.page + 1 : undefined;
    },
    staleTime: 1 * 60 * 1000, // 1 minute
  });
};

/**
 * Hook to add a new comment
 */
export const useAddComment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ postId, content, parentId }) => addComment(postId, { content, parentId }),
    onSuccess: (_, { postId, parentId }) => {
      // Invalidate comments for the post
      queryClient.invalidateQueries({
        queryKey: COMMENT_QUERY_KEYS.comments(postId),
      });

      // Invalidate infinite comments
      queryClient.invalidateQueries({
        queryKey: COMMENT_QUERY_KEYS.commentsInfinite(postId),
      });

      // If it's a reply, also invalidate the parent comment's replies
      if (parentId) {
        queryClient.invalidateQueries({
          queryKey: COMMENT_QUERY_KEYS.replies(parentId),
        });
        queryClient.invalidateQueries({
          queryKey: COMMENT_QUERY_KEYS.repliesInfinite(parentId),
        });

        // Force a refetch of parent comments to update replyCount immediately
        queryClient.refetchQueries({
          queryKey: COMMENT_QUERY_KEYS.commentsInfinite(postId),
        });
      }

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
    mutationFn: ({ commentId }) => deleteComment(commentId),
    onMutate: async ({ commentId, postId, parentId }) => {
      // Cancel any outgoing refetches for all related queries
      await queryClient.cancelQueries({ queryKey: COMMENT_QUERY_KEYS.comments(postId) });
      await queryClient.cancelQueries({ queryKey: COMMENT_QUERY_KEYS.commentsInfinite(postId) });

      // Also cancel replies queries if this is a reply
      if (parentId) {
        await queryClient.cancelQueries({ queryKey: COMMENT_QUERY_KEYS.repliesInfinite(parentId) });
      }

      // Snapshot the previous values
      const previousComments = queryClient.getQueryData(COMMENT_QUERY_KEYS.comments(postId));
      const previousInfiniteComments = queryClient.getQueryData(
        COMMENT_QUERY_KEYS.commentsInfinite(postId)
      );
      const previousReplies = parentId
        ? queryClient.getQueryData(COMMENT_QUERY_KEYS.repliesInfinite(parentId))
        : null;

      // Optimistically remove from regular comments
      if (previousComments?.data) {
        queryClient.setQueryData(COMMENT_QUERY_KEYS.comments(postId), {
          ...previousComments,
          data: previousComments.data.filter((comment) => comment._id !== commentId),
        });
      }

      // Optimistically remove from infinite comments
      if (previousInfiniteComments?.pages) {
        queryClient.setQueryData(COMMENT_QUERY_KEYS.commentsInfinite(postId), {
          ...previousInfiniteComments,
          pages: previousInfiniteComments.pages.map((page) => ({
            ...page,
            data: page.data?.filter((comment) => comment._id !== commentId) || [],
          })),
        });
      }

      // Optimistically remove from replies if this is a reply comment
      if (parentId && previousReplies?.pages) {
        queryClient.setQueryData(COMMENT_QUERY_KEYS.repliesInfinite(parentId), {
          ...previousReplies,
          pages: previousReplies.pages.map((page) => ({
            ...page,
            data: page.data?.filter((reply) => reply._id !== commentId) || [],
          })),
        });
      }

      // Return a context object with the snapshotted values
      return { previousComments, previousInfiniteComments, previousReplies, parentId };
    },
    onError: (err, variables, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      const { postId } = variables;
      const { parentId } = context || {};

      if (context?.previousComments) {
        queryClient.setQueryData(COMMENT_QUERY_KEYS.comments(postId), context.previousComments);
      }
      if (context?.previousInfiniteComments) {
        queryClient.setQueryData(
          COMMENT_QUERY_KEYS.commentsInfinite(postId),
          context.previousInfiniteComments
        );
      }
      if (context?.previousReplies && parentId) {
        queryClient.setQueryData(
          COMMENT_QUERY_KEYS.repliesInfinite(parentId),
          context.previousReplies
        );
      }
    },
    onSuccess: (data, variables) => {
      // variables contains { commentId, postId, parentId }
      const { postId, parentId } = variables;

      if (postId) {
        queryClient.invalidateQueries({
          queryKey: COMMENT_QUERY_KEYS.comments(postId),
        });

        // Invalidate infinite comments
        queryClient.invalidateQueries({
          queryKey: COMMENT_QUERY_KEYS.commentsInfinite(postId),
        });

        // If it's a reply, also invalidate parent comment's replies and force refresh parent to update replyCount
        if (parentId) {
          queryClient.invalidateQueries({
            queryKey: COMMENT_QUERY_KEYS.repliesInfinite(parentId),
          });
          // Force refetch main comments to update replyCount
          queryClient.refetchQueries({
            queryKey: COMMENT_QUERY_KEYS.commentsInfinite(postId),
          });
        }

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
    mutationFn: ({ commentId }) => likeComment(commentId),
    onMutate: async ({ commentId, postId, parentId }) => {
      // Cancel any outgoing refetches for both queries
      await queryClient.cancelQueries({ queryKey: COMMENT_QUERY_KEYS.comments(postId) });
      await queryClient.cancelQueries({ queryKey: COMMENT_QUERY_KEYS.commentsInfinite(postId) });

      // Also cancel replies queries if this is a reply comment
      if (parentId) {
        await queryClient.cancelQueries({ queryKey: COMMENT_QUERY_KEYS.repliesInfinite(parentId) });
      }

      // Snapshot the previous values
      const previousComments = queryClient.getQueryData(COMMENT_QUERY_KEYS.comments(postId));
      const previousInfiniteComments = queryClient.getQueryData(
        COMMENT_QUERY_KEYS.commentsInfinite(postId)
      );
      const previousReplies = parentId
        ? queryClient.getQueryData(COMMENT_QUERY_KEYS.repliesInfinite(parentId))
        : null;

      // Optimistically update regular comments
      if (previousComments?.data) {
        queryClient.setQueryData(COMMENT_QUERY_KEYS.comments(postId), {
          ...previousComments,
          data: previousComments.data.map((comment) =>
            comment._id === commentId
              ? {
                  ...comment,
                  isLiked: !comment.isLiked,
                  likeCount: comment.isLiked ? comment.likeCount - 1 : comment.likeCount + 1,
                }
              : comment
          ),
        });
      }

      // Optimistically update infinite comments
      if (previousInfiniteComments?.pages) {
        const updateComment = (comment) =>
          comment._id === commentId
            ? {
                ...comment,
                isLiked: !comment.isLiked,
                likeCount: comment.isLiked ? comment.likeCount - 1 : comment.likeCount + 1,
              }
            : comment;

        queryClient.setQueryData(COMMENT_QUERY_KEYS.commentsInfinite(postId), {
          ...previousInfiniteComments,
          pages: previousInfiniteComments.pages.map((page) => ({
            ...page,
            data: page.data.map(updateComment),
          })),
        });
      }

      // Optimistically update replies if this is a reply comment
      if (parentId && previousReplies?.pages) {
        const updateReply = (reply) =>
          reply._id === commentId
            ? {
                ...reply,
                isLiked: !reply.isLiked,
                likeCount: reply.isLiked ? reply.likeCount - 1 : reply.likeCount + 1,
              }
            : reply;

        queryClient.setQueryData(COMMENT_QUERY_KEYS.repliesInfinite(parentId), {
          ...previousReplies,
          pages: previousReplies.pages.map((page) => ({
            ...page,
            data: page.data.map(updateReply),
          })),
        });
      }

      // Return context with snapshotted values
      return { previousComments, previousInfiniteComments, previousReplies, postId, parentId };
    },
    onError: (err, { postId, parentId }, context) => {
      // If the mutation fails, use the context to roll back all queries
      if (context?.previousComments) {
        queryClient.setQueryData(COMMENT_QUERY_KEYS.comments(postId), context.previousComments);
      }
      if (context?.previousInfiniteComments) {
        queryClient.setQueryData(
          COMMENT_QUERY_KEYS.commentsInfinite(postId),
          context.previousInfiniteComments
        );
      }
      if (context?.previousReplies && parentId) {
        queryClient.setQueryData(
          COMMENT_QUERY_KEYS.repliesInfinite(parentId),
          context.previousReplies
        );
      }
    },
    onSettled: (data, error, { postId, parentId }) => {
      // Always refetch after error or success to ensure we have the latest data
      queryClient.invalidateQueries({ queryKey: COMMENT_QUERY_KEYS.comments(postId) });
      queryClient.invalidateQueries({ queryKey: COMMENT_QUERY_KEYS.commentsInfinite(postId) });

      // Also invalidate replies if this is a reply comment
      if (parentId) {
        queryClient.invalidateQueries({ queryKey: COMMENT_QUERY_KEYS.repliesInfinite(parentId) });
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
    isAddingComment: addMutation.isPending || addMutation.isLoading,
    addCommentError: addMutation.error,

    updateComment: updateMutation.mutate,
    isUpdatingComment: updateMutation.isPending || updateMutation.isLoading,
    updateCommentError: updateMutation.error,

    deleteComment: deleteMutation.mutate,
    isDeletingComment: deleteMutation.isPending || deleteMutation.isLoading,
    deleteCommentError: deleteMutation.error,

    likeComment: likeMutation.mutate,
    isLikingComment: likeMutation.isPending || likeMutation.isLoading,
    likeCommentError: likeMutation.error,
  };
};

export default useCommentActions;
