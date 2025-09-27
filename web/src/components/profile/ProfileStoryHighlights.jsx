import { Plus } from "lucide-react";

const ProfileStoryHighlights = ({
  highlights = [],
  isOwnProfile,
  onAddHighlight,
  onViewHighlight,
}) => {
  if (!highlights.length && !isOwnProfile) {
    return null;
  }

  return (
    <div className="border-t border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
      <div className="mx-auto max-w-4xl">
        <div className="scrollbar-hide flex space-x-6 overflow-x-auto pb-2">
          {/* Existing Highlights */}
          {highlights.map((highlight, index) => (
            <button
              key={highlight.id || index}
              onClick={() => onViewHighlight?.(highlight)}
              className="group flex flex-shrink-0 flex-col items-center space-y-2"
            >
              <div className="relative">
                <div className="h-16 w-16 overflow-hidden rounded-full ring-2 ring-gray-200 transition-all group-hover:ring-gray-300 dark:ring-gray-700 dark:group-hover:ring-gray-600">
                  <img
                    src={highlight.thumbnail}
                    alt={highlight.title}
                    className="h-full w-full object-cover transition-transform group-hover:scale-105"
                  />
                </div>
              </div>
              <span className="max-w-16 truncate text-xs font-medium text-gray-900 dark:text-white">
                {highlight.title}
              </span>
            </button>
          ))}

          {/* Add New Highlight - Only for own profile */}
          {isOwnProfile && (
            <button
              onClick={onAddHighlight}
              className="group flex flex-shrink-0 flex-col items-center space-y-2"
            >
              <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-dashed border-gray-300 transition-all group-hover:border-gray-400 dark:border-gray-600 dark:group-hover:border-gray-500">
                <Plus className="h-6 w-6 text-gray-400 group-hover:text-gray-500 dark:text-gray-500 dark:group-hover:text-gray-400" />
              </div>
              <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Mới</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfileStoryHighlights;
