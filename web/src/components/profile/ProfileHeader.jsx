import { useState } from "react";

import { Edit2, Plus, Settings, Share, UserCheck } from "lucide-react";

const ProfileHeader = ({
  user,
  isOwnProfile,
  onEditProfile,
  onFollow,
  onUnfollow,
  isFollowing,
}) => {
  const [showMore, setShowMore] = useState(false);

  const formatCount = (count) => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    }
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count?.toString() || "0";
  };

  return (
    <div className="bg-white dark:bg-gray-900">
      <div className="mx-auto max-w-4xl px-4 py-6">
        {/* Top Section - Avatar, Stats, Actions */}
        <div className="flex items-start space-x-6 md:space-x-8">
          {/* Profile Avatar */}
          <div className="flex-shrink-0">
            <div className="relative">
              <img
                src={user?.avatarUrl || "/default-avatar.png"}
                alt={user?.username}
                className="h-20 w-20 rounded-full object-cover ring-2 ring-gray-100 md:h-32 md:w-32 dark:ring-gray-800"
              />
              {isOwnProfile && (
                <button className="absolute -right-1 -bottom-1 rounded-full bg-blue-500 p-1.5 text-white shadow-lg hover:bg-blue-600 md:p-2">
                  <Plus className="h-3 w-3 md:h-4 md:w-4" />
                </button>
              )}
            </div>
          </div>

          {/* Profile Info & Actions */}
          <div className="min-w-0 flex-1">
            {/* Username & Actions Row */}
            <div className="mb-4 flex flex-wrap items-center gap-3">
              <h1 className="text-xl font-light text-gray-900 md:text-2xl dark:text-white">
                {user?.username}
              </h1>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                {isOwnProfile ? (
                  <>
                    <button
                      onClick={onEditProfile}
                      className="flex items-center space-x-2 rounded-lg bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-900 hover:bg-gray-200 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700"
                    >
                      <Edit2 className="h-4 w-4" />
                      <span className="hidden sm:inline">Chỉnh sửa trang cá nhân</span>
                      <span className="sm:hidden">Sửa</span>
                    </button>
                    <button className="rounded-lg bg-gray-100 p-2 text-gray-900 hover:bg-gray-200 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700">
                      <Settings className="h-4 w-4" />
                    </button>
                  </>
                ) : (
                  <>
                    {isFollowing ? (
                      <button
                        onClick={onUnfollow}
                        className="flex items-center space-x-2 rounded-lg bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-900 hover:bg-gray-200 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700"
                      >
                        <UserCheck className="h-4 w-4" />
                        <span>Đang theo dõi</span>
                      </button>
                    ) : (
                      <button
                        onClick={onFollow}
                        className="rounded-lg bg-blue-500 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-600"
                      >
                        Theo dõi
                      </button>
                    )}
                    <button className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-900 hover:bg-gray-200 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700">
                      Nhắn tin
                    </button>
                    <button className="rounded-lg bg-gray-100 p-2 text-gray-900 hover:bg-gray-200 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700">
                      <Share className="h-4 w-4" />
                    </button>
                  </>
                )}
                {/* <button
                  onClick={() => setShowMore(!showMore)}
                  className="rounded-lg bg-gray-100 p-2 text-gray-900 hover:bg-gray-200 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </button> */}
              </div>
            </div>

            {/* Stats Row - Mobile: Hidden, Desktop: Visible */}
            <div className="mb-4 hidden items-center space-x-8 md:flex">
              <div className="text-center">
                <div className="text-xl font-semibold text-gray-900 dark:text-white">
                  {formatCount(user?.postsCount || 0)}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">bài viết</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-semibold text-gray-900 dark:text-white">
                  {formatCount(user?.followersCount || 0)}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">người theo dõi</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-semibold text-gray-900 dark:text-white">
                  {formatCount(user?.followingCount || 0)}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">đang theo dõi</div>
              </div>
            </div>

            {/* Bio Section */}
            <div className="space-y-1">
              {user?.fullName && (
                <div className="font-semibold text-gray-900 dark:text-white">{user.fullName}</div>
              )}
              {user?.bio && (
                <div className="text-sm text-gray-900 dark:text-white">
                  {user.bio.split("\n").map((line, index) => (
                    <div key={index}>{line}</div>
                  ))}
                </div>
              )}
              {user?.website && (
                <a
                  href={user.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:underline dark:text-blue-400"
                >
                  {user.website}
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Stats Row */}
        <div className="mt-6 flex items-center justify-around border-t border-gray-200 pt-4 md:hidden dark:border-gray-800">
          <div className="text-center">
            <div className="text-lg font-semibold text-gray-900 dark:text-white">
              {formatCount(user?.postsCount || 0)}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">bài viết</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-gray-900 dark:text-white">
              {formatCount(user?.followersCount || 0)}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">người theo dõi</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-gray-900 dark:text-white">
              {formatCount(user?.followingCount || 0)}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">đang theo dõi</div>
          </div>
        </div>

        {/* Story Highlights - Only show if user has stories */}
        {user?.storyHighlights && user.storyHighlights.length > 0 && (
          <div className="mt-6 border-t border-gray-200 pt-4 dark:border-gray-800">
            <div className="flex space-x-4 overflow-x-auto pb-2">
              {user.storyHighlights.map((highlight, index) => (
                <div key={index} className="flex flex-col items-center space-y-1">
                  <div className="h-16 w-16 rounded-full border-2 border-gray-300 p-1 dark:border-gray-600">
                    <img
                      src={highlight.thumbnail}
                      alt={highlight.title}
                      className="h-full w-full rounded-full object-cover"
                    />
                  </div>
                  <span className="text-xs text-gray-900 dark:text-white">{highlight.title}</span>
                </div>
              ))}
              {isOwnProfile && (
                <div className="flex flex-col items-center space-y-1">
                  <button className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-dashed border-gray-300 dark:border-gray-600">
                    <Plus className="h-6 w-6 text-gray-400" />
                  </button>
                  <span className="text-xs text-gray-600 dark:text-gray-400">Mới</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfileHeader;
