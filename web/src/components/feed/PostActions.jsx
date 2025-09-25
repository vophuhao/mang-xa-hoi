import { useState } from "react";

import { Bookmark, Heart, MessageCircle, Send } from "lucide-react";

import { usePostActions } from "@/hooks/usePost";

const PostActions = ({ post, onCommentClick, onShareClick }) => {
  const [isLiked, setIsLiked] = useState(post?.isLiked || false);
  const [isSaved, setIsSaved] = useState(post?.isSaved || false);
  const [likeCount, setLikeCount] = useState(post?.likeCount || 0);

  const { likePost, isLiking } = usePostActions();

  const handleLike = () => {
    if (isLiking) return;

    // Optimistic update
    setIsLiked(!isLiked);
    setLikeCount((prev) => (isLiked ? prev - 1 : prev + 1));

    // API call
    likePost(post._id);
  };

  const handleSave = () => {
    setIsSaved(!isSaved);
    // TODO: Implement save post API call
  };

  return (
    <>
      {/* Action Buttons */}
      <div className="flex items-center justify-between pb-2">
        <div className="flex items-center space-x-4">
          {/* Like Button */}
          <button
            onClick={handleLike}
            disabled={isLiking}
            className="transition-colors duration-200"
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
            className="text-gray-900 hover:text-gray-600 dark:text-gray-300 dark:hover:text-gray-100"
          >
            <MessageCircle size={24} />
          </button>

          {/* Share Button */}
          <button
            onClick={onShareClick}
            className="text-gray-900 hover:text-gray-600 dark:text-gray-300 dark:hover:text-gray-100"
          >
            <Send size={24} />
          </button>
        </div>

        {/* Save Button */}
        <button
          onClick={handleSave}
          className="text-gray-900 hover:text-gray-600 dark:text-gray-300 dark:hover:text-gray-100"
        >
          <Bookmark size={24} className={isSaved ? "fill-current" : ""} />
        </button>
      </div>

      {/* Like Count */}
      {likeCount > 0 && (
        <span className="text-sm font-semibold text-gray-900 dark:text-white">
          {likeCount.toLocaleString()} lượt thích
        </span>
      )}
    </>
  );
};

export default PostActions;
