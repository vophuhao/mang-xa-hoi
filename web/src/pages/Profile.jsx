import { useCallback, useEffect, useState } from "react";

import { useQueryClient } from "@tanstack/react-query";
// Removed unused imports
import { useLocation, useNavigate, useParams } from "react-router-dom";

import CollectionsGrid from "@/components/collection/CollectionsGrid";
import PostModal from "@/components/feed/PostModal";
import ProfileGrid from "@/components/profile/ProfileGrid";
import ProfileHeader from "@/components/profile/ProfileHeader";
import ProfileStoryHighlights from "@/components/profile/ProfileStoryHighlights";
import ProfileTabs from "@/components/profile/ProfileTabs";
import { useFollowActions } from "@/hooks/useFollow";
import { useHighlights, useStoriesByUsername, useUserStories } from "@/hooks/useStory";
import { useCurrentUser, useUserPosts, useUserProfile, useUserTaggedPosts } from "@/hooks/useUser";

import EditProfile from "./EditProfile";

const Profile = () => {
  const { username } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [selectedPost, setSelectedPost] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  // Determine active tab from URL
  const getActiveTabFromPath = useCallback(() => {
    const path = location.pathname;
    if (path.endsWith("/saved")) return "saved";
    if (path.endsWith("/tagged")) return "tagged";
    return "posts";
  }, [location.pathname]);

  const [activeTab, setActiveTab] = useState(() => getActiveTabFromPath());

  // Update active tab when URL changes
  useEffect(() => {
    setActiveTab(getActiveTabFromPath());
  }, [location.pathname, getActiveTabFromPath]);

  // Hooks
  const queryClient = useQueryClient();
  const { data: currentUser } = useCurrentUser();
  const {
    data: profileData,
    isLoading: profileLoading,
    error: profileError,
  } = useUserProfile(username);
  const {
    data: postsData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: postsLoading,
  } = useUserPosts(username);
  const {
    data: taggedPostsData,
    fetchNextPage: fetchNextTaggedPage,
    hasNextPage: hasNextTaggedPage,
    isFetchingNextPage: isFetchingNextTaggedPage,
    isLoading: taggedPostsLoading,
  } = useUserTaggedPosts(username);
  const { followUser, unfollowUser } = useFollowActions();

  // Story hooks
  const { data: highlights } = useHighlights(username);
  const { data: userStoriesData } = useStoriesByUsername(username);
  const { data: myStoriesData } = useUserStories(); // For own profile highlights creation

  // Flatten posts from pages
  const posts = postsData?.pages?.flatMap((page) => page.data) || [];
  const taggedPosts = taggedPostsData?.pages?.flatMap((page) => page.data) || [];

  // Check if this is current user's profile
  const isOwnProfile = currentUser?.data?._id === profileData?.data?._id;

  // Check if current user follows this profile
  const isUserFollowing = profileData?.data?.isFollowing || false;

  const handlePostClick = (post) => {
    // Inject user data into post object for PostModal
    const postWithUser = {
      ...post,
      user: {
        _id: user._id,
        username: user.username,
        userId: user.userId,
        avatarUrl: user.avatarUrl,
        isVerified: user.isVerified,
      },
    };
    setSelectedPost(postWithUser);
  };

  const handleCloseModal = () => {
    setSelectedPost(null);
  };

  const handleUsernameClick = (username) => {
    navigate(`/${username}`);
  };

  const handleEditProfile = () => setIsEditing(true);
  const handleCancelEdit = () => setIsEditing(false);

  const handleFollow = async () => {
    if (profileData?.data?._id) {
      // Optimistic update
      queryClient.setQueryData(["user", "profile", username], (old) => {
        if (old?.data) {
          return {
            ...old,
            data: {
              ...old.data,
              isFollowing: true,
              followersCount: (old.data.followersCount || 0) + 1,
            },
          };
        }
        return old;
      });

      try {
        await followUser(profileData.data._id);
      } catch (error) {
        // Revert on error
        queryClient.setQueryData(["user", "profile", username], (old) => {
          if (old?.data) {
            return {
              ...old,
              data: {
                ...old.data,
                isFollowing: false,
                followersCount: Math.max((old.data.followersCount || 1) - 1, 0),
              },
            };
          }
          return old;
        });
        console.error("Error following user:", error);
      }
    }
  };

  const handleUnfollow = async () => {
    if (profileData?.data?._id) {
      // Optimistic update
      queryClient.setQueryData(["user", "profile", username], (old) => {
        if (old?.data) {
          return {
            ...old,
            data: {
              ...old.data,
              isFollowing: false,
              followersCount: Math.max((old.data.followersCount || 1) - 1, 0),
            },
          };
        }
        return old;
      });

      try {
        await unfollowUser(profileData.data._id);
      } catch (error) {
        // Revert on error
        queryClient.setQueryData(["user", "profile", username], (old) => {
          if (old?.data) {
            return {
              ...old,
              data: {
                ...old.data,
                isFollowing: true,
                followersCount: (old.data.followersCount || 0) + 1,
              },
            };
          }
          return old;
        });
        console.error("Error unfollowing user:", error);
      }
    }
  };

  const handleLoadMore = () => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  };

  const handleLoadMoreTagged = () => {
    if (hasNextTaggedPage && !isFetchingNextTaggedPage) {
      fetchNextTaggedPage();
    }
  };

  // Loading state
  if (profileLoading) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900">
        <div className="mx-auto max-w-4xl px-4 py-6">
          {/* Header Skeleton */}
          <div className="flex items-start space-x-6 md:space-x-8">
            <div className="h-20 w-20 animate-pulse rounded-full bg-gray-200 md:h-32 md:w-32 dark:bg-gray-700" />
            <div className="min-w-0 flex-1 space-y-4">
              <div className="h-6 w-40 animate-pulse bg-gray-200 dark:bg-gray-700" />
              <div className="flex space-x-4">
                <div className="h-8 w-24 animate-pulse bg-gray-200 dark:bg-gray-700" />
                <div className="h-8 w-24 animate-pulse bg-gray-200 dark:bg-gray-700" />
              </div>
              <div className="space-y-2">
                <div className="h-4 w-32 animate-pulse bg-gray-200 dark:bg-gray-700" />
                <div className="h-4 w-48 animate-pulse bg-gray-200 dark:bg-gray-700" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (profileError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white dark:bg-gray-900">
        <div className="text-center">
          <h2 className="mb-2 text-2xl font-semibold text-gray-900 dark:text-white">
            Không tìm thấy trang
          </h2>
          <p className="text-gray-600 dark:text-gray-400">Trang bạn đang tìm kiếm không tồn tại.</p>
        </div>
      </div>
    );
  }

  const user = profileData?.data;

  const handleViewHighlight = (highlight) => {
    // TODO: Implement view highlight functionality
    console.log("View highlight:", highlight);
  };

  if (isEditing) {
    return <EditProfile onCancel={handleCancelEdit} />;
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* Profile Header */}
      <ProfileHeader
        user={user}
        isOwnProfile={isOwnProfile}
        onEditProfile={handleEditProfile}
        onFollow={handleFollow}
        onUnfollow={handleUnfollow}
        isFollowing={isUserFollowing}
      />

      {/* Story Highlights */}
      <ProfileStoryHighlights
        highlights={highlights || []}
        userStories={isOwnProfile ? myStoriesData : userStoriesData}
        isOwnProfile={isOwnProfile}
        onViewHighlight={handleViewHighlight}
        currentUserId={currentUser?.data?._id}
      />

      {/* Profile Tabs */}
      <ProfileTabs activeTab={activeTab} isOwnProfile={isOwnProfile} />

      {/* Profile Content */}
      <div className="min-h-[400px]">
        {activeTab === "posts" && (
          <ProfileGrid
            posts={posts}
            onPostClick={handlePostClick}
            isLoading={postsLoading}
            hasNextPage={hasNextPage}
            onLoadMore={handleLoadMore}
            isOwnProfile={isOwnProfile}
            type="posts"
          />
        )}

        {activeTab === "saved" && isOwnProfile && (
          <div className="mx-auto max-w-4xl px-4 py-6">
            <CollectionsGrid
              onCollectionClick={(collection) => {
                // Navigate to collection detail view
                navigate(`/${username}/saved/collections/${collection._id}`);
              }}
            />
          </div>
        )}

        {activeTab === "tagged" && (
          <>
            {taggedPosts.length > 0 ? (
              <ProfileGrid
                posts={taggedPosts}
                onPostClick={handlePostClick}
                isLoading={taggedPostsLoading}
                hasNextPage={hasNextTaggedPage}
                onLoadMore={handleLoadMoreTagged}
                isOwnProfile={isOwnProfile}
                type="tagged"
              />
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="mb-4 rounded-full border-2 border-gray-900 p-6 dark:border-white">
                  <div className="h-12 w-12 rounded-full border-2 border-gray-900 dark:border-white" />
                </div>
                <h3 className="mb-2 text-2xl font-light text-gray-900 dark:text-white">
                  Ảnh có gắn thẻ bạn
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {isOwnProfile
                    ? "Khi có ai đó gắn thẻ bạn trong ảnh, ảnh đó sẽ xuất hiện ở đây."
                    : "Khi có ai đó gắn thẻ người này trong ảnh, ảnh đó sẽ xuất hiện ở đây."}
                </p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Post Modal */}
      {selectedPost && (
        <PostModal
          post={selectedPost}
          isOpen={!!selectedPost}
          onClose={handleCloseModal}
          onUsernameClick={handleUsernameClick}
          hideActions={["save"]} // Hide save button in profile view
        />
      )}
    </div>
  );
};

export default Profile;
