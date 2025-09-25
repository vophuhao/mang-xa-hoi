import { useState } from "react";

import { Send, Smile } from "lucide-react";

import { useCommentActions } from "@/hooks/useComment";

const CommentInput = ({ postId, placeholder = "Thêm bình luận..." }) => {
  const [content, setContent] = useState("");

  const { addComment, isAddingComment } = useCommentActions();

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!content.trim() || isAddingComment) return;

    addComment(
      { postId, content: content.trim() },
      {
        onSuccess: () => {
          setContent("");
        },
      }
    );
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="border-t border-gray-200 p-4 dark:border-gray-700">
      <form onSubmit={handleSubmit} className="flex items-center space-x-3">
        {/* Input Container */}
        <div className="relative flex-1">
          <div className="flex items-center">
            <input
              type="text"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              data-comment-input
              disabled={isAddingComment}
              className="flex-1 resize-none border-0 bg-transparent text-sm text-gray-900 placeholder-gray-500 outline-none dark:text-white dark:placeholder-gray-400"
              maxLength={2200}
            />

            {/* Emoji Button */}
            <button
              type="button"
              className="ml-2 p-1 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
              onClick={() => {
                // TODO: Implement emoji picker
                console.log("Show emoji picker");
              }}
            >
              <Smile size={20} />
            </button>
          </div>
        </div>

        {/* Send Button */}
        <button
          type="submit"
          disabled={!content.trim() || isAddingComment}
          className={`rounded-full p-2 transition-colors duration-200 ${
            content.trim() && !isAddingComment
              ? "text-blue-500 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-900/20"
              : "cursor-not-allowed text-gray-300 dark:text-gray-600"
          }`}
        >
          <Send size={20} />
        </button>
      </form>

      {/* Loading indicator */}
      {isAddingComment && (
        <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">Đang đăng bình luận...</div>
      )}
    </div>
  );
};

export default CommentInput;
