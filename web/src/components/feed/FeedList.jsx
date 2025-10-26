import { useCallback } from "react";

import { useNavigate } from "react-router-dom";

import PostCard from "./PostCard";


const FeedList = ({ posts, isLoading, error, onLoadMore, hasNextPage }) => {
  const navigate = useNavigate();

  const handleUsernameClick = useCallback(
    (username) => {
      navigate(`/${username}`);
    },
    [navigate]
  );

  const handleTagClick = useCallback((tag) => {
    // TODO: Navigate to hashtag page
    console.log("Tag clicked:", tag);
  }, []);

  const handleCommentClick = useCallback((post) => {
    // TODO: Open comments modal or navigate to post detail
    console.log("Comments clicked for post:", post._id);
  }, []);

  const handleShareClick = useCallback((post) => {
    // TODO: Open share modal
    console.log("Share clicked for post:", post._id);
  }, []);

  if (error) {
    return (
      <div className="py-8 text-center">
        <p className="text-gray-500 dark:text-gray-400">
          Có lỗi xảy ra khi tải bài viết. Vui lòng thử lại sau.
        </p>
      </div>
    );
  }

  if (!posts || posts.length === 0) {
    return (
      <div className="py-8 text-center">
        <p className="text-gray-500 dark:text-gray-400">Chưa có bài viết nào để hiển thị.</p>
      </div>
    );
  }

  return (
    <div className="space-y-0">
      {posts.map((post) => (
        <PostCard
          key={post._id}
          post={post}
          onUsernameClick={handleUsernameClick}
          onTagClick={handleTagClick}
          onCommentClick={handleCommentClick}
          onShareClick={handleShareClick}
        />
      ))}

      {/* Loading indicator */}
      {isLoading && (
        <div className="flex justify-center py-8">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600"></div>
        </div>
      )}

      {/* Load more button */}
      {hasNextPage && !isLoading && (
        <div className="flex justify-center py-8">
          <button
            onClick={onLoadMore}
            className="rounded-lg bg-gray-100 px-6 py-2 font-medium text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
          >
            Xem thêm bài viết
          </button>
        </div>
      )}
    </div>
  );
};

export default FeedList;
