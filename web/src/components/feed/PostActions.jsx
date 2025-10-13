import { useEffect, useState } from "react";

import { useQueryClient } from "@tanstack/react-query";
import { Bookmark, Heart, MessageCircle, Send } from "lucide-react";
import { toast } from "react-toastify";

import SaveToCollectionModal from "@/components/collection/SaveToCollectionModal";
import { usePostActions } from "@/hooks/usePost";
import { unsavePost } from "@/lib/api";

const PostActions = ({ post, onCommentClick, onShareClick, hideActions = [] }) => {
  const [isLiked, setIsLiked] = useState(post?.isLiked || false);
  const [isSaved, setIsSaved] = useState(post?.isSaved || false);
  const [likeCount, setLikeCount] = useState(post?.likeCount || 0);
  const [showSaveModal, setShowSaveModal] = useState(false);

  const { likePost, isLiking } = usePostActions();
  const queryClient = useQueryClient();

  // Sync with props when post changes
  useEffect(() => {
    setIsLiked(post?.isLiked || false);
    setIsSaved(post?.isSaved || false);
    setLikeCount(post?.likeCount || 0);
  }, [post?.isLiked, post?.isSaved, post?.likeCount]);

  // Add effect to sync local state when mutations complete
  useEffect(() => {
    const timeout = setTimeout(() => {
      // Refresh queries after mutations to ensure sync
      if (showSaveModal === false) {
        queryClient.invalidateQueries({ queryKey: ["posts"] });
      }
    }, 100);

    return () => clearTimeout(timeout);
  }, [showSaveModal, queryClient]);

  const handleLike = () => {
    if (isLiking) return;

    // Optimistic update
    setIsLiked(!isLiked);
    setLikeCount((prev) => (isLiked ? prev - 1 : prev + 1));

    // API call
    likePost(post._id);
  };

  const handleSave = async () => {
    // If already saved, unsave
    if (isSaved) {
      try {
        setIsSaved(false); // Optimistic update
        await unsavePost(post._id);

        // Invalidate saved posts queries to refresh UI
        queryClient.invalidateQueries({ queryKey: ["savedPosts"] });
        queryClient.invalidateQueries({ queryKey: ["collections"] });
        // Invalidate posts queries to update isSaved status
        queryClient.invalidateQueries({ queryKey: ["posts"] });

        toast.success("Đã bỏ lưu bài viết");
      } catch (error) {
        console.error("Error unsaving post:", error);
        setIsSaved(true); // Revert on error
        // API client transforms error to { status, ...data } format
        toast.error(error?.message || "Không thể bỏ lưu bài viết");
      }
    } else {
      // Show collection selection modal
      setShowSaveModal(true);
    }
  };

  const handleSaveSuccess = () => {
    setShowSaveModal(false);
    setIsSaved(true);
    // Invalidate queries to refresh UI
    queryClient.invalidateQueries({ queryKey: ["savedPosts"] });
    queryClient.invalidateQueries({ queryKey: ["collections"] });
    queryClient.invalidateQueries({ queryKey: ["posts"] });
  };

  const handleSaveClose = () => {
    setShowSaveModal(false);
    // Don't automatically set isSaved to true - let the actual API state determine this
  };

  return (
    <>
      {/* Action Buttons */}
      <div className="flex items-center justify-between pb-2">
        <div className="flex items-center space-x-4">
          {/* Like Button */}
          <button
            onClick={handleLike}
            disabled={post.likesHidden}
            className="transition-colors duration-200 cursor-pointer"
          >
            <Heart
              size={24}
              className={`${
                isLiked
                  ? "fill-red-500 text-red-500"
                  : "text-gray-900 hover:text-gray-600 dark:text-gray-300 dark:hover:text-gray-100"
              }`}
            />
          </button>

          {/* Comment Button */}
          <button
            onClick={onCommentClick}
            className="cursor-pointer text-gray-900 hover:text-gray-600 dark:text-gray-300 dark:hover:text-gray-100"
          >
            <MessageCircle size={24} />
          </button>

          {/* Share Button */}
          <button
            onClick={onShareClick}
            className="cursor-pointer text-gray-900 hover:text-gray-600 dark:text-gray-300 dark:hover:text-gray-100"
          >
            <Send size={24} />
          </button>
        </div>

        {/* Save Button */}
        {!hideActions.includes("save") && (
          <button
            onClick={handleSave}
            className="text-gray-900 hover:text-gray-600 dark:text-gray-300 dark:hover:text-gray-100"
          >
            <Bookmark size={24} className={isSaved ? "fill-current" : ""} />
          </button>
        )}
      </div>

      {/* Like Count */}
      {likeCount > 0 && (
        <span className="text-sm font-semibold text-gray-900 dark:text-white">
          {likeCount.toLocaleString()} lượt thích
        </span>
      )}

      {/* Save to Collection Modal */}
      <SaveToCollectionModal
        isOpen={showSaveModal}
        postId={post?._id}
        onClose={handleSaveClose}
        onSuccess={handleSaveSuccess}
      />
    </>
  );
};

export default PostActions;
