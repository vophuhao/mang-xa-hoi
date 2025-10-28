import { useEffect } from "react";

import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";

import {
  deleteNotification,
  getNotifications,
  getUnreadNotificationCount,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from "@/lib/api";

import useSocket from "./useSocket";

/**
 * Custom hook for managing notifications with real-time updates
 */
export const useNotifications = ({ unreadOnly = false } = {}) => {
  const queryClient = useQueryClient();
  const socket = useSocket();

  // Fetch notifications with infinite scroll
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    error,
    refetch,
  } = useInfiniteQuery({
    queryKey: ["notifications", { unreadOnly }],
    queryFn: ({ pageParam = 1 }) => getNotifications({ page: pageParam, limit: 20, unreadOnly }),
    getNextPageParam: (lastPage) => {
      const { pagination } = lastPage;
      return pagination.hasNext ? pagination.page + 1 : undefined;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 2, // Retry failed requests 2 times
  });

  // Get unread count
  const {
    data: unreadCountData,
    isLoading: isLoadingCount,
    refetch: refetchUnreadCount,
  } = useQuery({
    queryKey: ["notifications", "unreadCount"],
    queryFn: getUnreadNotificationCount,
    refetchInterval: 30000, // Refetch every 30 seconds
    retry: 2,
  });

  // Mark notification as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: markNotificationAsRead,
    onSuccess: (_, notificationId) => {
      // Update cache
      queryClient.setQueryData(["notifications", { unreadOnly: false }], (oldData) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          pages: oldData.pages.map((page) => ({
            ...page,
            data: page.data.map((notif) =>
              notif._id === notificationId ? { ...notif, isRead: true } : notif
            ),
          })),
        };
      });
      refetchUnreadCount();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to mark notification as read");
    },
  });

  // Mark all as read mutation
  const markAllAsReadMutation = useMutation({
    mutationFn: markAllNotificationsAsRead,
    onSuccess: () => {
      // Update cache
      queryClient.setQueryData(["notifications", { unreadOnly: false }], (oldData) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          pages: oldData.pages.map((page) => ({
            ...page,
            data: page.data.map((notif) => ({ ...notif, isRead: true })),
          })),
        };
      });
      refetchUnreadCount();
      //toast.success("All notifications marked as read");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to mark all notifications as read");
    },
  });

  // Delete notification mutation
  const deleteNotificationMutation = useMutation({
    mutationFn: deleteNotification,
    onSuccess: (_, notificationId) => {
      // Remove from cache
      queryClient.setQueryData(["notifications", { unreadOnly: false }], (oldData) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          pages: oldData.pages.map((page) => ({
            ...page,
            data: page.data.filter((notif) => notif._id !== notificationId),
          })),
        };
      });
      refetchUnreadCount();
      //toast.success("Notification deleted");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete notification");
    },
  });

  // Listen to real-time notification events via Socket.IO
  useEffect(() => {
    if (!socket) return;

    // Message notification (when server emits message_notification)
    const handleMessageNotification = (payload) => {
      const notif = payload?.notification || payload;

      // prepend if full object
      if (notif && (notif._id || notif.id)) {
        queryClient.setQueryData(["notifications", { unreadOnly: false }], (oldData) => {
          if (!oldData) return oldData;
          const firstPage = oldData.pages[0];
          if (!firstPage) return oldData;
          const id = notif._id || notif.id;
          if (firstPage.data.some((n) => (n._id || n.id) === id)) return oldData;
          return {
            ...oldData,
            pages: [
              { ...firstPage, data: [notif, ...firstPage.data] },
              ...oldData.pages.slice(1),
            ],
          };
        });
      } else {
        // fallback: refetch
        refetch();
      }

      // optimistically increase unread count
      queryClient.setQueryData(["notifications", "unreadCount"], (old) => {
        const prev = old?.data?.count ?? 0;
        return { data: { count: prev + 1 } };
      });
      refetchUnreadCount();
    };

    // New notification received
    const handleNewNotification = (notification) => {
      // Add to cache
      queryClient.setQueryData(["notifications", { unreadOnly: false }], (oldData) => {
        if (!oldData) return oldData;

        // Add to first page
        const firstPage = oldData.pages[0];
        if (!firstPage) return oldData;

        return {
          ...oldData,
          pages: [
            {
              ...firstPage,
              data: [notification, ...firstPage.data],
            },
            ...oldData.pages.slice(1),
          ],
        };
      });

      refetchUnreadCount();

      // Show toast notification
      toast.info(`${notification.sender?.username || "Someone"} ${notification.message}`, {
        autoClose: 3000,
      });
    };

    // Notification marked as read
    const handleNotificationRead = ({ notificationId }) => {
      queryClient.setQueryData(["notifications", { unreadOnly: false }], (oldData) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          pages: oldData.pages.map((page) => ({
            ...page,
            data: page.data.map((notif) =>
              notif._id === notificationId ? { ...notif, isRead: true } : notif
            ),
          })),
        };
      });
    };

    // All notifications marked as read
    const handleAllNotificationsRead = () => {
      queryClient.setQueryData(["notifications", { unreadOnly: false }], (oldData) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          pages: oldData.pages.map((page) => ({
            ...page,
            data: page.data.map((notif) => ({ ...notif, isRead: true })),
          })),
        };
      });
      refetchUnreadCount();
    };

    // Notification deleted
    const handleNotificationDeleted = ({ notificationId }) => {
      queryClient.setQueryData(["notifications", { unreadOnly: false }], (oldData) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          pages: oldData.pages.map((page) => ({
            ...page,
            data: page.data.filter((notif) => notif._id !== notificationId),
          })),
        };
      });
    };

    // Unread count update
    const handleUnreadCountUpdate = ({ count }) => {
      queryClient.setQueryData(["notifications", "unreadCount"], { count });
    };

    socket.on("message_notification", handleMessageNotification);
    socket.on("new_notification", handleNewNotification);
    socket.on("notification_read", handleNotificationRead);
    socket.on("all_notifications_read", handleAllNotificationsRead);
    socket.on("notification_deleted", handleNotificationDeleted);
    socket.on("unread_count_update", handleUnreadCountUpdate);

    return () => {
      socket.off("message_notification", handleMessageNotification);
      socket.off("new_notification", handleNewNotification);
      socket.off("notification_read", handleNotificationRead);
      socket.off("all_notifications_read", handleAllNotificationsRead);
      socket.off("notification_deleted", handleNotificationDeleted);
      socket.off("unread_count_update", handleUnreadCountUpdate);
    };
  }, [socket, queryClient, refetchUnreadCount]);

  // Flatten pages into single array
  const notifications = data?.pages?.flatMap((page) => page.data) || [];

  return {
    notifications,
    unreadCount: unreadCountData?.data?.count || 0,
    isLoading,
    isLoadingCount,
    isError,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
    markAsRead: markAsReadMutation.mutate,
    markAllAsRead: markAllAsReadMutation.mutate,
    deleteNotification: deleteNotificationMutation.mutate,
    isMarkingAsRead: markAsReadMutation.isPending,
    isMarkingAllAsRead: markAllAsReadMutation.isPending,
    isDeletingNotification: deleteNotificationMutation.isPending,
  };
};

export default useNotifications;
