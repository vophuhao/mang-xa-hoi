import { useEffect, useState } from "react";

import { X } from "lucide-react";

import { usePostActions } from "@/hooks/usePostActions";

import CommentInput from "./CommentInput";
import CommentList from "./CommentList";
import PostActions from "./PostActions";
import PostHeader from "./PostHeader";
import PostMedia from "./PostMedia";
import PostOptionsModal from "./PostOptionsModal";

const PostModal = ({ post, isOpen, onClose, onUsernameClick, onShareClick, hideActions = [] }) => {
  const [replyState, setReplyState] = useState(null);

  // Use centralized post actions hook
  const {
    currentUser,
    showPostOptions,
    handleOptionsClick,
    handleCloseOptions,
    handlePostEdit,
    handlePostDelete,
    handlePostReport,
    handleCopyLink,
    handleShare,
    handleUserClick,
  } = usePostActions(post, { onUsernameClick });

  // Reply state structure:
  // {
  //   parentId: string,
  //   parentUsername: string,
  //   initialContent: string
  // }

  // Close modal on Escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      // Prevent body scroll when modal is open
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  // Close modal when clicking on backdrop
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen || !post) return null;

  // Handle reply state change
  const handleReplyStateChange = (newReplyState) => {
    setReplyState(newReplyState);
  };

  // Handle reply cancel
  const handleReplyCancel = () => {
    setReplyState(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="bg-opacity-75 absolute inset-0 bg-black/70" onClick={handleBackdropClick} />

      {/* Close Button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-40 p-2 text-white transition-colors duration-200 hover:text-gray-300"
        aria-label="Đóng modal"
      >
        <X size={24} />
      </button>

      {/* Modal Content - Fixed container with proper constraints */}
      <div className="relative h-full max-h-[95vh] w-full max-w-6xl overflow-hidden rounded-md bg-white shadow-2xl dark:bg-gray-900">
        <div className="flex h-full flex-col lg:flex-row">
          {/* Left Side - Post Media - Fixed dimensions */}
          <div className="relative flex max-h-[50vh] min-h-[40vh] flex-1 items-center justify-center overflow-hidden bg-black lg:max-h-[95vh] lg:min-h-[60vh]">
            <div className="relative h-full w-full">
              <PostMedia
                mediaUrls={post.mediaUrls}
                mediaType={post.mediaType}
                altText={`Post by ${post.user?.username}`}
                objectFit="object-contain"
                isModal={true}
              />
            </div>
          </div>

          {/* Right Side - Post Details - Fixed width and scroll */}
          <div className="flex max-h-[50vh] w-full flex-col overflow-hidden bg-white lg:max-h-[95vh] lg:w-96 lg:max-w-96 lg:min-w-96 dark:bg-gray-900">
            {/* Post Header */}
            <div className="hidden flex-shrink-0 border-b border-gray-200 p-3 md:block dark:border-gray-700">
              <PostHeader
                user={post.user}
                location={post.location}
                onOptionsClick={handleOptionsClick}
                onUserClick={handleUserClick}
                showOptions={true}
              />
            </div>

            {/* Comments List - Scrollable area */}
            <div className="min-h-0 flex-1 overflow-y-auto">
              <CommentList
                postId={post._id}
                currentUserId={currentUser?._id}
                post={post}
                onUsernameClick={onUsernameClick}
                onReplyStateChange={handleReplyStateChange}
              />
            </div>

            {/* Post Actions */}
            <div className="flex-shrink-0 border-t border-gray-200 p-3 dark:border-gray-700">
              <PostActions
                post={post}
                hideActions={hideActions}
                onCommentClick={() => {
                  // Focus on comment input
                  const commentInput = document.querySelector("[data-comment-input]");
                  if (commentInput) {
                    commentInput.focus();
                  }
                }}
                onShareClick={() => onShareClick?.(post)}
              />
            </div>

            {/* Comment Input */}
            <div className="flex-shrink-0">
              <CommentInput
                postId={post._id}
                placeholder={
                  replyState ? `Trả lời @${replyState.parentUsername}...` : "Thêm bình luận..."
                }
                parentId={replyState?.parentId}
                initialContent={replyState?.initialContent}
                onReplyCancel={handleReplyCancel}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Post Options Modal */}
      <PostOptionsModal
        isOpen={showPostOptions}
        onClose={handleCloseOptions}
        post={post}
        currentUserId={currentUser?._id}
        onEdit={handlePostEdit}
        onDelete={handlePostDelete}
        onReport={handlePostReport}
        onCopyLink={handleCopyLink}
        onShare={handleShare}
      />
    </div>
  );
};

export default PostModal;
