import { Hash, TrendingUp } from "lucide-react";

const SUGGESTED_HASHTAGS = [
  { tag: "photography", count: "12.5M", trending: true },
  { tag: "travel", count: "8.2M", trending: true },
  { tag: "food", count: "15.3M", trending: false },
  { tag: "fashion", count: "7.8M", trending: true },
  { tag: "art", count: "6.1M", trending: false },
  { tag: "nature", count: "9.4M", trending: true },
  { tag: "fitness", count: "5.7M", trending: false },
  { tag: "coffee", count: "3.2M", trending: false },
  { tag: "sunset", count: "4.1M", trending: true },
  { tag: "lifestyle", count: "6.8M", trending: false },
  { tag: "design", count: "5.3M", trending: true },
  { tag: "music", count: "7.2M", trending: false },
];

const ExploreSuggestions = ({ searchQuery, onHashtagClick }) => {
  if (searchQuery) return null;

  return (
    <div className="mb-6">
      <div className="mb-4 flex items-center space-x-2">
        <TrendingUp className="h-5 w-5 text-gray-600 dark:text-gray-400" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Hashtag thịnh hành</h3>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {SUGGESTED_HASHTAGS.map((item) => (
          <button
            key={item.tag}
            onClick={() => onHashtagClick(`#${item.tag}`)}
            className="group relative overflow-hidden rounded-lg bg-gradient-to-br from-gray-50 to-gray-100 p-4 text-left transition-all hover:from-gray-100 hover:to-gray-200 dark:from-gray-800 dark:to-gray-900 dark:hover:from-gray-700 dark:hover:to-gray-800"
          >
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-5">
              <div className="flex h-full w-full items-center justify-center">
                <Hash className="h-20 w-20 text-gray-600" />
              </div>
            </div>

            <div className="relative">
              <div className="mb-2 flex items-center justify-between">
                <Hash className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                {item.trending && (
                  <div className="flex items-center space-x-1 text-xs text-orange-500">
                    <TrendingUp className="h-3 w-3" />
                    <span>HOT</span>
                  </div>
                )}
              </div>

              <div className="mb-1 font-semibold text-gray-900 dark:text-white">#{item.tag}</div>

              <div className="text-sm text-gray-500 dark:text-gray-400">{item.count} bài viết</div>
            </div>

            {/* Hover effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 opacity-0 transition-opacity group-hover:opacity-100" />
          </button>
        ))}
      </div>
    </div>
  );
};

export default ExploreSuggestions;
