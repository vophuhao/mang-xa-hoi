import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Grid, List, Settings } from 'lucide-react';

import { fetchUserProfile, followUser, unfollowUser } from '../store/slices/userSlice';
import Avatar from '../components/ui/Avatar';
import Button from '../components/ui/Button';
import { Card } from '../components/ui/Card';

const ProfilePage = () => {
  const { username } = useParams();
  const dispatch = useDispatch();
  const { profileUser, currentUser, isLoading } = useSelector((state) => state.users);
  const [viewType, setViewType] = useState('grid');

  useEffect(() => {
    if (username) {
      dispatch(fetchUserProfile(username));
    }
  }, [dispatch, username]);

  const handleFollow = () => {
    if (profileUser.isFollowing) {
      dispatch(unfollowUser(profileUser._id));
    } else {
      dispatch(followUser(profileUser._id));
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!profileUser) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 dark:text-gray-400">User not found</p>
      </div>
    );
  }

  const isOwnProfile = currentUser?._id === profileUser._id;

  return (
    <div className="max-w-4xl mx-auto">
      {/* Profile Header */}
      <Card className="p-8 mb-8">
        <div className="flex flex-col md:flex-row items-center md:items-start space-y-6 md:space-y-0 md:space-x-8">
          <Avatar
            src={profileUser.avatar}
            alt={profileUser.username}
            size="2xl"
          />
          
          <div className="flex-1 text-center md:text-left">
            <div className="flex flex-col md:flex-row items-center md:items-start space-y-4 md:space-y-0 md:space-x-6">
              <h1 className="text-2xl font-light text-gray-900 dark:text-white">
                {profileUser.username}
              </h1>
              
              <div className="flex space-x-3">
                {isOwnProfile ? (
                  <>
                    <Button variant="secondary" size="sm">
                      Edit Profile
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Settings className="w-4 h-4" />
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      variant={profileUser.isFollowing ? "secondary" : "primary"}
                      size="sm"
                      onClick={handleFollow}
                    >
                      {profileUser.isFollowing ? 'Unfollow' : 'Follow'}
                    </Button>
                    <Button variant="secondary" size="sm">
                      Message
                    </Button>
                  </>
                )}
              </div>
            </div>

            {/* Stats */}
            <div className="flex justify-center md:justify-start space-x-8 mt-6">
              <div className="text-center">
                <span className="font-semibold text-lg">
                  {profileUser.postsCount || 0}
                </span>
                <p className="text-gray-600 dark:text-gray-400 text-sm">posts</p>
              </div>
              <div className="text-center">
                <span className="font-semibold text-lg">
                  {profileUser.followersCount || 0}
                </span>
                <p className="text-gray-600 dark:text-gray-400 text-sm">followers</p>
              </div>
              <div className="text-center">
                <span className="font-semibold text-lg">
                  {profileUser.followingCount || 0}
                </span>
                <p className="text-gray-600 dark:text-gray-400 text-sm">following</p>
              </div>
            </div>

            {/* Bio */}
            {profileUser.bio && (
              <div className="mt-6">
                <p className="text-gray-900 dark:text-white">{profileUser.bio}</p>
              </div>
            )}

            {profileUser.website && (
              <div className="mt-2">
                <a
                  href={profileUser.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 dark:text-blue-400 hover:underline"
                >
                  {profileUser.website}
                </a>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Content Navigation */}
      <div className="border-t border-gray-200 dark:border-gray-700 mb-8">
        <div className="flex justify-center space-x-8">
          <button
            onClick={() => setViewType('grid')}
            className={`flex items-center space-x-1 px-4 py-3 text-xs font-semibold uppercase tracking-wide ${
              viewType === 'grid'
                ? 'text-gray-900 dark:text-white border-t-2 border-gray-900 dark:border-white'
                : 'text-gray-500 dark:text-gray-400'
            }`}
          >
            <Grid className="w-4 h-4" />
            <span>Posts</span>
          </button>
          <button
            onClick={() => setViewType('saved')}
            className={`flex items-center space-x-1 px-4 py-3 text-xs font-semibold uppercase tracking-wide ${
              viewType === 'saved'
                ? 'text-gray-900 dark:text-white border-t-2 border-gray-900 dark:border-white'
                : 'text-gray-500 dark:text-gray-400'
            }`}
          >
            <List className="w-4 h-4" />
            <span>Saved</span>
          </button>
        </div>
      </div>

      {/* Posts Grid */}
      <div className="grid grid-cols-3 gap-1 md:gap-4">
        {profileUser.posts?.length === 0 ? (
          <div className="col-span-3 text-center py-12">
            <p className="text-gray-500 dark:text-gray-400">
              {isOwnProfile ? "Share your first photo" : "No posts yet"}
            </p>
          </div>
        ) : (
          profileUser.posts?.map((post) => (
            <div
              key={post._id}
              className="aspect-square bg-gray-100 dark:bg-gray-800 rounded-md overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
            >
              {post.image ? (
                <img
                  src={post.image}
                  alt={post.caption}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <p className="text-gray-500 dark:text-gray-400 text-xs">
                    {post.caption?.slice(0, 50)}...
                  </p>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ProfilePage;
