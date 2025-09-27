import { useEffect, useRef, useState } from "react";

import { Send, Smile } from "lucide-react";

import { useCommentActions } from "@/hooks/useComment";

const EMOJI_CATEGORIES = {
  smileys: [
    "😀",
    "😃",
    "😄",
    "😁",
    "😆",
    "😅",
    "🤣",
    "😂",
    "🙂",
    "🙃",
    "😉",
    "😊",
    "😇",
    "🥰",
    "😍",
    "🤩",
    "😘",
    "😗",
    "😚",
    "😙",
    "🥲",
    "😋",
    "😛",
    "😜",
    "🤪",
    "😝",
    "🤑",
    "🤗",
    "🤭",
    "🤫",
    "🤔",
    "😏",
  ],
  hearts: ["❤️", "💙", "💔", "❣️", "💕", "♥️"],
  gestures: ["✌️", "🤞", "🤘", "☝️", "✊"],
  activities: ["⭐", "✨", "🥇", "🥈", "🥉", "🎖️", "🎗️"],
};

const POPULAR_EMOJIS = [
  ...EMOJI_CATEGORIES.smileys.slice(0, 16),
  ...EMOJI_CATEGORIES.hearts.slice(0, 8),
  ...EMOJI_CATEGORIES.gestures.slice(0, 12),
  ...EMOJI_CATEGORIES.activities.slice(0, 12),
];

const CommentInput = ({
  postId,
  placeholder = "Thêm bình luận...",
  parentId = null,
  initialContent = "",
  onReplyCancel = null,
}) => {
  const [content, setContent] = useState(initialContent);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [activeEmojiCategory, setActiveEmojiCategory] = useState("popular");
  const inputRef = useRef(null);
  const emojiPickerRef = useRef(null);

  const { addComment, isAddingComment } = useCommentActions();

  // Update content when initialContent changes (for reply)
  useEffect(() => {
    if (initialContent) {
      setContent(initialContent);
      // Focus input when replying
      if (inputRef.current) {
        inputRef.current.focus();
        inputRef.current.setSelectionRange(initialContent.length, initialContent.length);
      }
    }
  }, [initialContent]);

  // Close emoji picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        emojiPickerRef.current &&
        !emojiPickerRef.current.contains(event.target) &&
        !event.target.closest("[data-emoji-button]")
      ) {
        setShowEmojiPicker(false);
      }
    };

    if (showEmojiPicker) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showEmojiPicker]);

  const handleEmojiSelect = (emoji) => {
    const input = inputRef.current;
    if (input) {
      const start = input.selectionStart;
      const end = input.selectionEnd;
      const newContent = content.slice(0, start) + emoji + content.slice(end);
      setContent(newContent);

      // Set cursor position after emoji
      setTimeout(() => {
        input.focus();
        input.setSelectionRange(start + emoji.length, start + emoji.length);
      }, 0);
    }
    setShowEmojiPicker(false);
  };

  const toggleEmojiPicker = () => {
    setShowEmojiPicker(!showEmojiPicker);
    // Focus input when closing picker
    if (showEmojiPicker && inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!content.trim() || isAddingComment) return;

    addComment(
      { postId, content: content.trim(), parentId },
      {
        onSuccess: () => {
          setContent("");
          // Call onReplyCancel to clear reply state
          if (onReplyCancel) {
            onReplyCancel();
          }
        },
      }
    );
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    } else if (e.key === "Escape" && onReplyCancel) {
      // Cancel reply on Escape key
      onReplyCancel();
    }
  };

  return (
    <div className="border-t border-gray-200 p-2 dark:border-gray-700">
      {/* Reply indicator */}
      {parentId && (
        <div className="mb-2 flex items-center justify-between rounded-md bg-gray-50 px-3 py-2 dark:bg-gray-800">
          <span className="text-xs text-gray-600 dark:text-gray-400">
            Đang trả lời bình luận...
          </span>
          {onReplyCancel && (
            <button
              onClick={onReplyCancel}
              className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              Hủy
            </button>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex items-center space-x-3">
        {/* Input Container */}
        <div className="relative flex-1">
          <div className="flex items-center">
            <input
              ref={inputRef}
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
              data-emoji-button
              className={`ml-2 p-1 transition-colors ${
                showEmojiPicker
                  ? "text-blue-500 dark:text-blue-400"
                  : "text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
              }`}
              disabled={isAddingComment}
              onClick={toggleEmojiPicker}
            >
              <Smile size={20} />
            </button>
          </div>

          {/* Emoji Picker */}
          {showEmojiPicker && (
            <div
              ref={emojiPickerRef}
              className="animate-in slide-in-from-bottom-2 fade-in-0 absolute right-0 bottom-full z-50 mb-2 w-80 max-w-[90vw] rounded-2xl border border-gray-200 bg-white shadow-xl duration-200 sm:w-80 dark:border-gray-700 dark:bg-gray-800"
            >
              {/* Header */}
              <div className="border-b border-gray-100 p-3 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Emoji</h3>
                  <button
                    onClick={() => setShowEmojiPicker(false)}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* Category Tabs */}
              <div className="flex border-b border-gray-100 dark:border-gray-700">
                {[
                  { key: "popular", label: "🕐", title: "Gần đây" },
                  { key: "smileys", label: "😀", title: "Mặt cười" },
                  { key: "hearts", label: "❤️", title: "Trái tim" },
                  { key: "gestures", label: "👍", title: "Cử chỉ" },
                  { key: "activities", label: "🎉", title: "Hoạt động" },
                ].map((category) => (
                  <button
                    key={category.key}
                    onClick={() => setActiveEmojiCategory(category.key)}
                    className={`flex-1 p-2 text-center transition-colors ${
                      activeEmojiCategory === category.key
                        ? "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400"
                        : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    }`}
                    title={category.title}
                  >
                    <span className="text-lg">{category.label}</span>
                  </button>
                ))}
              </div>

              {/* Emoji Grid */}
              <div className="max-h-52 overflow-y-auto p-3">
                <div className="grid grid-cols-8 gap-1">
                  {(activeEmojiCategory === "popular"
                    ? POPULAR_EMOJIS
                    : EMOJI_CATEGORIES[activeEmojiCategory] || []
                  ).map((emoji, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => handleEmojiSelect(emoji)}
                      className="flex h-10 w-10 items-center justify-center rounded-lg text-xl transition-all hover:scale-110 hover:bg-gray-100 dark:hover:bg-gray-700"
                      title={emoji}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Loading overlay */}
          {isAddingComment && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/70 dark:bg-gray-900/70">
              <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-500 border-t-transparent"></div>
                <span>Đang gửi...</span>
              </div>
            </div>
          )}
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
    </div>
  );
};

export default CommentInput;
