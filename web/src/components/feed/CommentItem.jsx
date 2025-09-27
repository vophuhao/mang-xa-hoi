import { useState } from "react";

import { ChevronDown, ChevronUp, Heart, MoreHorizontal } from "lucide-react";

import OptionsModal from "@/components/common/OptionsModal";
import { useInfiniteCommentReplies } from "@/hooks/useComment";

const CommentItem = ({
  comment,
  onLike,
  onReply,
  onDelete,
  onReport,
  currentUserId,
  isCaption = false,
  isReply = false,
  parentCommentId = null,
  postId,
  onUsernameClick,
}) => {
  const [showModal, setShowModal] = useState(false);
  const [showReplies, setShowReplies] = useState(false);

  const isOwner = comment?.user?._id === currentUserId;

  // Use comment data directly instead of local state
  const isLiked = comment?.isLiked || false;
  const likeCount = comment?.likeCount || 0;
  const replyCount = comment?.replyCount || 0;

  // Hook for loading replies - only for parent comments
  const {
    data: repliesData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteCommentReplies(showReplies && !isReply ? comment._id : null);

  const handleLike = () => {
    // Pass additional data needed for optimistic updates and reply invalidation
    onLike?.(comment._id, {
      postId,
      parentId: isReply ? parentCommentId : null,
      isLiked,
      likeCount,
    });
  };

  // Format content with @username links
  const formatContentWithMentions = (content) => {
    if (!content) return "";

    const mentionRegex = /@(\w+)/g;
    const parts = content.split(mentionRegex);

    return parts.map((part, index) => {
      // If it's a mention (odd indices after split)
      if (index % 2 === 1) {
        return (
          <span
            key={index}
            className="cursor-pointer text-blue-600 hover:underline dark:text-blue-400"
            onClick={() => onUsernameClick?.({ username: part })}
          >
            @{part}
          </span>
        );
      }
      return part;
    });
  };

  // Toggle show/hide replies
  const toggleReplies = () => {
    setShowReplies(!showReplies);
  };

  // Get all replies from pages
  const allReplies = repliesData?.pages?.flatMap((page) => page.data) || [];

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
          onClick: () =>
            onDelete?.(comment._id, {
              postId,
              parentId: isReply ? parentCommentId : null,
              isReply,
            }),
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
    <div className={`${isReply ? "group/reply" : "group/comment"} flex items-start space-x-3 py-2`}>
      {/* User Avatar */}
      <img
        src={comment?.user?.avatarUrl || "/default-avatar.png"}
        alt={comment?.user?.username}
        className="h-8 w-8 flex-shrink-0 rounded-full object-cover"
      />

      <div className="min-w-0 flex-1">
        {/* Comment Content */}
        <div className="flex items-start justify-between">
          <div className="min-w-0 flex-1 pr-2">
            <div
              className="break-words"
              style={{ overflowWrap: "anywhere", wordBreak: "break-word" }}
            >
              <span
                className="mr-2 cursor-pointer text-sm font-semibold text-gray-900 hover:underline dark:text-white"
                onClick={() => onUsernameClick?.(comment?.user)}
              >
                {comment?.user?.username}
              </span>
              <span
                className="text-sm break-words whitespace-pre-wrap text-gray-900 dark:text-white"
                style={{ overflowWrap: "anywhere", wordBreak: "break-word" }}
              >
                {formatContentWithMentions(comment?.content)}
              </span>
            </div>
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
              className={`text-xs font-semibold text-gray-500 opacity-0 transition-opacity ${
                isReply ? "group-hover/reply:opacity-100" : "group-hover/comment:opacity-100"
              } hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200`}
            >
              <MoreHorizontal size={12} />
            </button>
          )}
        </div>

        {/* Show Replies Button - Only for parent comments with replies */}
        {!isCaption && !isReply && replyCount > 0 && (
          <div className="mt-2">
            <button
              onClick={toggleReplies}
              className="flex items-center text-xs font-semibold text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              {showReplies ? (
                <>
                  <ChevronUp size={12} className="mr-1" />
                  Ẩn câu trả lời
                </>
              ) : (
                <>
                  <ChevronDown size={12} className="mr-1" />
                  Xem câu trả lời ({replyCount})
                </>
              )}
            </button>
          </div>
        )}

        {/* Replies Section */}
        {showReplies && !isReply && allReplies.length > 0 && (
          <div className="mt-2 ml-2 space-y-1">
            {allReplies.map((reply) => (
              <CommentItem
                key={reply._id}
                comment={reply}
                currentUserId={currentUserId}
                onLike={onLike}
                onReply={() => {
                  // When replying to a reply, we want to reply to the parent comment
                  // but mention the reply author
                  onReply?.(comment, reply);
                }}
                onDelete={onDelete}
                onReport={onReport}
                onUsernameClick={onUsernameClick}
                isReply={true}
                parentCommentId={comment._id}
                postId={postId}
              />
            ))}

            {/* Load More Replies Button */}
            {hasNextPage && (
              <button
                onClick={fetchNextPage}
                disabled={isFetchingNextPage}
                className="text-xs font-semibold text-gray-500 hover:text-gray-700 disabled:opacity-50 dark:text-gray-400 dark:hover:text-gray-200"
              >
                {isFetchingNextPage ? "Đang tải..." : "Xem thêm câu trả lời"}
              </button>
            )}
          </div>
        )}
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
