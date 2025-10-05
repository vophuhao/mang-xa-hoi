import { useEffect } from "react";

import { Eye, Heart, X } from "lucide-react";

import { useStoryLikes, useStoryViewers } from "@/hooks/useStory";

const StoryLikesModal = ({ isOpen, onClose, storyId, currentStory }) => {
  const { data: likes, isLoading: likesLoading } = useStoryLikes(storyId, isOpen);
  const { data: viewers, isLoading: viewersLoading } = useStoryViewers(storyId);

  // Close modal on escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      return () => document.removeEventListener("keydown", handleEscape);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4"
      onClick={(e) => {
        // Close modal when clicking on backdrop
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      {/* Modal */}
      <div className="animate-in fade-in-0 zoom-in-95 max-h-[80vh] w-full max-w-md rounded-xl bg-white shadow-2xl duration-300">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 p-4">
          <h2 className="text-lg font-semibold text-gray-900">Chi tiết Story</h2>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="max-h-96 overflow-y-auto">
          {/* Story Stats */}
          <div className="border-b border-gray-200 p-4">
            <div className="flex items-center justify-center text-center">
              <div className="flex flex-col items-center">
                <div className="flex items-center space-x-1 text-2xl font-bold text-gray-900">
                  <Eye size={20} className="text-blue-500" />
                  <span>{currentStory?.viewCount || 0}</span>
                </div>
                <span className="text-sm text-gray-500">Lượt xem</span>
              </div>
              {/* Only show likes count if there are likes */}
              {currentStory?.likeCount > 0 && (
                <>
                  <div className="mx-6 h-8 w-px bg-gray-300"></div>
                  <div className="flex flex-col items-center">
                    <div className="flex items-center space-x-1 text-2xl font-bold text-gray-900">
                      <Heart size={20} className="text-red-500" />
                      <span>{currentStory?.likeCount}</span>
                    </div>
                    <span className="text-sm text-gray-500">Lượt thích</span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Main List Section - Always show viewers */}
          <div className="p-4">
            <h3 className="mb-3 flex items-center text-sm font-semibold text-gray-900">
              <Eye size={16} className="mr-2 text-blue-500" />
              Người đã xem ({currentStory?.viewCount || 0})
            </h3>

            {viewersLoading || likesLoading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex items-center space-x-3">
                    <div className="h-10 w-10 animate-pulse rounded-full bg-gray-200" />
                    <div className="flex-1">
                      <div className="h-4 w-24 animate-pulse rounded bg-gray-200" />
                      <div className="mt-1 h-3 w-16 animate-pulse rounded bg-gray-200" />
                    </div>
                  </div>
                ))}
              </div>
            ) : viewers?.viewers?.length > 0 ? (
              <div className="space-y-3">
                {viewers.viewers.map((viewer) => {
                  // Check if this viewer also liked the story
                  const hasLiked = likes?.likes?.some(
                    (like) =>
                      like.user?._id === viewer.user?._id ||
                      like.user?.username === viewer.user?.username
                  );

                  return (
                    <div key={viewer._id} className="flex items-center space-x-3">
                      <img
                        src={viewer.user?.avatarUrl || "/default-avatar.png"}
                        alt={viewer.user?.username}
                        className="h-10 w-10 rounded-full border border-gray-200"
                      />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">
                          {viewer.user?.displayName || viewer.user?.username}
                        </p>
                        <p className="text-xs text-gray-500">@{viewer.user?.username}</p>
                      </div>
                      {/* Show heart icon if this viewer also liked */}
                      {hasLiked && (
                        <div className="text-red-500">
                          <Heart size={16} fill="currentColor" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="py-8 text-center text-sm text-gray-500">Chưa có ai xem story này</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StoryLikesModal;
