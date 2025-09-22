import { useEffect, useState } from "react";

import { useQueryClient } from "@tanstack/react-query";
import { useSelector } from "react-redux";

import FeedList from "@/components/feed/FeedList";
import RightSidebar from "@/components/feed/RightSidebar";
import Stories from "@/components/feed/Stories";
import { useFeedPosts } from "@/hooks/usePost";
import { USER_QUERY_KEYS, useUser } from "@/hooks/useUser";
import { isPanelMenu } from "@/store/slices/layoutSlice";

const Feed = () => {
  const { activeMenu, isMobile } = useSelector((state) => state.layout);
  const queryClient = useQueryClient();
  const currentUser = queryClient.getQueryData(USER_QUERY_KEYS.currentUser)?.data;

  const { suggestedUsers, isLoadingSuggestions, toggleFollow, isFollowActionLoading } = useUser();

  // Feed posts pagination state
  const [page, setPage] = useState(1);
  const [allPosts, setAllPosts] = useState([]);

  // Get feed posts
  const {
    data: feedData,
    isLoading: isLoadingPosts,
    error: feedError,
    isSuccess,
  } = useFeedPosts(page);

  // Handle feed data updates
  useEffect(() => {
    if (isSuccess && feedData?.data) {
      if (page === 1) {
        setAllPosts(feedData.data);
      } else {
        setAllPosts((prev) => [...prev, ...feedData.data]);
      }
    }
  }, [feedData, isSuccess, page]);

  const handleFollowClick = (userId, isFollowing) => {
    toggleFollow(userId, isFollowing);
  };

  const handleLoadMore = () => {
    if (feedData?.pagination?.hasNext) {
      setPage((prev) => prev + 1);
    }
  };

  const hasNextPage = feedData?.pagination?.hasNext || false;

  return (
    <div className="flex h-full overflow-hidden bg-gray-50 dark:bg-gray-900">
      {/* Main Feed Content */}
      <div className="scrollbar-hide flex-1 overflow-y-auto">
        {/* Stories Section */}
        <div className="mx-auto max-w-[530px]">
          <Stories stories={[]} />
        </div>

        <div className="mx-auto max-w-[420px] pt-4">
          {/* Feed Posts */}
          <FeedList
            posts={allPosts}
            isLoading={isLoadingPosts}
            error={feedError}
            onLoadMore={handleLoadMore}
            hasNextPage={hasNextPage}
          />
        </div>
      </div>

      {/* Right Sidebar - Desktop only and when user is logged in */}
      {!isMobile && !isPanelMenu(activeMenu) && currentUser && (
        <RightSidebar
          currentUser={currentUser}
          suggestedUsers={suggestedUsers}
          isLoadingSuggestions={isLoadingSuggestions}
          onFollowClick={handleFollowClick}
          isFollowActionLoading={isFollowActionLoading}
        />
      )}
    </div>
  );
};

export default Feed;
