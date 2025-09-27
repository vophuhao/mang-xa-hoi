import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useCurrentUser } from "@/hooks/useUser";
import { followUser, getFollowing, unfollowUser } from "@/lib/api";

export const FOLLOW_QUERY_KEYS = {
  following: (username) => ["user", "following", username],
};

/**
 * Hook to get user's following list
 */
export const useFollowing = (username) => {
  return useQuery({
    queryKey: FOLLOW_QUERY_KEYS.following(username),
    queryFn: () => getFollowing(username),
    enabled: !!username,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Hook to follow/unfollow users with optimistic updates
 */
export const useFollowActions = () => {
  const queryClient = useQueryClient();
  const { data: currentUser } = useCurrentUser();

  // Follow user mutation
  const followMutation = useMutation({
    mutationFn: followUser,
    onMutate: async () => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({
        queryKey: ["user"],
      });

      // Snapshot the previous value
      const previousData = queryClient.getQueryData(["user", "current"]);

      // Optimistically update current user's following count
      queryClient.setQueryData(["user", "current"], (old) => {
        if (old?.data) {
          return {
            ...old,
            data: {
              ...old.data,
              followingCount: (old.data.followingCount || 0) + 1,
            },
          };
        }
        return old;
      });

      return { previousData };
    },
    onError: (err, userId, context) => {
      // Rollback on error
      if (context?.previousData) {
        queryClient.setQueryData(["user", "current"], context.previousData);
      }
    },
    onSettled: () => {
      // Always refetch after mutation
      queryClient.invalidateQueries({
        queryKey: ["user"],
      });
    },
  });

  // Unfollow user mutation
  const unfollowMutation = useMutation({
    mutationFn: unfollowUser,
    onMutate: async () => {
      await queryClient.cancelQueries({
        queryKey: ["user"],
      });

      const previousData = queryClient.getQueryData(["user", "current"]);

      queryClient.setQueryData(["user", "current"], (old) => {
        if (old?.data) {
          return {
            ...old,
            data: {
              ...old.data,
              followingCount: Math.max((old.data.followingCount || 1) - 1, 0),
            },
          };
        }
        return old;
      });

      return { previousData };
    },
    onError: (err, userId, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(["user", "current"], context.previousData);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: ["user"],
      });
    },
  });

  // Check if current user is following a specific user
  const isFollowing = (userId) => {
    if (!currentUser?.data?.following || !userId) return false;
    return currentUser.data.following.some(
      (followedUser) => followedUser._id === userId || followedUser === userId
    );
  };

  return {
    followUser: followMutation.mutateAsync,
    unfollowUser: unfollowMutation.mutateAsync,
    isFollowing,
    isFollowingUser: followMutation.isLoading,
    isUnfollowingUser: unfollowMutation.isLoading,
    followError: followMutation.error,
    unfollowError: unfollowMutation.error,
  };
};
