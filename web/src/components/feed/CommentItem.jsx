import { useState } from "react";

import { Heart, MoreHorizontal } from "lucide-react";

import OptionsModal from "@/components/common/OptionsModal";

const CommentItem = ({
  comment,
  onLike,
  onReply,
  onDelete,
  onReport,
  currentUserId,
  isCaption = false,
  onUsernameClick,
}) => {
  const [isLiked, setIsLiked] = useState(comment?.isLiked || false);
  const [likeCount, setLikeCount] = useState(comment?.likeCount || 0);
  const [showModal, setShowModal] = useState(false);

  const isOwner = comment?.user?._id === currentUserId;

  const handleLike = () => {
    setIsLiked(!isLiked);
    setLikeCount((prev) => (isLiked ? prev - 1 : prev + 1));
    onLike?.(comment._id);
  };

  const formatTimeAgo = (createdAt) => {
    const now = new Date();
    const commentDate = new Date(createdAt);
    const diffInSeconds = Math.floor((now - commentDate) / 1000);

    if (diffInSeconds < 60) return `${diffInSeconds}s`;
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h`;
    return `${Math.floor(diffInSeconds / 86400)}d`;
  };

  // Generate options for the modal
  const getModalOptions = () => {
    if (isOwner) {
      return [
        {
          label: "Xóa bình luận",
          onClick: () => onDelete?.(comment._id),
          danger: true,
        },
      ];
    } else {
      return [
        {
          label: "Báo cáo bình luận",
          onClick: () => onReport?.(comment),
          danger: true,
        },
      ];
    }
  };

  return (
    <div className="group flex items-start space-x-3 py-2">
      {/* User Avatar */}
      <img
        src={comment?.user?.avatarUrl || "/default-avatar.png"}
        alt={comment?.user?.username}
        className="h-8 w-8 flex-shrink-0 rounded-full object-cover"
      />

      <div className="min-w-0 flex-1">
        {/* Comment Content */}
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <span
              className="mr-2 cursor-pointer text-sm font-semibold text-gray-900 hover:underline dark:text-white"
              onClick={() => onUsernameClick?.(comment?.user)}
            >
              {comment?.user?.username}
            </span>
            <span className="text-sm text-gray-900 dark:text-white">{comment?.content}</span>
          </div>

          {/* Like Button - Hide for captions */}
          {!isCaption && (
            <button
              onClick={handleLike}
              className="p-1 text-gray-400 opacity-100 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
            >
              <Heart size={12} className={`${isLiked ? "fill-red-500 text-red-500" : ""}`} />
            </button>
          )}
        </div>

        {/* Comment Actions */}
        <div className="mt-1 flex items-center space-x-4">
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {formatTimeAgo(comment?.createdAt)}
          </span>

          {likeCount > 0 && !isCaption && (
            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">
              {likeCount} lượt thích
            </span>
          )}

          {!isCaption && (
            <button
              onClick={() => onReply?.(comment)}
              className="text-xs font-semibold text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              Trả lời
            </button>
          )}

          {/* More Options Button - Show for all comments (except captions) on hover */}
          {!isCaption && (
            <button
              onClick={() => setShowModal(true)}
              className="text-xs font-semibold text-gray-500 opacity-0 transition-opacity group-hover:opacity-100 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <MoreHorizontal size={12} />
            </button>
          )}
        </div>
      </div>

      {/* Options Modal */}
      <OptionsModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Tùy chọn"
        options={getModalOptions()}
        showCancel={true}
      />
    </div>
  );
};

export default CommentItem;
