import { useCallback } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";

import API from "@/config/apiClient";

// Story API calls
const storyAPI = {
  // Get stories from followed users
  getStories: () => API.get("/stories"),

  // Get user's own stories
  getUserStories: () => API.get("/stories/me"),

  // Get all user's stories (including expired) for highlights
  getAllUserStories: () => API.get("/stories/me/all"),

  // Get stories by username
  getStoriesByUsername: (username) => API.get(`/stories/user/${username}`),

  // Create new story
  createStory: (storyData) => API.post("/stories", storyData),

  // View a story
  viewStory: (storyId) => API.post(`/stories/${storyId}/view`),

  // Like/Unlike a story
  likeStory: (storyId) => API.post(`/stories/${storyId}/like`),

  // Get story likes
  getStoryLikes: (storyId, page = 1) => API.get(`/stories/${storyId}/likes?page=${page}`),

  // Delete story
  deleteStory: (storyId) => API.delete(`/stories/${storyId}`),

  // Get story viewers
  getStoryViewers: (storyId) => API.get(`/stories/${storyId}/viewers`),

  // Get story analytics
  getStoryAnalytics: (storyId) => API.get(`/stories/${storyId}/analytics`),

  // Highlights
  createHighlight: (highlightData) => API.post("/stories/highlights", highlightData),
  getHighlights: (username) => API.get(`/stories/highlights/${username}`),
  deleteHighlight: (highlightTitle) => API.delete(`/stories/highlights/${highlightTitle}`),
  removeFromHighlight: (storyId) => API.delete(`/stories/${storyId}/highlight`),
};

// Hook to get stories from followed users
export const useStories = () => {
  return useQuery({
    queryKey: ["stories"],
    queryFn: () => storyAPI.getStories(),
    select: (data) => data.data,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 30 * 1000, // Refresh every 30 seconds for real-time updates
  });
};

// Hook to get user's own stories
export const useUserStories = () => {
  return useQuery({
    queryKey: ["stories", "me"],
    queryFn: () => storyAPI.getUserStories(),
    select: (data) => data.data,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

// Hook to get all user's stories (including expired) for highlights
export const useAllUserStories = () => {
  return useQuery({
    queryKey: ["stories", "me", "all"],
    queryFn: () => storyAPI.getAllUserStories(),
    select: (data) => data.data,
    staleTime: 5 * 60 * 1000, // 5 minutes - longer cache since expired stories don't change
  });
};

// Hook to get stories by username
export const useStoriesByUsername = (username) => {
  return useQuery({
    queryKey: ["stories", "user", username],
    queryFn: () => storyAPI.getStoriesByUsername(username),
    select: (data) => data.data,
    enabled: !!username,
    staleTime: 2 * 60 * 1000,
  });
};

// Hook to create story
export const useCreateStory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: storyAPI.createStory,
    onSuccess: () => {
      // Invalidate and refetch stories
      queryClient.invalidateQueries({ queryKey: ["stories"] });
      queryClient.invalidateQueries({ queryKey: ["stories", "me"] });

      toast.success("Story đã được tạo thành công!");
    },
    onError: (error) => {
      const message = error.response?.data?.message || "Không thể tạo story";
      toast.error(message);
    },
  });
};

// Hook to view story
export const useViewStory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: storyAPI.viewStory,
    onSuccess: (data, storyId) => {
      // Update view count in cache
      queryClient.setQueryData(["stories"], (oldData) => {
        if (!oldData?.data) return oldData;

        return {
          ...oldData,
          data: oldData.data.map((userStories) => ({
            ...userStories,
            stories: userStories.stories.map((story) =>
              story._id === storyId ? { ...story, viewCount: data.data.viewCount } : story
            ),
          })),
        };
      });

      // Also update individual user stories
      queryClient.invalidateQueries({ queryKey: ["stories", "viewers", storyId] });
    },
    onError: (error) => {
      const message = error.response?.data?.message || "Không thể xem story";
      console.error("View story error:", message);
    },
  });
};

