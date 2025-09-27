import { useEffect, useState } from "react";

import { Heart, MessageCircle, Play } from "lucide-react";
import { useInView } from "react-intersection-observer";

import ProfileEmptyState from "./ProfileEmptyState";

const ProfileGrid = ({
  posts,
  onPostClick,
  isLoading,
  hasNextPage,
  onLoadMore,
  isOwnProfile,
  type = "posts",
}) => {
  const { ref, inView } = useInView({
    threshold: 0,
    rootMargin: "200px",
  });

  // Trigger load more when in view
  useEffect(() => {
    if (inView && hasNextPage && !isLoading) {
      onLoadMore?.();
    }
  }, [inView, hasNextPage, isLoading, onLoadMore]);

  if (isLoading && (!posts || posts.length === 0)) {
    return (
      <div className="grid grid-cols-3 gap-1 p-4">
        {[...Array(9)].map((_, i) => (
          <div key={i} className="aspect-square animate-pulse bg-gray-200 dark:bg-gray-700" />
        ))}
      </div>
    );
  }

  if (!posts || posts.length === 0) {
    return (
      <ProfileEmptyState
        type={type}
        isOwnProfile={isOwnProfile}
        onCreatePost={() => {
          // TODO: Open create post modal
          console.log("Create post");
        }}
      />
    );
  }

  return (
    <div className="bg-white dark:bg-gray-900">
      <div className="mx-auto max-w-4xl p-1">
        {/* Posts Grid */}
        <div className="grid grid-cols-3 gap-1">
          {posts.map((post) => (
            <ProfileGridItem key={post._id} post={post} onClick={() => onPostClick(post)} />
          ))}
        </div>

        {/* Load More Trigger */}
        {hasNextPage && (
          <div ref={ref} className="flex justify-center py-4">
            {isLoading && (
              <div className="flex items-center space-x-2 text-gray-500">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600"></div>
                <span className="text-sm">Đang tải thêm...</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const ProfileGridItem = ({ post, onClick }) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const mediaUrl = post.mediaUrls?.[0];
  const isVideo = post.mediaType === "video";
  const hasMultipleMedia = post.mediaUrls?.length > 1;

  return (
    <div
      className="group relative aspect-square cursor-pointer overflow-hidden bg-gray-100 dark:bg-gray-800"
      onClick={onClick}
    >
      {/* Media */}
      <div className="relative h-full w-full">
        {isVideo ? (
          <div className="relative h-full w-full">
            <video src={mediaUrl} className="h-full w-full object-cover" muted preload="metadata" />
            <div className="absolute top-2 right-2">
              <Play className="h-4 w-4 text-white drop-shadow-lg" fill="white" />
            </div>
          </div>
        ) : (
          <>
            {!imageLoaded && (
              <div className="absolute inset-0 animate-pulse bg-gray-200 dark:bg-gray-700" />
            )}
            <img
              src={mediaUrl}
              alt={post.caption || "Post"}
              className={`h-full w-full object-cover transition-opacity duration-200 ${
                imageLoaded ? "opacity-100" : "opacity-0"
              }`}
              onLoad={() => setImageLoaded(true)}
              loading="lazy"
            />
          </>
        )}

        {/* Multiple media indicator */}
        {hasMultipleMedia && (
          <div className="absolute top-2 right-2">
            <div className="flex space-x-1">
              {[...Array(Math.min(post.mediaUrls.length, 3))].map((_, i) => (
                <div key={i} className="h-1.5 w-1.5 rounded-full bg-white/80 shadow-sm" />
              ))}
              {post.mediaUrls.length > 3 && (
                <div className="ml-1 text-xs font-medium text-white/80">
                  +{post.mediaUrls.length - 3}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Hover overlay with stats */}
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
          <div className="flex items-center space-x-6 text-white">
            <div className="flex items-center space-x-2">
              <Heart className="h-5 w-5" fill="white" />
              <span className="font-semibold">{post.likeCount || 0}</span>
            </div>
            <div className="flex items-center space-x-2">
              <MessageCircle className="h-5 w-5" fill="white" />
              <span className="font-semibold">{post.commentCount || 0}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileGrid;
