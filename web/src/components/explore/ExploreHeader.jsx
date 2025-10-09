import { useEffect, useRef, useState } from "react";

import { Hash, Search, TrendingUp, X } from "lucide-react";

import { useDebounce } from "@/hooks/useDebounce";
import { useSearchUsers } from "@/hooks/useUser";

const TRENDING_HASHTAGS = [
  { tag: "photography", count: "12.5M" },
  { tag: "travel", count: "8.2M" },
  { tag: "food", count: "15.3M" },
  { tag: "fashion", count: "7.8M" },
  { tag: "art", count: "6.1M" },
  { tag: "nature", count: "9.4M" },
  { tag: "fitness", count: "5.7M" },
  { tag: "coffee", count: "3.2M" },
]; // not constant because we might want to fetch this from server in the future

const ExploreHeader = ({ onSearch }) => {
  const [query, setQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef(null);
  const searchRef = useRef(null);

  const debouncedQuery = useDebounce(query, 300);

  // Search users for autocomplete
  const { data: searchResults, isLoading } = useSearchUsers(
    debouncedQuery.trim() ? debouncedQuery : null
  );

  useEffect(() => {
    onSearch(debouncedQuery);
  }, [debouncedQuery, onSearch]);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleInputChange = (e) => {
    const value = e.target.value;
    setQuery(value);
    setShowSuggestions(value.length > 0);
  };

  const handleUserSelect = (user) => {
    setQuery(user.username);
    setShowSuggestions(false);
    onSearch(user.username);
  };

  const handleHashtagSelect = (hashtag) => {
    setQuery(`#${hashtag}`);
    setShowSuggestions(false);
    onSearch(`#${hashtag}`);
  };

  const clearSearch = () => {
    setQuery("");
    setShowSuggestions(false);
    onSearch("");
    inputRef.current?.focus();
  };

  return (
    <div className="mb-6">
      {/* Search Bar */}
      <div ref={searchRef} className="relative mb-4">
        <div className="relative">
          <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={handleInputChange}
            onFocus={() => setShowSuggestions(query.length > 0)}
            placeholder="Tìm kiếm tài khoản và hashtag"
            className="w-full rounded-lg border border-gray-300 bg-gray-50 py-3 pr-10 pl-10 text-sm text-gray-900 placeholder-gray-500 transition-colors focus:border-blue-500 focus:bg-white focus:ring-1 focus:ring-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder-gray-400 dark:focus:border-blue-400 dark:focus:bg-gray-700"
          />
          {query && (
            <button
              onClick={clearSearch}
              className="absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Search Suggestions Dropdown */}
        {showSuggestions && (
          <div className="absolute top-full z-50 mt-2 w-full rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800">
            {/* Users Section */}
            {searchResults?.data?.length > 0 && (
              <div className="p-2">
                <div className="mb-2 px-3 py-1 text-xs font-semibold text-gray-500 dark:text-gray-400">
                  Tài khoản
                </div>
                {searchResults.data.slice(0, 5).map((user) => (
                  <button
                    key={user._id}
                    onClick={() => handleUserSelect(user)}
                    className="flex w-full items-center space-x-3 rounded-md px-3 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    <img
                      src={user.avatarUrl || "/default-avatar.png"}
                      alt={user.username}
                      className="h-8 w-8 rounded-full object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {user.username}
                      </div>
                      <div className="truncate text-xs text-gray-500 dark:text-gray-400">
                        {user.fullName}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Hashtags Section */}
            {query.startsWith("#") && (
              <div className="border-t border-gray-100 p-2 dark:border-gray-700">
                <div className="mb-2 px-3 py-1 text-xs font-semibold text-gray-500 dark:text-gray-400">
                  Hashtag
                </div>
                {TRENDING_HASHTAGS.filter((item) =>
                  item.tag.toLowerCase().includes(query.slice(1).toLowerCase())
                )
                  .slice(0, 5)
                  .map((item) => (
                    <button
                      key={item.tag}
                      onClick={() => handleHashtagSelect(item.tag)}
                      className="flex w-full items-center space-x-3 rounded-md px-3 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700">
                        <Hash className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          #{item.tag}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {item.count} bài viết
                        </div>
                      </div>
                    </button>
                  ))}
              </div>
            )}

            {/* Loading */}
            {isLoading && (
              <div className="p-4 text-center">
                <div className="text-sm text-gray-500 dark:text-gray-400">Đang tìm kiếm...</div>
              </div>
            )}

            {/* No results */}
            {!isLoading &&
              (!searchResults?.data?.length || searchResults.data.length === 0) &&
              !query.startsWith("#") &&
              query.trim() && (
                <div className="p-4 text-center">
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Không tìm thấy kết quả nào
                  </div>
                </div>
              )}
          </div>
        )}
      </div>

      {/* Trending Hashtags */}
      {!query && (
        <div className="flex flex-wrap gap-2">
          <div className="flex items-center space-x-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
            <TrendingUp className="h-4 w-4" />
            <span>Thịnh hành:</span>
          </div>
          {TRENDING_HASHTAGS.slice(0, 6).map((item) => (
            <button
              key={item.tag}
              onClick={() => handleHashtagSelect(item.tag)}
              className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              #{item.tag}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default ExploreHeader;
