import { useCallback, useRef, useState } from "react";

import PostActions from "./PostActions";
import PostCaption from "./PostCaption";
import PostComments from "./PostComments";
import PostHeader from "./PostHeader";
import PostMedia from "./PostMedia";
import PostModal from "./PostModal";
import PostTimestamp from "./PostTimestamp";

const PostCard = ({ post, onUsernameClick, onTagClick, onShareClick }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const postMediaRef = useRef(null);

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

  const handleOptionsClick = () => {
    // TODO: Show post options menu
    console.log("Options clicked for post:", post._id);
  };

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
      <PostHeader user={post.user} location={post.location} onOptionsClick={handleOptionsClick} />

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
          onShareClick={() => onShareClick?.(post)}
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
    </article>
  );
};

export default PostCard;
