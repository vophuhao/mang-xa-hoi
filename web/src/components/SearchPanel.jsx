import { useEffect, useRef, useState } from "react";

import { useNavigate } from "react-router-dom";

import { searchHashtags, searchUsers } from "../lib/api";

export default function SearchPanel({
  onUserSelect,
  onHashtagSelect,
  placeholder = "Search",
  overlay = false,
}) {
  const [query, setQuery] = useState("");
  const [result, setResult] = useState({ users: [], hashtags: [] });
  const [loading, setLoading] = useState(false);
  const [recentItems, setRecentItems] = useState([]);
  const [showRecent, setShowRecent] = useState(true);
  const [showDropdown, setShowDropdown] = useState(false);
  const navigate = useNavigate();
  const wrapperRef = useRef(null);

  useEffect(() => {
    const users = JSON.parse(localStorage.getItem("recentUsers") || "[]");
    const hashtags = JSON.parse(localStorage.getItem("recentHashtags") || "[]");
    setRecentItems([
      ...users.map((u) => ({ ...u, type: "user" })),
      ...hashtags.map((ht) => ({ ...ht, type: "hashtag" })),
    ]);
  }, []);

  useEffect(() => {
    const handleOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setShowDropdown(false);
        setShowRecent(false);
      }
    };
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  const openDropdown = () => {
    setShowDropdown(true);
    setShowRecent(true);
  };

  const handleUserClick = (user) => {
    // Lưu recent như trước
    const recent = JSON.parse(localStorage.getItem("recentUsers") || "[]");
    const filtered = recent.filter((u) => u.userId !== user.userId);
    filtered.unshift(user);
    const limited = filtered.slice(0, 10);
    localStorage.setItem("recentUsers", JSON.stringify(limited));

    setShowDropdown(false);

    // Nếu có callback, gọi callback (MessagePanel sẽ xử lý mở convo)
    if (typeof onUserSelect === "function") {
      onUserSelect(user);
      return;
    }

    // Hành vi mặc định: navigate sang profile
    navigate(`/${user.userId}`);
  };

  const handleHashtagClick = (hashtag) => {
    const recent = JSON.parse(localStorage.getItem("recentHashtags") || "[]");
    const filtered = recent.filter((ht) => ht.name !== hashtag.name);
    filtered.unshift(hashtag);
    const limited = filtered.slice(0, 10);
    localStorage.setItem("recentHashtags", JSON.stringify(limited));

    setShowDropdown(false);

    if (typeof onHashtagSelect === "function") {
      onHashtagSelect(hashtag);
      return;
    }

    navigate(`/hashtags/${hashtag.name}`);
  };

  const handleChange = async (e) => {
    const q = e.target.value;
    setQuery(q);

    // Show dropdown when typing
    if (q && q.trim().length > 0) {
      setShowDropdown(true);
      setShowRecent(false);
    } else {
      setShowRecent(true);
    }

    // Nếu bắt đầu bằng # và có tên hashtag sau đó thì gọi API
    if (q.startsWith("#")) {
      const hashtag = q.slice(1).trim();
      if (hashtag.length === 0) {
        setResult({ users: [], hashtags: [] });
        return;
      }
      setLoading(true);
      try {
        const res = await searchHashtags(hashtag);
        setResult({
          users: [],
          hashtags: res?.data ?? [],
        });
      } catch {
        setResult({ users: [], hashtags: [] });
      }
      setLoading(false);
      return;
    }

    // Nếu không có # thì chỉ tìm user
    if (q.trim()) {
      setLoading(true);
      try {
        const res = await searchUsers(q);
        setResult({
          users: res?.data ?? [],
          hashtags: [],
        });
      } catch {
        setResult({ users: [], hashtags: [] });
      }
      setLoading(false);
    } else {
      setResult({ users: [], hashtags: [] });
    }
  };

  return (
    <div ref={wrapperRef} className={`search-panel relative ${overlay ? "" : ""}`}>
      <div className="search-input-wrapper">
        <input
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={handleChange}
          onFocus={openDropdown}
          className="search-input focus:ring-primary w-full rounded-lg border border-gray-200 bg-white px-4 py-2 text-gray-900 focus:ring-2 focus:outline-none dark:border-gray-700 dark:bg-zinc-900 dark:text-gray-100"
        />
        {query && (
          <button
            className="search-clear-btn absolute top-2 right-3 text-gray-400 hover:text-gray-700 dark:text-gray-500 dark:hover:text-gray-300"
            onClick={() => {
              setQuery("");
              setResult({ users: [], hashtags: [] });
            }}
            aria-label="Clear"
            type="button"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <circle cx="9" cy="9" r="9" fill="#e0e0e0" />
              <path
                d="M6 6L12 12M12 6L6 12"
                stroke="#888"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </button>
        )}
      </div>
      <div className="search-divider my-2 h-px bg-gray-200 dark:bg-zinc-700" />

      {/* Dropdown: nếu overlay === true thì absolute overlay, ngược lại render như block bình thường (push layout) */}
      {showDropdown &&
        (overlay ? (
          <div className="absolute right-0 left-0 z-50 mt-2 rounded-lg border border-gray-100 bg-white shadow-md dark:border-zinc-800 dark:bg-zinc-900">
            <div className="p-2">
              {loading && <div className="px-4 py-2 text-sm text-gray-500">Đang tìm...</div>}

              {/* Hashtags results */}
              {query.startsWith("#") && result.hashtags?.length > 0 && (
                <div className="search-hashtag-list">
                  {result.hashtags.map((ht) => (
                    <div
                      key={ht._id}
                      className="search-hashtag-row cursor-pointer rounded px-4 py-2 hover:bg-gray-100 dark:hover:bg-zinc-800"
                      onClick={() => handleHashtagClick(ht)}
                    >
                      <div className="flex items-center">
                        <div className="search-hashtag-icon text-primary mr-3">#</div>
                        <div className="search-hashtag-info">
                          <span className="search-hashtag-name text-gray-900 dark:text-gray-100">
                            #{ht.name}
                          </span>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {ht.postCount?.toLocaleString() ?? 0} posts
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* User results */}
              {!query.startsWith("#") && result.users?.length > 0 && (
                <div className="search-user-result">
                  {result.users.map((u) => (
                    <div
                      key={u.userId}
                      className="search-user-row flex cursor-pointer items-center rounded px-4 py-2 hover:bg-gray-100 dark:hover:bg-zinc-800"
                      onClick={() => handleUserClick(u)}
                    >
                      <img
                        src={
                          u.avatarUrl ||
                          `https://ui-avatars.com/api/?name=${encodeURIComponent(u.username || u.userId)}&background=random`
                        }
                        alt={u.username}
                        className="search-user-avatar mr-3 h-8 w-8 rounded-full"
                      />
                      <div className="search-user-info">
                        <div className="search-user-username text-gray-900 dark:text-gray-100">
                          {u.username}
                        </div>
                        <div className="search-user-meta text-sm text-gray-500 dark:text-gray-400">
                          {u.userId}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Recent items (when no query) */}
              {showRecent && !query && recentItems.length > 0 && (
                <div className="search-recent mt-1">
                  <div className="flex items-center justify-between px-3 pb-2">
                    <span className="text-sm text-gray-500">Recent</span>
                    <button
                      onClick={() => {
                        localStorage.removeItem("recentUsers");
                        localStorage.removeItem("recentHashtags");
                        setRecentItems([]);
                      }}
                      className="text-sm text-gray-500"
                    >
                      Clear All
                    </button>
                  </div>
                  <div className="px-1">
                    {recentItems.map((item) =>
                      item.type === "user" ? (
                        <div
                          key={item.userId}
                          className="search-user-row search-recent-row flex cursor-pointer items-center rounded px-3 py-2 hover:bg-gray-100 dark:hover:bg-zinc-800"
                          onClick={() => handleUserClick(item)}
                        >
                          <img
                            src={
                              item.avatarUrl ||
                              `https://ui-avatars.com/api/?name=${encodeURIComponent(item.username || item.userId)}&background=random`
                            }
                            alt={item.username}
                            className="search-user-avatar mr-3 h-8 w-8 rounded-full"
                          />
                          <div className="search-user-info">
                            <div className="search-user-username text-gray-900 dark:text-gray-100">
                              {item.username}
                            </div>
                            <div className="search-user-meta text-sm text-gray-500 dark:text-gray-400">
                              {item.userId}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div
                          key={item._id}
                          className="search-hashtag-row search-recent-row flex cursor-pointer items-center rounded px-3 py-2 hover:bg-gray-100 dark:hover:bg-zinc-800"
                          onClick={() => handleHashtagClick(item)}
                        >
                          <div className="search-hashtag-icon text-primary mr-3">#</div>
                          <div className="search-hashtag-info">
                            <div className="search-hashtag-name text-gray-900 dark:text-gray-100">
                              #{item.name}
                            </div>
                            <div className="search-hashtag-count text-sm text-gray-500 dark:text-gray-400">
                              {item.postCount?.toLocaleString() ?? 0} posts
                            </div>
                          </div>
                        </div>
                      )
                    )}
                  </div>
                </div>
              )}

              {/* Empty state */}
              {!loading &&
                query &&
                query.trim().length > 0 &&
                !showRecent &&
                result.users.length === 0 &&
                result.hashtags.length === 0 && (
                  <div className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400">
                    Không tìm thấy kết quả
                  </div>
                )}
            </div>
          </div>
        ) : (
          <div className="mt-2 rounded-lg border border-gray-100 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <div className="p-2">
              {loading && <div className="px-4 py-2 text-sm text-gray-500">Đang tìm...</div>}

              {/* Hashtags results */}
              {query.startsWith("#") && result.hashtags?.length > 0 && (
                <div className="search-hashtag-list">
                  {result.hashtags.map((ht) => (
                    <div
                      key={ht._id}
                      className="search-hashtag-row cursor-pointer rounded px-4 py-2 hover:bg-gray-100 dark:hover:bg-zinc-800"
                      onClick={() => handleHashtagClick(ht)}
                    >
                      <div className="flex items-center">
                        <div className="search-hashtag-icon text-primary mr-3">#</div>
                        <div className="search-hashtag-info">
                          <span className="search-hashtag-name text-gray-900 dark:text-gray-100">
                            #{ht.name}
                          </span>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {ht.postCount?.toLocaleString() ?? 0} posts
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* User results */}
              {!query.startsWith("#") && result.users?.length > 0 && (
                <div className="search-user-result">
                  {result.users.map((u) => (
                    <div
                      key={u.userId}
                      className="search-user-row flex cursor-pointer items-center rounded px-4 py-2 hover:bg-gray-100 dark:hover:bg-zinc-800"
                      onClick={() => handleUserClick(u)}
                    >
                      <img
                        src={
                          u.avatarUrl ||
                          `https://ui-avatars.com/api/?name=${encodeURIComponent(u.username || u.userId)}&background=random`
                        }
                        alt={u.username}
                        className="search-user-avatar mr-3 h-8 w-8 rounded-full"
                      />
                      <div className="search-user-info">
                        <div className="search-user-username text-gray-900 dark:text-gray-100">
                          {u.username}
                        </div>
                        <div className="search-user-meta text-sm text-gray-500 dark:text-gray-400">
                          {u.userId}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Recent items (when no query) */}
              {showRecent && !query && recentItems.length > 0 && (
                <div className="search-recent mt-1">
                  <div className="flex items-center justify-between px-3 pb-2">
                    <span className="text-sm text-gray-500">Recent</span>
                    <button
                      onClick={() => {
                        localStorage.removeItem("recentUsers");
                        localStorage.removeItem("recentHashtags");
                        setRecentItems([]);
                      }}
                      className="text-sm text-gray-500"
                    >
                      Clear All
                    </button>
                  </div>
                  <div className="px-1">
                    {recentItems.map((item) =>
                      item.type === "user" ? (
                        <div
                          key={item.userId}
                          className="search-user-row search-recent-row flex cursor-pointer items-center rounded px-3 py-2 hover:bg-gray-100 dark:hover:bg-zinc-800"
                          onClick={() => handleUserClick(item)}
                        >
                          <img
                            src={
                              item.avatarUrl ||
                              `https://ui-avatars.com/api/?name=${encodeURIComponent(item.username || item.userId)}&background=random`
                            }
                            alt={item.username}
                            className="search-user-avatar mr-3 h-8 w-8 rounded-full"
                          />
                          <div className="search-user-info">
                            <div className="search-user-username text-gray-900 dark:text-gray-100">
                              {item.username}
                            </div>
                            <div className="search-user-meta text-sm text-gray-500 dark:text-gray-400">
                              {item.userId}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div
                          key={item._id}
                          className="search-hashtag-row search-recent-row flex cursor-pointer items-center rounded px-3 py-2 hover:bg-gray-100 dark:hover:bg-zinc-800"
                          onClick={() => handleHashtagClick(item)}
                        >
                          <div className="search-hashtag-icon text-primary mr-3">#</div>
                          <div className="search-hashtag-info">
                            <div className="search-hashtag-name text-gray-900 dark:text-gray-100">
                              #{item.name}
                            </div>
                            <div className="search-hashtag-count text-sm text-gray-500 dark:text-gray-400">
                              {item.postCount?.toLocaleString() ?? 0} posts
                            </div>
                          </div>
                        </div>
                      )
                    )}
                  </div>
                </div>
              )}

              {/* Empty state */}
              {!loading &&
                query &&
                query.trim().length > 0 &&
                !showRecent &&
                result.users.length === 0 &&
                result.hashtags.length === 0 && (
                  <div className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400">
                    Không tìm thấy kết quả
                  </div>
                )}
            </div>
          </div>
        ))}
    </div>
  );
}
