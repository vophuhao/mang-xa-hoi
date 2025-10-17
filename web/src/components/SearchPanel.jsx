import { useState, useEffect } from "react";

import { useNavigate } from "react-router-dom";

import { searchHashtags, searchUsers } from "../lib/api";

export default function SearchPanel() {
  const [query, setQuery] = useState("");
  const [result, setResult] = useState({ users: [], hashtags: [] });
  const [loading, setLoading] = useState(false);
  const [recentItems, setRecentItems] = useState([]);
  const [showRecent, setShowRecent] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const users = JSON.parse(localStorage.getItem("recentUsers") || "[]");
    const hashtags = JSON.parse(localStorage.getItem("recentHashtags") || "[]");
    // Gộp lại, user trước, hashtag sau
    setRecentItems([
      ...users.map(u => ({ ...u, type: "user" })),
      ...hashtags.map(ht => ({ ...ht, type: "hashtag" })),
    ]);
  }, []);

  const handleChange = async (e) => {
    const q = e.target.value;
    setQuery(q);

    // Ẩn Recent khi nhập keyword
    setShowRecent(false);

    // Nếu bắt đầu bằng # và có tên hashtag sau đó thì mới gọi API
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

  const handleUserClick = (user) => {
    // Lấy danh sách recent từ localStorage
    const recent = JSON.parse(localStorage.getItem("recentUsers") || "[]");
    // Xóa user trùng nếu đã có
    const filtered = recent.filter(u => u.userId !== user.userId);
    // Thêm user mới lên đầu
    filtered.unshift(user);
    // Giới hạn số lượng recent (ví dụ 10)
    const limited = filtered.slice(0, 10);
    // Lưu lại vào localStorage
    localStorage.setItem("recentUsers", JSON.stringify(limited));
    // Chuyển hướng sang profile
    navigate(`/${user.userId}`);
  };

  const handleHashtagClick = (hashtag) => {
    // Lấy danh sách recent hashtag từ localStorage
    const recent = JSON.parse(localStorage.getItem("recentHashtags") || "[]");
    // Xóa hashtag trùng nếu đã có
    const filtered = recent.filter(ht => ht.name !== hashtag.name);
    // Thêm hashtag mới lên đầu
    filtered.unshift(hashtag);
    // Giới hạn số lượng recent (ví dụ 10)
    const limited = filtered.slice(0, 10);
    // Lưu lại vào localStorage
    localStorage.setItem("recentHashtags", JSON.stringify(limited));
    // Chuyển hướng sang trang hashtag
    navigate(`/hashtags/${hashtag.name}`);
  };

  return (
    <div className="search-panel">
      <div className="search-input-wrapper">
        <input
          type="text"
          placeholder="Search"
          value={query}
          onChange={handleChange}
          onFocus={() => setShowRecent(true)}
          className="search-input"
        />
        {query && (
          <button
            className="search-clear-btn"
            onClick={() => setQuery("")}
            aria-label="Clear"
            type="button"
          >
            {/* SVG icon X đẹp, cân đối */}
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <circle cx="9" cy="9" r="9" fill="#e0e0e0"/>
              <path d="M6 6L12 12M12 6L6 12" stroke="#888" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>
        )}
      </div>
      <div className="search-divider"></div>
      <div className="search-result">
        {/* Kết quả hashtag */}
        {query.startsWith("#") && result.hashtags?.length > 0 && (
          <div className="search-hashtag-list">
            {result.hashtags.map(ht => (
              <div
                key={ht._id}
                className="search-hashtag-row"
                onClick={() => handleHashtagClick(ht)}
              >
                <div className="search-hashtag-icon">#</div>
                <div className="search-hashtag-info">
                  <span className="search-hashtag-name">#{ht.name}</span>
                  <span className="search-hashtag-count">{ht.postCount.toLocaleString()} posts</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Kết quả user */}
        {!query.startsWith("#") && result.users?.length > 0 && (
          <div className="search-user-result">
            {result.users.map(u => (
              <div
                key={u.userId}
                className="search-user-row"
                onClick={() => handleUserClick(u)}
                style={{ cursor: "pointer" }}
              >
                <img src={u.avatarUrl} alt={u.username} className="search-user-avatar" />
                <div className="search-user-info">
                  <div className="search-user-username">{u.username}</div>
                  <div className="search-user-meta">{ u.userId}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      {showRecent && !query && recentItems.length > 0 && (
        <div className="search-recent">
          <div className="search-recent-header">
            <span className="search-recent-title">Recent</span>
            <button
              onClick={() => {
                localStorage.removeItem("recentUsers");
                localStorage.removeItem("recentHashtags");
                setRecentItems([]);
              }}
              className="search-recent-clear"
            >
              <p className="text-black dark:text-white">Clear All</p>
            </button>
          </div>
          {recentItems.map(item => (
            item.type === "user" ? (
              <div
                key={item.userId}
                className="search-user-row search-recent-row"
                onClick={() => navigate(`/${item.userId}`)}
                style={{ cursor: "pointer" }}
              >
                <img src={item.avatarUrl} alt={item.username} className="search-user-avatar" />
                <div className="search-user-info">
                  <div className="search-user-username">{item.username}</div>
                  <div className="search-user-meta">{ item.userId}</div>
                </div>
                <button
                  onClick={e => {
                    e.stopPropagation();
                    const filtered = recentItems.filter(x => x.type !== "user" || x.userId !== item.userId);
                    localStorage.setItem("recentUsers", JSON.stringify(filtered.filter(x => x.type === "user")));
                    setRecentItems(filtered);
                  }}
                  className="search-recent-remove"
                  aria-label="Remove recent user"
                >
                  ×
                </button>
              </div>
            ) : (
              <div
                key={item._id}
                className="search-hashtag-row search-recent-row"
                onClick={() => navigate(`/home/hashtags/${item.name}`)}
                style={{ cursor: "pointer" }}
              >
                <div className="search-hashtag-icon">#</div>
                <div className="search-hashtag-info">
                  <span className="search-hashtag-name">#{item.name}</span>
                  <span className="search-hashtag-count">{item.postCount?.toLocaleString() ?? 0} posts</span>
                </div>
                <button
                  onClick={e => {
                    e.stopPropagation();
                    const filtered = recentItems.filter(x => x.type !== "hashtag" || x._id !== item._id);
                    localStorage.setItem("recentHashtags", JSON.stringify(filtered.filter(x => x.type === "hashtag")));
                    setRecentItems(filtered);
                  }}
                  className="search-recent-remove"
                  aria-label="Remove recent hashtag"
                >
                  ×
                </button>
              </div>
            )
          ))}
        </div>
      )}
    </div>
  );
}