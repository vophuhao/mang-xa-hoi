import { useState } from "react";

import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Search, UserPlus, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

import { followUser, getSuggestedUsers, unfollowUser } from "@/lib/api";

const ExplorePeople = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [followStates, setFollowStates] = useState({});

  // Fetch suggested users with infinite scroll
  const {
    data: usersData,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ["suggested-users-explore"],
    queryFn: getSuggestedUsers,
    getNextPageParam: (lastPage) => lastPage?.nextPage,
    staleTime: 5 * 60 * 1000,
  });

  // Follow/Unfollow mutation
  const followMutation = useMutation({
    mutationFn: ({ userId, isFollowing }) => {
      return isFollowing ? unfollowUser(userId) : followUser(userId);
    },
    onMutate: async ({ userId, isFollowing }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries(["suggested-users-explore"]);

      // Snapshot the previous value
      const previousData = queryClient.getQueryData(["suggested-users-explore"]);

      // Optimistically update cache
      queryClient.setQueryData(["suggested-users-explore"], (old) => {
        if (!old) return old;

        return {
          ...old,
          pages: old.pages.map((page) => ({
            ...page,
            data: page.data?.map((user) =>
              user._id === userId ? { ...user, isFollowing: !isFollowing } : user
            ),
          })),
        };
      });

      // Update local state as backup
      setFollowStates((prev) => ({
        ...prev,
        [userId]: !isFollowing,
      }));

      return { previousData };
    },
    onSuccess: () => {
      // Chỉ invalidate query của RightSidebar
      queryClient.invalidateQueries(["user", "suggestions"]);
    },
    onError: (error, variables, context) => {
      // Rollback to previous data if mutation fails
      if (context?.previousData) {
        queryClient.setQueryData(["suggested-users-explore"], context.previousData);
      }

      // Rollback local state
      setFollowStates((prev) => ({
        ...prev,
        [variables.userId]: variables.isFollowing,
      }));

      toast.error("Có lỗi xảy ra, vui lòng thử lại!");
    },
    onSettled: () => {
      // Always refetch after error or success to ensure consistency
      // But don't remove users from the list
      queryClient.invalidateQueries(["user", "suggestions"]);
    },
  });

  const allUsers = usersData?.pages?.flatMap((page) => page?.data || []) || [];

  // Filter users based on search query
  const filteredUsers = searchQuery
    ? allUsers.filter(
        (user) =>
          user.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          user.email?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : allUsers;

  const handleFollowClick = (userId, isFollowing) => {
    followMutation.mutate({ userId, isFollowing });
  };

  const handleUserClick = (username) => {
    navigate(`/${username}`);
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <div className="mx-auto max-w-4xl px-4 pt-4 pb-20">
        {/* Header */}
        <div className="mb-6">
          <div className="mb-4 flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="rounded-full p-2 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
              aria-label="Quay lại"
            >
              <ArrowLeft size={24} className="text-gray-900 dark:text-white" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Những người bạn có thể biết
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Khám phá những người dùng mới
              </p>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
              <Search size={20} className="text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Tìm kiếm người dùng..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-gray-50 py-3 pr-4 pl-12 text-gray-900 placeholder-gray-500 transition-colors focus:border-blue-500 focus:bg-white focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder-gray-400 dark:focus:border-blue-500 dark:focus:bg-gray-900"
            />
          </div>
        </div>

        {/* Stats */}
        <div className="mb-6 flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          <Users size={18} />
          <span>
            {filteredUsers.length} người dùng{searchQuery && " được tìm thấy"}
          </span>
        </div>

        {/* Users Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 9 }).map((_, index) => (
              <div
                key={index}
                className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900"
              >
                <div className="flex flex-col items-center">
                  <div className="mb-3 h-20 w-20 animate-pulse rounded-full bg-gray-300 dark:bg-gray-700"></div>
                  <div className="mb-2 h-5 w-24 animate-pulse rounded bg-gray-300 dark:bg-gray-700"></div>
                  <div className="mb-4 h-4 w-32 animate-pulse rounded bg-gray-300 dark:bg-gray-700"></div>
                  <div className="h-9 w-full animate-pulse rounded-lg bg-gray-300 dark:bg-gray-700"></div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredUsers.length > 0 ? (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredUsers.map((user) => {
                // Sử dụng followStates để track trạng thái follow local
                const currentFollowState =
                  followStates[user._id] !== undefined ? followStates[user._id] : user.isFollowing;

                return (
                  <div
                    key={user._id}
                    className="rounded-xl border border-gray-200 bg-white p-6 transition-all hover:border-gray-300 hover:shadow-md dark:border-gray-800 dark:bg-gray-900 dark:hover:border-gray-700"
                  >
                    <div className="flex flex-col items-center">
                      {/* Avatar */}
                      <button
                        onClick={() => handleUserClick(user.userId)}
                        className="mb-3 transition-transform hover:scale-105"
                      >
                        {user.avatar ? (
                          <img
                            src={user.avatar}
                            alt={user.username}
                            className="h-20 w-20 rounded-full object-cover ring-2 ring-gray-200 dark:ring-gray-700"
                          />
                        ) : (
                          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-500 ring-2 ring-gray-200 dark:ring-gray-700">
                            <span className="text-2xl font-bold text-white">
                              {user.username?.[0]?.toUpperCase() || "?"}
                            </span>
                          </div>
                        )}
                      </button>

                      {/* User Info */}
                      <button
                        onClick={() => handleUserClick(user.userId)}
                        className="mb-1 text-center transition-colors hover:text-blue-500"
                      >
                        <p className="font-semibold text-gray-900 dark:text-white">
                          {user.username}
                        </p>
                      </button>
                      <p className="mb-3 text-sm text-gray-600 dark:text-gray-400">{user.email}</p>

                      {/* Follow Button */}
                      <button
                        onClick={() => handleFollowClick(user._id, currentFollowState)}
                        disabled={followMutation.isPending}
                        className={`flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2 font-semibold transition-all disabled:cursor-not-allowed disabled:opacity-50 ${
                          currentFollowState
                            ? "border border-gray-300 bg-white text-gray-900 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700"
                            : "bg-blue-500 text-white hover:bg-blue-600"
                        }`}
                      >
                        <UserPlus size={18} />
                        {currentFollowState ? "Đang theo dõi" : "Theo dõi"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Load More Button */}
            {hasNextPage && (
              <div className="mt-8 text-center">
                <button
                  onClick={() => fetchNextPage()}
                  disabled={isFetchingNextPage}
                  className="rounded-lg bg-gray-100 px-6 py-3 font-semibold text-gray-900 transition-colors hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700"
                >
                  {isFetchingNextPage ? "Đang tải..." : "Xem thêm"}
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="py-16 text-center">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
              <Users size={40} className="text-gray-400" />
            </div>
            <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
              Không tìm thấy người dùng
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {searchQuery ? "Thử tìm kiếm với từ khóa khác" : "Chưa có gợi ý người dùng nào"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExplorePeople;
