import { useEffect, useState } from "react";

import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import PropTypes from "prop-types";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

import PostModal from "@/components/feed/PostModal";
import { useFollowUser, useUnfollowUser } from "@/hooks/useUser";
import { getPostById } from "@/lib/api";

/**
 * Single notification item component (Instagram style)
 */
const NotificationItem = ({
  notification,
  onMarkAsRead,
  onDelete,
  onPanelClose,
  onRefetchNotifications,
}) => {
  const navigate = useNavigate();
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [isLoadingPost, setIsLoadingPost] = useState(false);

  // Initialize isFollowing from notification data
  const [isFollowing, setIsFollowing] = useState(notification.sender?.isFollowing || false);

  const followMutation = useFollowUser();
  const unfollowMutation = useUnfollowUser();

  // Sync isFollowing state when notification data changes (e.g., after refetch)
  useEffect(() => {
    setIsFollowing(notification.sender?.isFollowing || false);
  }, [notification.sender?.isFollowing]);

  const handleNotificationClick = async () => {
    // Mark as read if unread
    if (!notification.isRead) {
      onMarkAsRead(notification._id);
    }

    // Navigate based on notification type
    switch (notification.type) {
      case "like":
      case "comment":
      case "reply":
      case "mention":
        if (notification.post) {
          const postId = notification.post._id || notification.post;
          // Fetch full post data and open modal
          setIsLoadingPost(true);
          try {
            const response = await getPostById(postId);
            setSelectedPost(response.data);
            setIsPostModalOpen(true);
          } catch (error) {
            console.error("Failed to load post:", error);
            // Fallback to navigation if modal fails
            navigate(`/${notification.sender.userId}/p/${postId}`);
          } finally {
            setIsLoadingPost(false);
          }
        }
        break;
      case "message":
        // Navigate to message page with sender and close panel
        navigate(`/message?userId=${notification.sender.userId}`);
        if (onPanelClose) {
          onPanelClose();
        }
        break;
      case "follow":
        navigate(`/${notification.sender.userId}`);
        break;
      case "story_view":
        // Navigate to stories if needed
        break;
      default:
        break;
    }
  };

  const handleClosePostModal = () => {
    setIsPostModalOpen(false);
    setSelectedPost(null);
  };

  const getNotificationText = () => {
    const username = notification.sender?.username || "Someone";
    switch (notification.type) {
      case "like":
        return (
          <>
            <span className="font-semibold">{username}</span> {notification.message}
          </>
        );
      case "comment":
      case "reply":
        return (
          <>
            <span className="font-semibold">{username}</span> {notification.message}
          </>
        );
      case "follow":
        return (
          <>
            <span className="font-semibold">{username}</span> {notification.message}
          </>
        );
      case "mention":
        return (
          <>
            <span className="font-semibold">{username}</span> {notification.message}
          </>
        );
      default:
        return (
          <>
            <span className="font-semibold">{username}</span> {notification.message}
          </>
        );
    }
  };

  const getTimeAgo = () => {
    try {
      return formatDistanceToNow(new Date(notification.createdAt), {
        addSuffix: true,
        locale: vi,
      });
    } catch {
      return "";
    }
  };

  return (
    <>
      <div
        className={`flex cursor-pointer items-center gap-3 px-4 py-3 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800 ${!notification.isRead ? "bg-blue-50 dark:bg-blue-900/20" : ""
          }`}
        onClick={handleNotificationClick}
      >
        {/* Avatar */}
        <div className="flex-shrink-0">
          <img
            src={notification.sender?.avatarUrl || "/default-avatar.png"}
            alt={notification.sender?.username}
            className="h-11 w-11 rounded-full object-cover"
          />
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1">
          <p className="line-clamp-2 text-sm text-gray-900 dark:text-gray-100">
            {getNotificationText()}
          </p>
          <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{getTimeAgo()}</p>
        </div>

        {/* Post thumbnail if available */}
        {notification.post?.mediaUrls?.[0] && (
          <div className="flex-shrink-0">
            {notification.post.mediaUrls[0].endsWith(".mp4") ? (
              <video
                src={notification.post.mediaUrls[0]}
                className="h-11 w-11 rounded object-cover"
              />
            ) : (
              <img
                src={notification.post.mediaUrls[0]}
                alt={notification.post.mediaUrls[0]}
                className="h-11 w-11 rounded object-cove"
              />
            )}

          
          </div>
        )}

        {/* Follow button for follow notifications */}
        {notification.type === "follow" && (
          <button
            onClick={async (e) => {
              e.stopPropagation();
              try {
                if (isFollowing) {
                  await unfollowMutation.mutateAsync(notification.sender._id);
                  setIsFollowing(false);
                  //toast.success(`Đã bỏ theo dõi ${notification.sender.username}`);
                } else {
                  await followMutation.mutateAsync(notification.sender._id);
                  setIsFollowing(true);
                  //toast.success(`Đã theo dõi ${notification.sender.username}`);
                }
                // Refetch notifications to update isFollowing status from server
                if (onRefetchNotifications) {
                  onRefetchNotifications();
                }
              } catch (error) {
                toast.error(error.response?.data?.message || "Có lỗi xảy ra");
              }
            }}
            disabled={followMutation.isPending || unfollowMutation.isPending}
            className={`flex-shrink-0 rounded-lg px-4 py-1.5 text-sm font-semibold transition-colors disabled:opacity-50 ${isFollowing
                ? "border border-gray-300 bg-white text-gray-900 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700"
                : "bg-blue-500 text-white hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700"
              }`}
          >
            {followMutation.isPending || unfollowMutation.isPending
              ? "..."
              : isFollowing
                ? "Đang theo dõi"
                : "Theo dõi lại"}
          </button>
        )}

        {/* Unread indicator */}
        {!notification.isRead && (
          <div className="flex-shrink-0">
            <div className="h-2 w-2 rounded-full bg-blue-500 dark:bg-blue-400"></div>
          </div>
        )}

        {/* Delete button (hidden by default, shown on hover) */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(notification._id);
          }}
          className="flex-shrink-0 rounded p-1 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-gray-200 dark:hover:bg-gray-700"
          aria-label="Delete notification"
        >
          <svg
            className="h-4 w-4 text-gray-600 dark:text-gray-400"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      </div>

      {/* Post Modal */}
      {isPostModalOpen && selectedPost && (
        <PostModal post={selectedPost} isOpen={isPostModalOpen} onClose={handleClosePostModal} />
      )}

      {/* Loading indicator for post */}
      {isLoadingPost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-white"></div>
        </div>
      )}
    </>
  );
};

NotificationItem.propTypes = {
  notification: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    sender: PropTypes.shape({
      username: PropTypes.string,
      userId: PropTypes.string,
      avatarUrl: PropTypes.string,
    }),
    type: PropTypes.string.isRequired,
    message: PropTypes.string.isRequired,
    post: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.shape({
        _id: PropTypes.string,
        mediaUrls: PropTypes.arrayOf(PropTypes.string),
      }),
    ]),
    isRead: PropTypes.bool,
    createdAt: PropTypes.string.isRequired,
  }).isRequired,
  onMarkAsRead: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  onPanelClose: PropTypes.func,
  onRefetchNotifications: PropTypes.func,
};

export default NotificationItem;
