import { Hash, X } from "lucide-react";

const HashtagSuggestions = ({ hashtags, onSelect, onRemove, selectedHashtags = [] }) => {
  if (!hashtags || hashtags.length === 0) return null;

  return (
    <div className="space-y-2">
      <div className="flex items-center space-x-2 text-sm font-medium text-gray-700 dark:text-gray-300">
        <Hash size={16} />
        <span>Hashtag đề xuất:</span>
      </div>

      <div className="flex flex-wrap gap-2">
        {hashtags.slice(0, 8).map((tag, index) => {
          const isSelected = selectedHashtags.includes(tag);

          return (
            <button
              key={index}
              onClick={() => (isSelected ? onRemove(tag) : onSelect(tag))}
              className={`inline-flex items-center space-x-1 rounded-full px-2 py-1 text-xs font-medium transition-colors ${
                isSelected
                  ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
              } `}
            >
              <Hash size={12} />
              <span>{tag}</span>
              {isSelected && <X size={12} />}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default HashtagSuggestions;