// Hook to like/unlike story with optimistic updates
export const useLikeStory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: storyAPI.likeStory,
    // Optimistic update - update UI immediately
    onMutate: async (storyId) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["stories"] });

      // Snapshot the previous value
      const previousStories = queryClient.getQueryData(["stories"]);

      // Optimistically update to the new value
      queryClient.setQueryData(["stories"], (oldData) => {
        if (!oldData?.data) return oldData;

        return {
          ...oldData,
          data: oldData.data.map((userStories) => ({
            ...userStories,
            stories: userStories.stories.map((story) => {
              if (story._id === storyId) {
                const newIsLiked = !story.isLiked;
                return {
                  ...story,
                  isLiked: newIsLiked,
                  likeCount: newIsLiked
                    ? (story.likeCount || 0) + 1
                    : Math.max((story.likeCount || 0) - 1, 0),
                };
              }
              return story;
            }),
          })),
        };
      });

      // Return a context object with the snapshotted value
      return { previousStories };
    },
    // If the mutation fails, use the context returned from onMutate to roll back
    onError: (error, storyId, context) => {
      // Revert to previous state
      if (context?.previousStories) {
        queryClient.setQueryData(["stories"], context.previousStories);
      }

      const message = error.response?.data?.message || "Không thể thích story";
      toast.error(message);
    },
    // Always refetch after error or success
    onSettled: () => {
      // Sync with server data
      queryClient.invalidateQueries({ queryKey: ["stories"] });
    },
  });
};

// Hook to get story likes
export const useStoryLikes = (storyId, enabled = false) => {
  return useQuery({
    queryKey: ["stories", "likes", storyId],
    queryFn: () => storyAPI.getStoryLikes(storyId),
    select: (data) => data.data,
    enabled: !!storyId && enabled,
    staleTime: 2 * 60 * 1000,
  });
};

// Hook to delete story
export const useDeleteStory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: storyAPI.deleteStory,
    onSuccess: () => {
      // Invalidate all story queries
      queryClient.invalidateQueries({ queryKey: ["stories"] });
      toast.success("Story đã được xóa thành công!");
    },
    onError: (error) => {
      const message = error.response?.data?.message || "Không thể xóa story";
      toast.error(message);
    },
  });
};

// Hook to get story viewers
export const useStoryViewers = (storyId) => {
  return useQuery({
    queryKey: ["stories", "viewers", storyId],
    queryFn: () => storyAPI.getStoryViewers(storyId),
    select: (data) => data.data,
    enabled: !!storyId,
    staleTime: 30 * 1000, // 30 seconds
  });
};

// Hook to get story analytics
export const useStoryAnalytics = (storyId) => {
  return useQuery({
    queryKey: ["stories", "analytics", storyId],
    queryFn: () => storyAPI.getStoryAnalytics(storyId),
    select: (data) => data.data,
    enabled: !!storyId,
    staleTime: 60 * 1000, // 1 minute
  });
};

// Custom hook for story actions with better UX
export const useStoryActions = () => {
  const createStoryMutation = useCreateStory();
  const viewStoryMutation = useViewStory();
  const deleteStoryMutation = useDeleteStory();

  const createStory = useCallback(
    async (storyData) => {
      return await createStoryMutation.mutateAsync(storyData);
    },
    [createStoryMutation]
  );

  const viewStory = useCallback(
    async (storyId) => {
      try {
        await viewStoryMutation.mutateAsync(storyId);
      } catch (error) {
        // Silent error for view story as it's not critical
        console.error("Failed to mark story as viewed:", error);
      }
    },
    [viewStoryMutation]
  );

  const deleteStory = useCallback(
    async (storyId) => {
      return await deleteStoryMutation.mutateAsync(storyId);
    },
    [deleteStoryMutation]
  );

  return {
    createStory,
    viewStory,
    deleteStory,
    isCreating: createStoryMutation.isPending,
    isViewing: viewStoryMutation.isPending,
    isDeleting: deleteStoryMutation.isPending,
  };
};

// Hook to get highlights by username
export const useHighlights = (username) => {
  return useQuery({
    queryKey: ["highlights", username],
    queryFn: () => storyAPI.getHighlights(username),
    select: (data) => data.data,
    enabled: !!username,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Hook to create highlight
export const useCreateHighlight = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: storyAPI.createHighlight,
    onSuccess: () => {
      // Invalidate highlights for current user
      queryClient.invalidateQueries({ queryKey: ["highlights"] });
      queryClient.invalidateQueries({ queryKey: ["stories", "me"] });

      toast.success("Nổi bật đã được tạo thành công!");
    },
    onError: (error) => {
      const message = error.response?.data?.message || "Không thể tạo nổi bật";
      toast.error(message);
    },
  });
};

// Hook to delete highlight
export const useDeleteHighlight = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: storyAPI.deleteHighlight,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["highlights"] });
      toast.success("Nổi bật đã được xóa thành công!");
    },
    onError: (error) => {
      const message = error.response?.data?.message || "Không thể xóa nổi bật";
      toast.error(message);
    },
  });
};
