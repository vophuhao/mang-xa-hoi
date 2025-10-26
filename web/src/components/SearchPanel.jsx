import { useState, useEffect, useRef } from "react";

import { useNavigate } from "react-router-dom";

import { searchHashtags, searchUsers } from "../lib/api";

export default function SearchPanel({ onUserSelect, onHashtagSelect, placeholder = "Search", overlay = false }) {
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
      ...users.map(u => ({ ...u, type: "user" })),
      ...hashtags.map(ht => ({ ...ht, type: "hashtag" })),
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
    const filtered = recent.filter(u => u.userId !== user.userId);
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
    const filtered = recent.filter(ht => ht.name !== hashtag.name);
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
    <div ref={wrapperRef} className={`search-panel relative ${overlay ? '' : ''}`}>
      <div className="search-input-wrapper">
        <input
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={handleChange}
          onFocus={openDropdown}
          className="search-input"
        />
        {query && (
          <button
            className="search-clear-btn"
            onClick={() => { setQuery(""); setResult({ users: [], hashtags: [] }); }}
            aria-label="Clear"
            type="button"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <circle cx="9" cy="9" r="9" fill="#e0e0e0"/>
              <path d="M6 6L12 12M12 6L6 12" stroke="#888" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>
        )}
      </div>
      <div className="search-divider" />

      {/* Dropdown: nếu overlay === true thì absolute overlay, ngược lại render như block bình thường (push layout) */}
      {showDropdown && (
        overlay ? (
          <div
            className="absolute left-0 right-0 mt-2 bg-white rounded-lg shadow-md z-50"
          >
            <div className="p-2">
              {loading && <div className="px-4 py-2 text-sm text-gray-500">Đang tìm...</div>}

              {/* Hashtags results */}
              {query.startsWith("#") && result.hashtags?.length > 0 && (
                <div className="search-hashtag-list">
                  {result.hashtags.map(ht => (
                    <div
                      key={ht._id}
                      className="search-hashtag-row cursor-pointer hover:bg-gray-50 px-4 py-2 rounded"
                      onClick={() => handleHashtagClick(ht)}
                    >
                      <div className="flex items-center">
                        <div className="search-hashtag-icon mr-3">#</div>
                        <div className="search-hashtag-info">
                          <span className="search-hashtag-name">#{ht.name}</span>
                          <div className="text-sm text-gray-500">{ht.postCount?.toLocaleString() ?? 0} posts</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* User results */}
              {!query.startsWith("#") && result.users?.length > 0 && (
                <div className="search-user-result">
                  {result.users.map(u => (
                    <div
                      key={u.userId}
                      className="search-user-row cursor-pointer hover:bg-gray-50 px-4 py-2 rounded flex items-center"
                      onClick={() => handleUserClick(u)}
                    >
                      <img src={u.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.username || u.userId)}&background=random`} alt={u.username} className="search-user-avatar w-8 h-8 rounded-full mr-3" />
                      <div className="search-user-info">
                        <div className="search-user-username">{u.username}</div>
                        <div className="search-user-meta text-sm text-gray-500">{u.userId}</div>
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
                    {recentItems.map(item => (
                      item.type === "user" ? (
                        <div
                          key={item.userId}
                          className="search-user-row search-recent-row cursor-pointer hover:bg-gray-50 px-3 py-2 rounded flex items-center"
                          onClick={() => handleUserClick(item)}
                        >
                          <img src={item.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(item.username || item.userId)}&background=random`} alt={item.username} className="search-user-avatar w-8 h-8 rounded-full mr-3" />
                          <div className="search-user-info">
                            <div className="search-user-username">{item.username}</div>
                            <div className="search-user-meta text-sm text-gray-500">{ item.userId}</div>
                          </div>
                        </div>
                      ) : (
                        <div
                          key={item._id}
                          className="search-hashtag-row search-recent-row cursor-pointer hover:bg-gray-50 px-3 py-2 rounded flex items-center"
                          onClick={() => handleHashtagClick(item)}
                        >
                          <div className="search-hashtag-icon mr-3">#</div>
                          <div className="search-hashtag-info">
                            <div className="search-hashtag-name">#{item.name}</div>
                            <div className="search-hashtag-count text-sm text-gray-500">{item.postCount?.toLocaleString() ?? 0} posts</div>
                          </div>
                        </div>
                      )
                    ))}
                  </div>
                </div>
              )}

              {/* Empty state */}
              {!loading && query && query.trim().length > 0 && !showRecent && result.users.length === 0 && result.hashtags.length === 0 && (
                <div className="px-4 py-2 text-sm text-gray-500">Không tìm thấy kết quả</div>
              )}
            </div>
          </div>
        ) : (
          <div
            className="mt-2 bg-white rounded-lg shadow-sm"
          >
            <div className="p-2">
              {loading && <div className="px-4 py-2 text-sm text-gray-500">Đang tìm...</div>}

              {/* Hashtags results */}
              {query.startsWith("#") && result.hashtags?.length > 0 && (
                <div className="search-hashtag-list">
                  {result.hashtags.map(ht => (
                    <div
                      key={ht._id}
                      className="search-hashtag-row cursor-pointer hover:bg-gray-50 px-4 py-2 rounded"
                      onClick={() => handleHashtagClick(ht)}
                    >
                      <div className="flex items-center">
                        <div className="search-hashtag-icon mr-3">#</div>
                        <div className="search-hashtag-info">
                          <span className="search-hashtag-name">#{ht.name}</span>
                          <div className="text-sm text-gray-500">{ht.postCount?.toLocaleString() ?? 0} posts</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* User results */}
              {!query.startsWith("#") && result.users?.length > 0 && (
                <div className="search-user-result">
                  {result.users.map(u => (
                    <div
                      key={u.userId}
                      className="search-user-row cursor-pointer hover:bg-gray-50 px-4 py-2 rounded flex items-center"
                      onClick={() => handleUserClick(u)}
                    >
                      <img src={u.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.username || u.userId)}&background=random`} alt={u.username} className="search-user-avatar w-8 h-8 rounded-full mr-3" />
                      <div className="search-user-info">
                        <div className="search-user-username">{u.username}</div>
                        <div className="search-user-meta text-sm text-gray-500">{u.userId}</div>
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
                    {recentItems.map(item => (
                      item.type === "user" ? (
                        <div
                          key={item.userId}
                          className="search-user-row search-recent-row cursor-pointer hover:bg-gray-50 px-3 py-2 rounded flex items-center"
                          onClick={() => handleUserClick(item)}
                        >
                          <img src={item.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(item.username || item.userId)}&background=random`} alt={item.username} className="search-user-avatar w-8 h-8 rounded-full mr-3" />
                          <div className="search-user-info">
                            <div className="search-user-username">{item.username}</div>
                            <div className="search-user-meta text-sm text-gray-500">{ item.userId}</div>
                          </div>
                        </div>
                      ) : (
                        <div
                          key={item._id}
                          className="search-hashtag-row search-recent-row cursor-pointer hover:bg-gray-50 px-3 py-2 rounded flex items-center"
                          onClick={() => handleHashtagClick(item)}
                        >
                          <div className="search-hashtag-icon mr-3">#</div>
                          <div className="search-hashtag-info">
                            <div className="search-hashtag-name">#{item.name}</div>
                            <div className="search-hashtag-count text-sm text-gray-500">{item.postCount?.toLocaleString() ?? 0} posts</div>
                          </div>
                        </div>
                      )
                    ))}
                  </div>
                </div>
              )}

              {/* Empty state */}
              {!loading && query && query.trim().length > 0 && !showRecent && result.users.length === 0 && result.hashtags.length === 0 && (
                <div className="px-4 py-2 text-sm text-gray-500">Không tìm thấy kết quả</div>
              )}
            </div>
          </div>
        )
      )}
    </div>
  );
}