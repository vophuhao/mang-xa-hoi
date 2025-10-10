import { useEffect, useState } from "react";

import { Heart, MessageCircle, Play } from "lucide-react";
import { useInView } from "react-intersection-observer";

import { useTrendingPosts } from "@/hooks/usePost";

const ExploreGrid = ({ searchQuery, onPostClick }) => {
  const [posts, setPosts] = useState([]);
  const { ref, inView } = useInView({
    threshold: 0,
    rootMargin: "200px",
  });

  const {
    data: trendingData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    error,
  } = useTrendingPosts();

  // Flatten all pages into single array
  useEffect(() => {
    if (trendingData?.pages) {
      const allPosts = trendingData.pages.flatMap((page) => page.data || []);
      setPosts(allPosts);
    }
  }, [trendingData]);

  // Infinite scroll
  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Filter posts based on search query
  const filteredPosts = posts.filter((post) => {
    if (!searchQuery) return true;

    const query = searchQuery.toLowerCase();

    // Search by hashtag
    if (query.startsWith("#")) {
      const hashtag = query.slice(1);
      return (
        post.tags?.some((tag) => tag.toLowerCase().includes(hashtag)) ||
        post.caption?.toLowerCase().includes(hashtag)
      );
    }

    // Search by username or caption
    return (
      post.user?.username?.toLowerCase().includes(query) ||
      post.user?.fullName?.toLowerCase().includes(query) ||
      post.caption?.toLowerCase().includes(query)
    );
  });

  if (isLoading) {
    return (
      <>
        {/* Desktop Loading Skeleton */}
        <div className="hidden lg:grid lg:grid-cols-3 lg:gap-0.5">
          {[...Array(12)].map((_, i) => (
            <div
              key={i}
              className="aspect-square animate-pulse rounded-sm bg-gray-200 dark:bg-gray-700"
            />
          ))}
        </div>

        {/* Tablet Loading Skeleton */}
        <div className="hidden md:grid md:grid-cols-3 md:gap-0.5 lg:hidden">
          {[...Array(9)].map((_, i) => (
            <div
              key={i}
              className="aspect-square animate-pulse rounded-sm bg-gray-200 dark:bg-gray-700"
            />
          ))}
        </div>

        {/* Mobile Loading Skeleton */}
        <div className="grid grid-cols-3 gap-0.5 md:hidden">
          {[...Array(9)].map((_, i) => (
            <div
              key={i}
              className="aspect-square animate-pulse rounded-sm bg-gray-200 dark:bg-gray-700"
            />
          ))}
        </div>
      </>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="mb-2 text-gray-500 dark:text-gray-400">Không thể tải nội dung</div>
        <button
          onClick={() => window.location.reload()}
          className="text-sm font-medium text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300"
        >
          Thử lại
        </button>
      </div>
    );
  }

  if (filteredPosts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="mb-2 text-gray-500 dark:text-gray-400">
          {searchQuery ? "Không tìm thấy kết quả nào" : "Chưa có bài viết nào"}
        </div>
        {searchQuery && (
          <div className="text-center text-sm text-gray-400">Thử tìm kiếm với từ khóa khác</div>
        )}
      </div>
    );
  }

  return (
    <>
      {/* Desktop Grid (3 columns with better spacing) */}
      <div className="hidden lg:grid lg:grid-cols-3 lg:gap-0.5">
        {filteredPosts.map((post, index) => {
          // Use uniform square layout for better grid consistency
          const isWide = (index + 1) % 9 === 4 || (index + 1) % 9 === 7; // Every 4th and 7th in each row of 9
          const isTall = (index + 1) % 12 === 6; // Every 6th item

          let itemClass = "col-span-1 row-span-1 aspect-square";
          if (isWide && index > 0) {
            itemClass = "col-span-2 row-span-1 aspect-[2/1]";
          } else if (isTall && index > 0) {
            itemClass = "col-span-1 row-span-2 aspect-[1/2]";
          }

          return (
            <ExploreGridItem
              key={post._id}
              post={post}
              onClick={() => onPostClick(post)}
              className={`${itemClass} cursor-pointer`}
            />
          );
        })}
      </div>

      {/* Tablet Grid (3 columns, uniform squares) */}
      <div className="hidden md:grid md:grid-cols-3 md:gap-0.5 lg:hidden">
        {filteredPosts.map((post) => (
          <ExploreGridItem
            key={post._id}
            post={post}
            onClick={() => onPostClick(post)}
            className="aspect-square cursor-pointer"
          />
        ))}
      </div>

      {/* Mobile Grid (3 columns, equal squares) */}
      <div className="grid grid-cols-3 gap-0.5 md:hidden">
        {filteredPosts.map((post) => (
          <ExploreGridItem
            key={post._id}
            post={post}
            onClick={() => onPostClick(post)}
            className="aspect-square cursor-pointer"
          />
        ))}
      </div>

      {/* Infinite scroll trigger */}
      <div ref={ref} className="mt-4 flex justify-center">
        {isFetchingNextPage && (
          <div className="flex items-center space-x-2 text-gray-500 dark:text-gray-400">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600 dark:border-gray-600 dark:border-t-gray-300"></div>
            <span className="text-sm">Đang tải thêm...</span>
          </div>
        )}
      </div>
    </>
  );
};

const ExploreGridItem = ({ post, onClick, className }) => {
  const [imageLoaded, setImageLoaded] = useState(false);

  const mediaUrl = post.mediaUrls?.[0];
  const isVideo = post.mediaType === "video";

  return (
    <div
      className={`group relative overflow-hidden bg-gray-100 dark:bg-gray-800 ${className}`}
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

        {/* Overlay with stats - appears on hover */}
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
          <div className="flex items-center space-x-6 text-white">
            <div className="flex items-center space-x-1">
              <Heart className="h-5 w-5" fill="white" />
              <span className="text-sm font-semibold">{post.likeCount || 0}</span>
            </div>
            <div className="flex items-center space-x-1">
              <MessageCircle className="h-5 w-5" fill="white" />
              <span className="text-sm font-semibold">{post.commentCount || 0}</span>
            </div>
          </div>
        </div>

        {/* Multi-image indicator */}
        {post.mediaUrls?.length > 1 && (
          <div className="absolute top-2 right-2">
            <div className="flex space-x-1">
              {[...Array(Math.min(post.mediaUrls.length, 3))].map((_, i) => (
                <div key={i} className="h-2 w-2 rounded-full bg-white/80 backdrop-blur-sm" />
              ))}
              {post.mediaUrls.length > 3 && (
                <div className="ml-1 text-xs text-white/80">+{post.mediaUrls.length - 3}</div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExploreGrid;
