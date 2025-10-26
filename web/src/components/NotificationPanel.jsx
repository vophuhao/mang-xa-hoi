import { useEffect, useRef } from "react";

import PropTypes from "prop-types";

import useNotifications from "@/hooks/useNotifications";

import NotificationItem from "./notifications/NotificationItem";

/**
 * Notification panel component (Instagram style)
 */
const NotificationPanel = ({ onClose }) => {
  const {
    notifications,
    isLoading,
    isError,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    isMarkingAllAsRead,
    refetch,
  } = useNotifications();

  const observerTarget = useRef(null);

  // Infinite scroll observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 0.5 }
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  // Loading state
  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-gray-900 dark:border-gray-100"></div>
      </div>
    );
  }

  // Error state
  if (isError) {
    return (
      <div className="flex h-64 flex-col items-center justify-center text-gray-500 dark:text-gray-400">
        <svg className="mb-4 h-16 w-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <p className="text-sm">{error?.message || "Failed to load notifications"}</p>
      </div>
    );
  }

  // Empty state
  if (notifications.length === 0) {
    return (
      <div className="flex h-64 flex-col items-center justify-center text-gray-500 dark:text-gray-400">
        <svg className="mb-4 h-16 w-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
        <p className="text-sm font-semibold">Chưa có thông báo nào</p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col bg-white dark:bg-gray-900">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3 dark:border-gray-700">
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Thông báo</h2>
        {notifications.some((n) => !n.isRead) && (
          <button
            onClick={() => markAllAsRead()}
            disabled={isMarkingAllAsRead}
            className="text-sm font-semibold text-blue-500 hover:text-blue-700 disabled:opacity-50 dark:text-blue-400 dark:hover:text-blue-300"
          >
            {isMarkingAllAsRead ? "Đang đánh dấu..." : "Đánh dấu tất cả là đã đọc"}
          </button>
        )}
      </div>

      {/* Notifications list */}
      <div className="scrollbar-hide flex-1 overflow-y-auto">
        {notifications.map((notification) => (
          <div key={notification._id} className="group">
            <NotificationItem
              notification={notification}
              onMarkAsRead={markAsRead}
              onDelete={deleteNotification}
              onPanelClose={onClose}
              onRefetchNotifications={refetch}
            />
          </div>
        ))}

        {/* Loading more indicator */}
        {isFetchingNextPage && (
          <div className="flex items-center justify-center py-4">
            <div className="h-6 w-6 animate-spin rounded-full border-b-2 border-gray-900 dark:border-gray-100"></div>
          </div>
        )}

        {/* Intersection observer target */}
        {hasNextPage && <div ref={observerTarget} className="h-4" />}

        {/* End of list indicator */}
        {!hasNextPage && notifications.length > 0 && (
          <div className="py-4 text-center text-sm text-gray-500 dark:text-gray-400">
            Bạn đã xem hết tất cả thông báo
          </div>
        )}
      </div>
    </div>
  );
};

NotificationPanel.propTypes = {
  onClose: PropTypes.func,
};

export default NotificationPanel;
