import { useState, useEffect } from "react";

import { Lock, Plus } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";

import useAuth from "@/hooks/useAuth";
import { useCollections, useDeleteCollection } from "@/hooks/useCollection";
import { getSavedAudios } from "@/lib/api";

import CreateCollectionModal from "./CreateCollectionModal";
import EditCollectionModal from "./EditCollectionModal";

const CollectionsGrid = ({ onCollectionClick }) => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingCollection, setEditingCollection] = useState(null);
  const [showOptionsId, setShowOptionsId] = useState(null);
  const [audios, setAudios] = useState([]);
  const { data: collectionsResponse, isLoading, error } = useCollections();
  const deleteCollectionMutation = useDeleteCollection();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleClick = () => {
    const currentPath = location.pathname;
    const newPath = currentPath.endsWith('/')
      ? `${currentPath}audio`
      : `${currentPath}/audio`;

    // ✅ Truyền audios qua state
    navigate(newPath, { state: { audios } });
  };



  useEffect(() => {
    const fetchSavedAudios = async () => {
      try {
        const res = await getSavedAudios();
        if (res.success)
          setAudios(res.data);
      } catch (error) {
        console.error("Error fetching saved audios:", error);
      }
    };

    fetchSavedAudios();
  }, []);

  const firstFour = audios.slice(0, 4);
  const collections = collectionsResponse?.data || [];

  const handleDeleteCollection = async (collectionId) => {
    if (
      window.confirm(
        "Are you sure you want to delete this collection? All saved posts will be moved to your general saved posts."
      )
    ) {
      try {
        await deleteCollectionMutation.mutateAsync(collectionId);
        setShowOptionsId(null);
      } catch (error) {
        // Error handled by hook
      }
    }
  };

  const handleEditCollection = (collection) => {
    setEditingCollection(collection);
    setShowOptionsId(null);
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <div
            key={index}
            className="aspect-square animate-pulse rounded-lg bg-gray-200 dark:bg-gray-700"
          />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-8 text-center">
        <p className="text-red-500 dark:text-red-400">Failed to load collections</p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
        {/* Create New Collection Card */}
        <button
          onClick={() => setShowCreateModal(true)}
          className="group flex aspect-square flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 transition-colors hover:border-blue-500 hover:bg-blue-50 dark:border-gray-600 dark:hover:bg-blue-900/20"
        >
          <Plus className="mb-2 h-8 w-8 text-gray-400 group-hover:text-blue-500" />
          <span className="text-sm font-medium text-gray-600 group-hover:text-blue-500 dark:text-gray-400">
            Bộ sưu tập mới
          </span>
        </button>

        <div className="relative">
          <button
            onClick={handleClick}
            className="relative aspect-square w-full overflow-hidden rounded-lg bg-gray-100 transition hover:opacity-90 dark:bg-gray-800"
          >
            {/* ✅ Ảnh đại diện album */}
            {audios.length > 0 && (audios[0].cover || audios[0].fileUrl) ? (
              <img
                src={audios[0].cover || audios[0].fileUrl}
                alt={audios[0].title}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600">
                <span className="text-3xl font-bold text-white">A</span>
              </div>
            )}

            {/* ✅ Overlay gradient và text */}
            <div className="absolute inset-0 flex items-end bg-gradient-to-t from-black/60 to-transparent">
              <div className="w-full p-3 text-white">
                <h3 className="text-base font-semibold">Âm thanh</h3>
                <p className="text-xs opacity-90">{audios.length} bài</p>
              </div>
            </div>
          </button>
        </div>


        {/* Collection Cards */}
        {collections.map((collection) => (
          <div key={collection._id} className="relative">
            <button
              onClick={() => onCollectionClick?.(collection)}
              className="relative aspect-square w-full overflow-hidden rounded-lg bg-gray-100 transition hover:opacity-90 dark:bg-gray-800"
            >
              {/* Background gradient + chữ cái đầu */}
              {collection.coverImage ? (
                collection.coverImage.endsWith(".mp4") ? (
                  <video
                    src={collection.coverImage}
                   className="h-full w-full object-cover"
                    
                    
                  />
                ) : (
                  <img
                    src={collection.coverImage}
                    alt={collection.name}
                    className="h-full w-full object-cover"
                  />
                )
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600">
                  <span className="text-2xl font-bold text-white">
                    {collection.name.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}

              {/* Info luôn hiển thị */}
              <div className="absolute inset-0 flex items-end bg-black/40">
                <div className="w-full p-3 text-white">
                  <div className="flex items-center justify-between">
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate font-medium">{collection.name}</h3>
                      <p className="text-xs opacity-90">{collection.postCount} bài</p>
                    </div>
                    {collection.isPrivate && <Lock className="ml-2 h-4 w-4 flex-shrink-0" />}
                  </div>
                </div>
              </div>
            </button>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {/* {collections.length === 0 && (
        <div className="py-12 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
            <Plus className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="mb-2 text-lg font-medium text-gray-900 dark:text-white">
            No collections yet
          </h3>
          <p className="mb-4 text-gray-500 dark:text-gray-400">
            Create your first collection to organize your saved posts
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="rounded-lg bg-blue-600 px-4 py-2 font-medium text-white transition-colors hover:bg-blue-700"
          >
            Create Collection
          </button>
        </div>
      )} */}

      {/* Modals */}
      <CreateCollectionModal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} />

      {editingCollection && (
        <EditCollectionModal
          isOpen={!!editingCollection}
          collection={editingCollection}
          onClose={() => setEditingCollection(null)}
        />
      )}

      {/* Click outside to close options */}
      {showOptionsId && (
        <div className="fixed inset-0 z-5" onClick={() => setShowOptionsId(null)} />
      )}
    </>
  );
};

export default CollectionsGrid;
