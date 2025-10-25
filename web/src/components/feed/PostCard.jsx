import { useCallback, useRef, useState } from "react";


import { usePostActions } from "@/hooks/usePostActions";

import PostActions from "./PostActions";
import PostCaption from "./PostCaption";
import PostComments from "./PostComments";
import PostHeader from "./PostHeader";
import PostMedia from "./PostMedia";
import PostModal from "./PostModal";
import PostOptionsModal from "./PostOptionsModal";
import PostTimestamp from "./PostTimestamp";
import ShareModal from "./ShareModal";


const PostCard = ({ post, onUsernameClick, onTagClick, onShareClick }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const postMediaRef = useRef(null);

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
    showShareModal,
    sharePostState,
    shareCallback,
    handleCloseShare,
  } = usePostActions(post, { onUsernameClick });

  const pausePostVideos = useCallback(() => {
    if (postMediaRef.current) {
      const videos = postMediaRef.current.querySelectorAll("video");
      videos.forEach((video) => {
        if (!video.paused) {
          video.pause();
        }
      });
    }
  }, []);

  const resumePostVideos = useCallback(() => {
    if (postMediaRef.current) {
      const videos = postMediaRef.current.querySelectorAll("video");
      videos.forEach((video) => {
        if (video.paused) {
          video.play().catch(() => {
            // Auto-play failed, ignore error
          });
        }
      });
    }
  }, []);

  if (!post) return null;

  const handleViewAllComments = () => {
    pausePostVideos();
    setIsModalOpen(true);
  };

  const handleCommentClick = () => {
    pausePostVideos();
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    // Resume videos after a small delay to ensure modal is closed
    setTimeout(() => {
      resumePostVideos();
    }, 100);
  };

  return (
    <article className="mb-6 space-y-2 overflow-hidden bg-transparent">
      {/* Post Header */}
      <PostHeader
        user={post.user}
        location={post.location}
        onOptionsClick={handleOptionsClick}
        onUserClick={handleUserClick}
      />

      {/* Post Media */}
      <div ref={postMediaRef}>
        <PostMedia
          mediaUrls={post.mediaUrls}
          mediaType={post.mediaType}
          altText={`Post by ${post.user?.username}`}
        />
      </div>

      <div className="px-0">
        {/* Post Actions */}
        <PostActions
          post={post}
          onCommentClick={handleCommentClick}
          onShareClick={() => handleShare(post, onShareClick)}
        />

        {/* Post Caption */}
        <PostCaption
          user={post.user}
          caption={post.caption}
          onTagClick={onTagClick}
          onUsernameClick={onUsernameClick}
        />

        {/* Post Comments */}
        <PostComments post={post} onViewAllComments={handleViewAllComments} />

        {/* Post Timestamp */}
        <PostTimestamp createdAt={post.createdAt} />
      </div>

      {/* Post Modal */}
      <PostModal
        post={post}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onUsernameClick={onUsernameClick}
        onShareClick={onShareClick}
      />

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
        onShare={(post) => handleShare(post, onShareClick)}
      />

      {/* Share Modal */}
      {showShareModal && (
        <ShareModal
          open={showShareModal}
          post={sharePostState}
          currentUser={currentUser}
          onClose={handleCloseShare}
          onShare={(user) => {
            // call original callback if exists
            if (typeof shareCallback === "function")
              shareCallback(sharePostState, user);
            // e.g. open DM via routing or socket here
            handleCloseShare();
          }}
          onCopy={(p) => handleCopyLink(p)}
        />
      )}
    </article>
  );
};

export default PostCard;
