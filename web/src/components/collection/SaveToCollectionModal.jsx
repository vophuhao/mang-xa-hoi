import { useState } from "react";

import { Folder, Lock, Plus, X } from "lucide-react";

import { useAddPostToCollection, useCollections } from "@/hooks/useCollection";

import CreateCollectionModal from "./CreateCollectionModal";

const SaveToCollectionModal = ({ isOpen, postId, onClose }) => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedCollectionId, setSelectedCollectionId] = useState(null);

  const { data: collectionsResponse, isLoading } = useCollections();
  const addPostToCollectionMutation = useAddPostToCollection();

  const collections = collectionsResponse?.data || [];

  const handleSaveToCollection = async (collectionId) => {
    if (!postId || !collectionId) return;

    try {
      await addPostToCollectionMutation.mutateAsync({
        collectionId,
        postId,
      });
      onClose();
    } catch (error) {
      // Error handled by hook
    }
  };

  const handleCreateNewCollection = () => {
    setShowCreateModal(true);
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="bg-opacity-50 fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
        <div className="flex max-h-[80vh] w-full max-w-md flex-col rounded-lg bg-white dark:bg-gray-800">
          {/* Header */}
          <div className="flex flex-shrink-0 items-center justify-between border-b border-gray-200 p-4 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Bộ sưu tập</h2>
            <button
              onClick={onClose}
              className="rounded-full p-1 transition-colors hover:bg-gray-100 dark:hover:bg-gray-700"
              disabled={addPostToCollectionMutation.isPending}
            >
              <X className="h-5 w-5 text-gray-500 dark:text-gray-400" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="space-y-3 p-4">
                {Array.from({ length: 5 }).map((_, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <div className="h-12 w-12 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-700" />
                    <div className="flex-1">
                      <div className="mb-2 h-4 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
                      <div className="h-3 w-2/3 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-2 p-4">
                {/* Create new collection option */}
                <button
                  onClick={handleCreateNewCollection}
                  className="flex w-full items-center space-x-3 rounded-lg p-3 text-left transition-colors hover:bg-gray-50 dark:hover:bg-gray-700"
                  disabled={addPostToCollectionMutation.isPending}
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900">
                    <Plus className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-gray-900 dark:text-white">Tạo mới</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      Bắt đầu một bộ sưu tập mới cho bài viết này
                    </div>
                  </div>
                </button>

                {/* Existing collections */}
                {collections.length > 0 && (
                  <div className="pt-2">
                    <div className="mb-2 px-1 text-sm font-medium text-gray-500 dark:text-gray-400">
                      Bộ sưu tập của bạn
                    </div>
                    {collections.map((collection) => (
                      <button
                        key={collection._id}
                        onClick={() => handleSaveToCollection(collection._id)}
                        disabled={addPostToCollectionMutation.isPending}
                        className="group flex w-full items-center space-x-3 rounded-lg p-3 text-left transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:hover:bg-gray-700"
                      >
                        <div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-700">
                          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-purple-500 to-pink-500">
                            <Folder className="h-6 w-6 text-white" />
                          </div>
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center space-x-2">
                            <span className="truncate font-medium text-gray-900 dark:text-white">
                              {collection.name}
                            </span>
                            {collection.isPrivate && (
                              <Lock className="h-3 w-3 flex-shrink-0 text-gray-500 dark:text-gray-400" />
                            )}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {collection.postCount} bài đăng
                          </div>
                        </div>

                        {addPostToCollectionMutation.isPending &&
                        selectedCollectionId === collection._id ? (
                          <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
                        ) : (
                          <div className="h-5 w-5 rounded-full border-2 border-gray-300 transition-colors group-hover:border-blue-500 dark:border-gray-600" />
                        )}
                      </button>
                    ))}
                  </div>
                )}

                {/* Empty state */}
                {collections.length === 0 && (
                  <div className="py-8 text-center">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
                      <Folder className="h-8 w-8 text-gray-400" />
                    </div>
                    <h3 className="mb-2 text-lg font-medium text-gray-900 dark:text-white">
                      Bạn chưa có bộ sưu tập nào
                    </h3>
                    <p className="mb-4 text-gray-500 dark:text-gray-400">
                      Tạo bộ sưu tập đầu tiên của bạn để tổ chức các bài viết đã lưu
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create Collection Modal */}
      <CreateCollectionModal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} />
    </>
  );
};

export default SaveToCollectionModal;
