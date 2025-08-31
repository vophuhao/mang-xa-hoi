import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { fetchPosts } from '../../store/slices/postSlice';
import Post from '../post/Post';
import SuggestedUsers from '../user/SuggestedUsers';
import CreatePost from '../post/CreatePost';

const Feed = () => {
  const dispatch = useDispatch();
  const { feedPosts, isLoading, error } = useSelector((state) => state.posts);

  useEffect(() => {
    dispatch(fetchPosts());
  }, [dispatch]);

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Feed */}
        <div className="lg:col-span-2">
          {/* Create Post */}
          <div className="mb-8">
            <CreatePost />
          </div>

          {/* Posts */}
          <div className="space-y-6">
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                <p className="mt-2 text-gray-500">Loading posts...</p>
              </div>
            ) : feedPosts.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500 dark:text-gray-400">
                  No posts yet. Start following people to see their posts!
                </p>
              </div>
            ) : (
              feedPosts.map((post) => (
                <Post key={post._id} post={post} />
              ))
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="hidden lg:block">
          <div className="sticky top-8">
            <SuggestedUsers />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Feed;
