import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";

const PostTimestamp = ({ createdAt }) => {
  if (!createdAt) return null;

  const timeAgo = formatDistanceToNow(new Date(createdAt), {
    addSuffix: false,
    locale: vi,
  });

  return (
    <div className="pb-4">
      <time className="text-xs text-gray-400 uppercase dark:text-gray-500">
        {timeAgo}
      </time>
    </div>
  );
};

export default PostTimestamp;
