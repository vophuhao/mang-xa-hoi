import { useState } from "react";

import { ArrowLeft, Edit2, Grid3X3, Lock, MoreHorizontal, Trash2 } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";

import EditCollectionModal from "@/components/collection/EditCollectionModal";
import OptionsModal from "@/components/common/OptionsModal";
import PostModal from "@/components/feed/PostModal";
import {
  useCollection,
  useCollectionPosts,
  useDeleteCollection,
  useRemovePostFromCollection,
} from "@/hooks/useCollection";
import { useCurrentUser } from "@/hooks/useUser";

const CollectionDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [showEditModal, setShowEditModal] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [showPostOptions, setShowPostOptions] = useState(null); // Store post ID for options

  const { data: currentUser } = useCurrentUser();

  const { data: collectionResponse, isLoading: collectionLoading } = useCollection(id);
  const {
    data: postsResponse,
    isLoading: postsLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useCollectionPosts(id);

  const deleteCollectionMutation = useDeleteCollection();
  const removePostMutation = useRemovePostFromCollection();

  const collection = collectionResponse?.data;
  const posts = postsResponse?.pages?.flatMap((page) => page.data) || [];

  const handleBack = () => {
    // Navigate back to profile saved tab
    const username = currentUser?.data?.username;
    if (username) {
      navigate(`/${username}/saved`);
    } else {
      navigate(-1);
    }
  };

  const handleEditCollection = () => {
    setShowEditModal(true);
    setShowOptions(false);
  };

  const handleDeleteCollection = async () => {
    if (
      window.confirm(
        "Are you sure you want to delete this collection? All saved posts will be moved to your general saved posts."
      )
    ) {
      try {
        await deleteCollectionMutation.mutateAsync(id);
        const username = currentUser?.data?.username;
        if (username) {
          navigate(`/${username}/saved`);
        } else {
          navigate("/saved");
        }
      } catch (error) {
        // Error handled by hook
      }
    }
    setShowOptions(false);
  };

  const handlePostClick = (post) => {
    // Create post with user info for modal
    const postWithUser = {
      ...post,
      user: {
        _id: post.user._id || post.user,
        username: post.user.username,
        userId: post.user.userId,
        avatarUrl: post.user.avatarUrl,
        isVerified: post.user.isVerified,
      },
    };
    setSelectedPost(postWithUser);
  };

  const handleCloseModal = () => {
    setSelectedPost(null);
  };

  const handleUsernameClick = (username) => {
    navigate(`/${username}`);
    setSelectedPost(null);
  };

  const handleRemoveFromCollection = async () => {
    if (showPostOptions && id) {
      try {
        await removePostMutation.mutateAsync({
          collectionId: id,
          postId: showPostOptions,
        });
        setShowPostOptions(null);
      } catch (error) {
        // Error handled by hook
      }
    }
  };

  const handleLoadMore = () => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  };

  if (collectionLoading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-6">
        <div className="animate-pulse">
          <div className="mb-6 flex items-center space-x-4">
            <div className="h-8 w-8 rounded-full bg-gray-200 dark:bg-gray-700"></div>
            <div className="h-8 w-48 rounded bg-gray-200 dark:bg-gray-700"></div>
          </div>
          <div className="mb-8 h-4 w-32 rounded bg-gray-200 dark:bg-gray-700"></div>
          <div className="grid grid-cols-3 gap-1">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="aspect-square rounded bg-gray-200 dark:bg-gray-700"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!collection) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-6">
        <div className="py-12 text-center">
          <h2 className="mb-2 text-xl font-semibold text-gray-900 dark:text-white">
            Collection not found
          </h2>
          <p className="mb-4 text-gray-500 dark:text-gray-400">
            This collection may have been deleted or you don&apos;t have access to it.
          </p>
          <button
            onClick={handleBack}
            className="rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="mx-auto max-w-4xl px-4 py-6">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={handleBack}
              className="rounded-full p-2 transition-colors hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <ArrowLeft className="h-6 w-6 text-gray-600 dark:text-gray-400" />
            </button>

            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {collection.name}
                </h1>
                {collection.isPrivate && (
                  <Lock className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                )}
              </div>
              {collection.description && (
                <p className="mt-1 text-gray-600 dark:text-gray-400">{collection.description}</p>
              )}
            </div>
          </div>

          {/* Options Menu */}
          <div className="relative">
            <button
              onClick={() => setShowOptions(!showOptions)}
              className="rounded-full p-2 transition-colors hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <MoreHorizontal className="h-6 w-6 text-gray-600 dark:text-gray-400" />
            </button>

            {showOptions && (
              <div className="absolute top-10 right-0 z-10 min-w-[140px] rounded-lg border border-gray-200 bg-white py-1 shadow-lg dark:border-gray-700 dark:bg-gray-800">
                <button
                  onClick={handleEditCollection}
                  className="flex w-full items-center space-x-2 px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                >
                  <Edit2 className="h-4 w-4" />
                  <span>Sửa</span>
                </button>
                <button
                  onClick={handleDeleteCollection}
                  className="flex w-full items-center space-x-2 px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                  disabled={deleteCollectionMutation.isPending}
                >
                  <Trash2 className="h-4 w-4" />
                  <span>Xoá</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="mb-8 flex items-center space-x-6 text-sm text-gray-500 dark:text-gray-400">
          <div className="flex items-center space-x-1">
            <Grid3X3 className="h-4 w-4" />
            <span>{collection.postCount} bài</span>
          </div>
        </div>

        {/* Posts Grid */}
        {postsLoading ? (
          <div className="grid grid-cols-3 gap-1">
            {Array.from({ length: 12 }).map((_, i) => (
              <div
                key={i}
                className="aspect-square animate-pulse rounded bg-gray-200 dark:bg-gray-700"
              ></div>
            ))}
          </div>
        ) : posts.length > 0 ? (
          <>
            <div className="grid grid-cols-3 gap-1">
              {posts.map((post) => (
                <div key={post._id} className="group relative aspect-square">
                  <button
                    className="aspect-square w-full overflow-hidden rounded bg-gray-100 transition-opacity hover:opacity-90 dark:bg-gray-800"
                    onClick={() => handlePostClick(post)}
                  >
                    {post.mediaUrls && post.mediaUrls.length > 0 ? (
                      <img
                        src={post.mediaUrls[0]}
                        alt="Post"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800">
                        <Grid3X3 className="h-8 w-8 text-gray-400" />
                      </div>
                    )}
                  </button>

                  {/* Three-dot menu */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowPostOptions(post._id);
                    }}
                    className="absolute top-2 right-2 rounded-full bg-black/20 p-1 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-black/40"
                  >
                    <MoreHorizontal className="h-4 w-4 text-white" />
                  </button>
                </div>
              ))}
            </div>

            {/* Load More Button */}
            {hasNextPage && (
              <div className="mt-8 text-center">
                <button
                  onClick={handleLoadMore}
                  disabled={isFetchingNextPage}
                  className="rounded-lg bg-gray-100 px-6 py-2 text-gray-700 transition-colors hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                >
                  {isFetchingNextPage ? "Đang tải..." : "Tải thêm"}
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="py-12 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
              <Grid3X3 className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="mb-2 text-lg font-medium text-gray-900 dark:text-white">
              Không có bài viết nào
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              Thêm một số bài viết để xem chúng ở đây
            </p>
          </div>
        )}
      </div>

      {/* Edit Collection Modal */}
      {showEditModal && (
        <EditCollectionModal
          isOpen={showEditModal}
          collection={collection}
          onClose={() => setShowEditModal(false)}
        />
      )}

      {/* Post Modal */}
      {selectedPost && (
        <PostModal
          post={selectedPost}
          isOpen={!!selectedPost}
          onClose={handleCloseModal}
          onUsernameClick={handleUsernameClick}
          hideActions={["save"]} // Hide save button in collection detail
        />
      )}

      {/* Collection Post Options Modal */}
      <OptionsModal
        isOpen={!!showPostOptions}
        onClose={() => setShowPostOptions(null)}
        title="Tùy chọn bài viết"
        options={[
          {
            label: removePostMutation.isPending
              ? "Đang xóa..."
              : "Xóa bài viết khỏi bộ sưu tập này",
            onClick: handleRemoveFromCollection,
            danger: true,
          },
        ]}
      />

      {/* Click outside to close options */}
      {showOptions && <div className="fixed inset-0 z-5" onClick={() => setShowOptions(false)} />}
    </>
  );
};

export default CollectionDetail;
