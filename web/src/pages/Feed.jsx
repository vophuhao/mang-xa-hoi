import { useEffect, useState } from "react";

import { useSelector } from "react-redux";

import { useUser } from "@/hooks/useUser";
import { isPanelMenu } from "@/store/slices/layoutSlice";

const Feed = () => {
  const { activeMenu, isMobile } = useSelector((state) => state.layout);
  const {
    currentUser,
    isLoadingCurrentUser,
    suggestedUsers,
    isLoadingSuggestions,
    toggleFollow,
    isFollowActionLoading,
  } = useUser();

  // State to track follow status for each user
  const [followStates, setFollowStates] = useState({});

  useEffect(() => {
    console.log("currentUser", currentUser);
  }, [currentUser]);
  useEffect(() => {
    console.log("suggestedUsers", suggestedUsers);
  }, [suggestedUsers]);

  // Initialize follow states when suggested users are loaded
  useEffect(() => {
    if (suggestedUsers) {
      const initialStates = {};
      suggestedUsers.forEach((user) => {
        initialStates[user._id] = user.isFollowing || false;
      });
      setFollowStates(initialStates);
    }
  }, [suggestedUsers]);

  const handleFollowClick = (userId, isFollowing) => {
    // Optimistically update the UI
    setFollowStates((prev) => ({
      ...prev,
      [userId]: !isFollowing,
    }));

    // Call the API
    toggleFollow(userId, isFollowing);
  };

  return (
    <div className="flex h-full overflow-hidden px-[100px]">
      {/* Main Feed Content */}
      <div className="scrollbar-hide flex-1 overflow-y-auto">
        <div className={`mx-auto ${isMobile ? "px-4" : "max-w-xl px-6"}`}>
          {/* Feed posts will go here */}
          <div className="py-6">
            <h1 className="mb-4 text-2xl font-bold text-gray-900 dark:text-white">
              Feed
            </h1>
            {/* Placeholder for feed posts */}
            <div className="space-y-6">
              {[1, 2, 3, 4, 5].map((post) => (
                <div
                  key={post}
                  className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800"
                >
                  <div className="mb-3 flex items-center">
                    <div className="mr-3 h-8 w-8 rounded-full bg-gray-300 dark:bg-gray-600"></div>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      User {post}
                    </span>
                  </div>
                  <div className="mb-3 h-64 rounded-lg bg-gray-100 dark:bg-gray-700"></div>
                  <p className="text-gray-900 dark:text-white">
                    This is a sample post #{post}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Right Sidebar - Desktop only */}
      {!isMobile && !isPanelMenu(activeMenu) && (
        <div className="hidden w-80 xl:block">
          <div className="p-4">
            {/* Current User Profile */}
            {isLoadingCurrentUser ? (
              <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center">
                  <div className="mr-3 h-14 w-14 animate-pulse rounded-full bg-gray-300 dark:bg-gray-600"></div>
                  <div>
                    <div className="mb-1 h-4 w-24 animate-pulse rounded bg-gray-300 dark:bg-gray-600"></div>
                    <div className="h-3 w-16 animate-pulse rounded bg-gray-300 dark:bg-gray-600"></div>
                  </div>
                </div>
                <div className="h-6 w-12 animate-pulse rounded bg-gray-300 dark:bg-gray-600"></div>
              </div>
            ) : currentUser ? (
              <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center">
                  {currentUser.avatarUrl ? (
                    <img
                      src={currentUser.avatarUrl}
                      alt={currentUser.username}
                      className="mr-3 h-10 w-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="mr-3 h-14 w-14 rounded-full bg-gray-300 dark:bg-gray-600"></div>
                  )}
                  <div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                      {currentUser.username}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {currentUser.fullName || currentUser.username}
                    </p>
                  </div>
                </div>
                <button className="cursor-pointer text-xs font-semibold text-blue-500 hover:text-blue-600">
                  Chuyển
                </button>
              </div>
            ) : (
              <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center">
                  <div className="mr-3 h-14 w-14 rounded-full bg-gray-300 dark:bg-gray-600"></div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                      username
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Full Name
                    </p>
                  </div>
                </div>
                <button className="cursor-pointer text-xs font-semibold text-blue-500 hover:text-blue-600">
                  Chuyển
                </button>
              </div>
            )}

            {/* Suggestions section */}
            <div className="mb-6">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400">
                  Gợi ý cho bạn
                </h2>
                <button className="cursor-pointer text-xs font-semibold text-gray-900 hover:text-gray-700 dark:text-white dark:hover:text-gray-300">
                  Xem tất cả
                </button>
              </div>

              <div className="space-y-3">
                {isLoadingSuggestions
                  ? // Loading skeleton
                    Array.from({ length: 5 }).map((_, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between"
                      >
                        <div className="flex items-center">
                          <div className="mr-3 h-8 w-8 animate-pulse rounded-full bg-gray-300 dark:bg-gray-600"></div>
                          <div>
                            <div className="mb-1 h-4 w-20 animate-pulse rounded bg-gray-300 dark:bg-gray-600"></div>
                            <div className="h-3 w-16 animate-pulse rounded bg-gray-300 dark:bg-gray-600"></div>
                          </div>
                        </div>
                        <div className="h-6 w-14 animate-pulse rounded bg-gray-300 dark:bg-gray-600"></div>
                      </div>
                    ))
                  : suggestedUsers && suggestedUsers.length > 0
                    ? suggestedUsers.slice(0, 5).map((user) => (
                        <div
                          key={user._id}
                          className="flex items-center justify-between"
                        >
                          <div className="flex items-center">
                            {user.avatar ? (
                              <img
                                src={user.avatar}
                                alt={user.username}
                                className="mr-3 h-8 w-8 rounded-full object-cover"
                              />
                            ) : (
                              <div className="mr-3 h-8 w-8 rounded-full bg-gray-300 dark:bg-gray-600"></div>
                            )}
                            <div>
                              <p className="text-sm font-medium text-gray-900 dark:text-white">
                                {user.username}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {"Gợi ý cho bạn"}
                              </p>
                            </div>
                          </div>
                          <button
                            className={`cursor-pointer text-xs font-semibold disabled:opacity-50 ${(() => {
                              const currentFollowState =
                                followStates[user._id] !== undefined
                                  ? followStates[user._id]
                                  : user.isFollowing;
                              return currentFollowState
                                ? "text-black hover:text-gray-600 dark:text-white dark:hover:text-gray-400" // màu khi đã theo dõi
                                : "text-blue-500 hover:text-blue-600"; // màu khi chưa theo dõi
                            })()} `}
                            disabled={isFollowActionLoading}
                            onClick={() => {
                              const currentFollowState =
                                followStates[user._id] !== undefined
                                  ? followStates[user._id]
                                  : user.isFollowing;
                              handleFollowClick(user._id, currentFollowState);
                            }}
                          >
                            {(() => {
                              const currentFollowState =
                                followStates[user._id] !== undefined
                                  ? followStates[user._id]
                                  : user.isFollowing;
                              return currentFollowState
                                ? "Đang theo dõi"
                                : "Theo dõi";
                            })()}
                          </button>
                        </div>
                      ))
                    : // Fallback static data when no suggestions available
                      [
                        {
                          id: 1,
                          username: "nhutanh.na",
                          subtitle: "Gợi ý cho bạn",
                        },
                        {
                          id: 2,
                          username: "sonofgod.2507",
                          subtitle: "Đang theo dõi ciixxcham",
                        },
                        {
                          id: 3,
                          username: "t_c_a_l_t",
                          subtitle: "Gợi ý cho bạn",
                        },
                        {
                          id: 4,
                          username: "_shinzi_",
                          subtitle: "Đang theo dõi dhknhii",
                        },
                        {
                          id: 5,
                          username: "a_tuyet2902_4",
                          subtitle: "Gợi ý cho bạn",
                        },
                      ].map((user) => (
                        <div
                          key={user.id}
                          className="flex items-center justify-between"
                        >
                          <div className="flex items-center">
                            <div className="mr-3 h-8 w-8 rounded-full bg-gray-300 dark:bg-gray-600"></div>
                            <div>
                              <p className="text-sm font-medium text-gray-900 dark:text-white">
                                {user.username}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {user.subtitle}
                              </p>
                            </div>
                          </div>
                          <button className="cursor-pointer text-xs font-semibold text-blue-500 hover:text-blue-600">
                            Theo dõi
                          </button>
                        </div>
                      ))}
              </div>
            </div>

            {/* Footer links */}
            <div className="text-xs text-gray-400 dark:text-gray-500">
              <p className="mt-4">© 2025 PIXYY FROM GROUP 4</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Feed;
