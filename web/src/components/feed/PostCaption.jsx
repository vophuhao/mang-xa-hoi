import { useState } from "react";

const PostCaption = ({ user, caption, onTagClick, onUsernameClick }) => {
  const [showFullCaption, setShowFullCaption] = useState(false);

  if (!caption) return null;

  const MAX_LENGTH = 125;
  const shouldTruncate = caption.length > MAX_LENGTH;
  const displayCaption =
    shouldTruncate && !showFullCaption ? caption.substring(0, MAX_LENGTH) + "..." : caption;

  // Simple hashtag and mention detection
  const formatText = (text) => {
    return text.split(" ").map((word, index) => {
      if (word.startsWith("#")) {
        return (
          <span
            key={index}
            onClick={() => onTagClick?.(word.slice(1))}
            className="cursor-pointer font-medium text-blue-600 hover:underline dark:text-blue-400"
          >
            {word}{" "}
          </span>
        );
      } else if (word.startsWith("@")) {
        return (
          <span
            key={index}
            onClick={() => onUsernameClick?.(word.slice(1))}
            className="cursor-pointer font-medium text-blue-600 hover:underline dark:text-blue-400"
          >
            {word}{" "}
          </span>
        );
      }
      return word + " ";
    });
  };

  return (
    <div className="text-sm text-gray-900 dark:text-white">
      <span
        onClick={() => onUsernameClick?.(user.username)}
        className="cursor-pointer font-semibold hover:underline"
      >
        {user.username}
      </span>{" "}
      <span>{formatText(displayCaption)}</span>
      {shouldTruncate && !showFullCaption && (
        <button
          onClick={() => setShowFullCaption(true)}
          className="ml-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          thêm
        </button>
      )}
    </div>
  );
};

export default PostCaption;
