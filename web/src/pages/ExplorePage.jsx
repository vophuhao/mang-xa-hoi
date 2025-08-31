import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { fetchExplorePosts } from '../store/slices/postSlice';

const ExplorePage = () => {
  const dispatch = useDispatch();
  const { explorePosts, isLoading, error } = useSelector((state) => state.posts);

  useEffect(() => {
    dispatch(fetchExplorePosts());
  }, [dispatch]);

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto pt-16 lg:pt-0">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-8">
        Explore
      </h1>

      {isLoading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-2 text-gray-500">Loading posts...</p>
        </div>
      ) : explorePosts.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500 dark:text-gray-400">
            No posts to explore yet.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-1 md:gap-4">
          {explorePosts.map((post) => (
            <div
              key={post._id}
              className="aspect-square bg-gray-100 dark:bg-gray-800 rounded-md overflow-hidden cursor-pointer hover:opacity-80 transition-opacity group"
            >
              {post.image ? (
                <div className="relative w-full h-full">
                  <img
                    src={post.image}
                    alt={post.caption}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-300 flex items-center justify-center">
                    <div className="opacity-0 group-hover:opacity-100 text-white text-center transition-opacity duration-300">
                      <p className="text-sm font-semibold mb-1">
                        ❤️ {post.likes || 0}
                      </p>
                      <p className="text-sm">
                        💬 {post.commentsCount || 0}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="w-full h-full flex items-center justify-center p-4">
                  <p className="text-gray-500 dark:text-gray-400 text-sm text-center">
                    {post.caption?.slice(0, 100)}
                    {post.caption?.length > 100 ? '...' : ''}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ExplorePage;
