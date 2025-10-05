import { useState } from "react";

import { Check, X } from "lucide-react";

import { useAllUserStories, useCreateHighlight } from "@/hooks/useStory";

const CreateHighlightModal = ({ isOpen, onClose }) => {
  const [selectedStories, setSelectedStories] = useState([]);
  const [highlightTitle, setHighlightTitle] = useState("");

  const createHighlightMutation = useCreateHighlight();
  const { data: allUserStories = [], isLoading } = useAllUserStories();

  // Get all user's expired stories for highlights
  const expiredStories = allUserStories.filter((story) => new Date(story.expiresAt) < new Date());

  const handleStoryToggle = (story) => {
    setSelectedStories((prev) => {
      const exists = prev.find((s) => s._id === story._id);
      if (exists) {
        return prev.filter((s) => s._id !== story._id);
      }
      return [...prev, story];
    });
  };

  const handleCreateHighlight = async () => {
    if (!highlightTitle.trim() || selectedStories.length === 0) return;

    try {
      await createHighlightMutation.mutateAsync({
        title: highlightTitle,
        storyIds: selectedStories.map((s) => s._id),
      });

      // Reset form
      setHighlightTitle("");
      setSelectedStories([]);
      onClose();
    } catch (error) {
      // Error is handled by the hook
      console.error("Failed to create highlight:", error);
    }
  };

  const handleClose = () => {
    setHighlightTitle("");
    setSelectedStories([]);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="max-h-[90vh] w-full max-w-md overflow-hidden rounded-2xl bg-white dark:bg-gray-900">
          {/* Header */}
          <div className="flex items-center justify-between border-b p-4 dark:border-gray-700">
            <h2 className="text-lg font-semibold dark:text-white">Tạo nổi bật mới</h2>
            <button
              onClick={handleClose}
              className="rounded-full p-2 hover:bg-gray-100 dark:hover:bg-gray-800"
              disabled={createHighlightMutation.isPending}
            >
              <X size={20} className="text-gray-600 dark:text-gray-400" />
            </button>
          </div>

          <div className="max-h-[calc(90vh-140px)] overflow-y-auto">
            {/* Title Input */}
            <div className="border-b p-4 dark:border-gray-700">
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Tiêu đề nổi bật
              </label>
              <input
                type="text"
                value={highlightTitle}
                onChange={(e) => setHighlightTitle(e.target.value)}
                placeholder="Ví dụ: Du lịch, Ăn uống, Workout..."
                className="w-full rounded-lg border border-gray-300 bg-white p-3 text-gray-900 placeholder-gray-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder-gray-400"
                maxLength={50}
              />
              <div className="mt-1 text-xs text-gray-500">{highlightTitle.length}/50</div>
            </div>

            {/* Story Selection */}
            <div className="space-y-3 p-4">
              {isLoading ? (
                <div className="py-8 text-center">
                  <div className="mx-auto h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600"></div>
                  <p className="mt-2 text-sm text-gray-500">Đang tải stories...</p>
                </div>
              ) : expiredStories.length === 0 ? (
                <div className="py-8 text-center">
                  <p className="text-gray-500 dark:text-gray-400">
                    Không có tin nào để tạo nổi bật
                  </p>
                  <p className="mt-1 text-sm text-gray-400 dark:text-gray-500">
                    Tin hết hạn sẽ xuất hiện ở đây để tạo nổi bật
                  </p>
                </div>
              ) : (
                expiredStories.map((story) => {
                  const isSelected = selectedStories.find((s) => s._id === story._id);
                  return (
                    <button
                      key={story._id}
                      onClick={() => handleStoryToggle(story)}
                      className={`flex w-full items-center space-x-3 rounded-lg border-2 p-3 transition-all ${
                        isSelected
                          ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                          : "border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600"
                      }`}
                    >
                      <div className="relative flex-shrink-0">
                        <div className="h-12 w-12 overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-800">
                          {story.mediaType === "video" ? (
                            <video
                              src={story.mediaUrl}
                              className="h-full w-full object-cover"
                              muted
                            />
                          ) : (
                            <img
                              src={story.mediaUrl}
                              alt=""
                              className="h-full w-full object-cover"
                            />
                          )}
                        </div>
                        {isSelected && (
                          <div className="absolute -top-1 -right-1 rounded-full bg-blue-500 p-1 text-white">
                            <Check size={12} />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 text-left">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {story.caption || "Không có chú thích"}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {new Date(story.createdAt).toLocaleDateString("vi-VN", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                          })}
                        </p>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between border-t p-4 dark:border-gray-700">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {selectedStories.length > 0 && `${selectedStories.length} story đã chọn`}
            </div>

            <div className="flex space-x-3">
              <button
                onClick={handleClose}
                className="rounded-lg border border-gray-300 px-4 py-2 text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
                disabled={createHighlightMutation.isPending}
              >
                Hủy
              </button>
              <button
                onClick={handleCreateHighlight}
                disabled={
                  createHighlightMutation.isPending ||
                  !highlightTitle.trim() ||
                  selectedStories.length === 0
                }
                className="flex items-center space-x-2 rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {createHighlightMutation.isPending ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    <span>Đang tạo...</span>
                  </>
                ) : (
                  <span>Tạo nổi bật</span>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateHighlightModal;
