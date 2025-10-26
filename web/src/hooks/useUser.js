import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  followUser,
  getFollowers,
  getFollowing,
  getSuggestedUsers,
  getUser,
  getUserByUsername,
  getUserPosts,
  searchUsers,
  unfollowUser,
  updateProfile,
} from "@/lib/api";

// Query keys for caching
export const USER_QUERY_KEYS = {
  currentUser: ["user", "current"],
  suggestedUsers: ["user", "suggestions"],
  userProfile: (username) => ["user", "profile", username],
  userFollowers: (username, page) => ["user", "followers", username, page],
  userFollowing: (username, page) => ["user", "following", username, page],
  userPosts: (username, page) => ["user", "posts", username, page],
  searchUsers: (query, page) => ["user", "search", query, page],
};

/**
 * Hook to get current user data
 */
export const useCurrentUser = () => {
  return useQuery({
    queryKey: USER_QUERY_KEYS.currentUser,
    queryFn: getUser,
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
  });
};

/**
 * Hook to get suggested users
 */
export const useSuggestedUsers = () => {
  return useQuery({
    queryKey: USER_QUERY_KEYS.suggestedUsers,
    queryFn: getSuggestedUsers,
    staleTime: 10 * 60 * 1000, // 10 minutes
    cacheTime: 15 * 60 * 1000, // 15 minutes
  });
};

/**
 * Hook to get user profile by username
 */
export const useUserProfile = (username) => {
  return useQuery({
    queryKey: USER_QUERY_KEYS.userProfile(username),
    queryFn: () => getUserByUsername(username),
    enabled: !!username,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Hook to get user's followers
 */
export const useUserFollowers = (username, page = 1) => {
  return useQuery({
    queryKey: USER_QUERY_KEYS.userFollowers(username, page),
    queryFn: () => getFollowers(username, page),
    enabled: !!username,
    keepPreviousData: true,
  });
};

/**
 * Hook to get user's following
 */
export const useUserFollowing = (username, page = 1) => {
  return useQuery({
    queryKey: USER_QUERY_KEYS.userFollowing(username, page),
    queryFn: () => getFollowing(username, page),
    enabled: !!username,
    keepPreviousData: true,
  });
};

/**
 * Hook to get user's posts with infinite scroll
 */
export const useUserPosts = (username) => {
  return useInfiniteQuery({
    queryKey: ["user", "posts", username],
    queryFn: ({ pageParam = 1 }) => getUserPosts(username, pageParam, 12),
    getNextPageParam: (lastPage, pages) => {
      if (!lastPage?.data?.length || lastPage.data.length < 12) {
        return undefined;
      }
      return pages.length + 1;
    },
    enabled: !!username,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Hook to search users
 */
export const useSearchUsers = (query, page = 1) => {
  return useQuery({
    queryKey: USER_QUERY_KEYS.searchUsers(query, page),
    queryFn: () => searchUsers(query, page),
    enabled: !!query && query.trim().length > 0,
    keepPreviousData: true,
    staleTime: 30 * 1000, // 30 seconds for search results
  });
};

/**
 * Hook to update user profile
 */
export const useUpdateProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateProfile,
    onSuccess: (data) => {
      // Update current user cache
      queryClient.setQueryData(USER_QUERY_KEYS.currentUser, data);

      // Invalidate user profile cache if username was updated
      if (data?.username) {
        queryClient.invalidateQueries({
          queryKey: ["user", "profile"],
        });
      }
    },
  });
};

/**
 * Hook to follow a user
 */
export const useFollowUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: followUser,
    onSuccess: () => {
      // Invalidate relevant caches
      // queryClient.invalidateQueries({
      //   queryKey: ["user", "suggestions"],
      // });
      queryClient.invalidateQueries({
        queryKey: ["user", "profile"],
      });
      queryClient.invalidateQueries({
        queryKey: ["user", "followers"],
      });
      queryClient.invalidateQueries({
        queryKey: ["user", "following"],
      });
      // Invalidate ExplorePeople query
      queryClient.invalidateQueries({
        queryKey: ["suggested-users-explore"],
      });
    },
  });
};

/**
 * Hook to unfollow a user
 */
export const useUnfollowUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: unfollowUser,
    onSuccess: () => {
      // Invalidate relevant caches
      // queryClient.invalidateQueries({
      //   queryKey: ["user", "suggestions"],
      // });
      queryClient.invalidateQueries({
        queryKey: ["user", "profile"],
      });
      queryClient.invalidateQueries({
        queryKey: ["user", "followers"],
      });
      queryClient.invalidateQueries({
        queryKey: ["user", "following"],
      });
      // Invalidate ExplorePeople query
      queryClient.invalidateQueries({
        queryKey: ["suggested-users-explore"],
      });
    },
  });
};

/**
 * Combined hook for follow/unfollow actions
 */
export const useFollowActions = () => {
  const followMutation = useFollowUser();
  const unfollowMutation = useUnfollowUser();

  const toggleFollow = (userId, isCurrentlyFollowing) => {
    if (isCurrentlyFollowing) {
      return unfollowMutation.mutate(userId);
    } else {
      return followMutation.mutate(userId);
    }
  };

  return {
    toggleFollow,
    isLoading: followMutation.isLoading || unfollowMutation.isLoading,
    error: followMutation.error || unfollowMutation.error,
  };
};

/**
 * Main useUser hook that provides common user operations
 */
export const useUser = () => {
  const currentUser = useCurrentUser();
  const suggestedUsers = useSuggestedUsers();
  const updateProfileMutation = useUpdateProfile();
  const followActions = useFollowActions();

  return {
    // Current user data
    currentUser: currentUser.data?.data,
    isLoadingCurrentUser: currentUser.isLoading,
    currentUserError: currentUser.error,
    refetchCurrentUser: currentUser.refetch,

    // Suggested users
    suggestedUsers: suggestedUsers.data?.data,
    isLoadingSuggestions: suggestedUsers.isLoading,
    suggestionsError: suggestedUsers.error,
    refetchSuggestions: suggestedUsers.refetch,

    // Profile update
    updateProfile: updateProfileMutation.mutate,
    isUpdatingProfile: updateProfileMutation.isLoading,
    updateProfileError: updateProfileMutation.error,

    // Follow actions
    toggleFollow: followActions.toggleFollow,
    isFollowActionLoading: followActions.isLoading,
    followActionError: followActions.error,
  };
};

export default useUser;
