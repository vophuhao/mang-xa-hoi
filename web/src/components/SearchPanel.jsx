import { useState, useEffect } from "react";

import { useNavigate } from "react-router-dom";

import { searchAll } from "../lib/api";

export default function SearchPanel() {
  const [query, setQuery] = useState("");
  const [result, setResult] = useState({ users: [], hashtags: [] });
  const [loading, setLoading] = useState(false);
  const [recentUsers, setRecentUsers] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const recent = JSON.parse(localStorage.getItem("recentUsers") || "[]");
    setRecentUsers(recent);
  }, []);

  const handleChange = async (e) => {
    const q = e.target.value;
    setQuery(q);
    if (!q.trim()) {
      setResult({ users: [], hashtags: [] });
      return;
    }
    setLoading(true);
    try {
      const res = await searchAll(q);
      setResult({
        users: res?.users ?? [],
        hashtags: res?.hashtags ?? [],
      });
    } catch (err) {
      setResult({ users: [], hashtags: [] });
      if (err.response?.status === 401) {
        alert("Bạn cần đăng nhập để sử dụng chức năng tìm kiếm!");
      }
    }
    setLoading(false);
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
    navigate(`/home/users/userid/${user.userId}`);
  };

  return (
    <div className="search-panel">
      <div className="search-input-wrapper">
        <input
          type="text"
          placeholder="Search"
          value={query}
          onChange={handleChange}
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
        {(result.users ?? []).map((u) => (
          <div key={u._id} className="search-user-row"
            onClick={() => handleUserClick(u)}
            style={{ cursor: 'pointer' }}
          >
            <img
              src={u.avatarUrl}
              alt={u.username}
              width={44}
              height={44}
              className="search-user-avatar"
            />
            <div className="search-user-info">
              <div className="search-user-username">
                {u.username}
                {u.isVerified && (
                  <span className="search-user-verified">✔️</span>
                )}
              </div>
              <div className="search-user-meta">
                {u.fullName || u.userId}
                {u.followersCount !== undefined && (
                  <> • {u.followersCount} followers</>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
      {recentUsers.length > 0 && (
        <div className="search-recent">
          <div className="search-recent-header">
            <span className="search-recent-title">Recent</span>
            <button
              onClick={() => {
                localStorage.removeItem("recentUsers");
                setRecentUsers([]);
              }}
              className="search-recent-clear"
            >
              Clear all
            </button>
          </div>
          {recentUsers.map(u => (
            <div
              key={u.userId}
              className="search-user-row search-recent-row"
              onClick={() => navigate(`/home/users/userid/${u.userId}`)}
              style={{ cursor: "pointer" }}
            >
              <img src={u.avatarUrl} alt={u.username} className="search-user-avatar" />
              <div className="search-user-info">
                <div className="search-user-username">{u.username}</div>
                <div className="search-user-meta">{u.fullName || u.userId}</div>
              </div>
              <button
                onClick={e => {
                  e.stopPropagation(); // Không chuyển trang khi xóa
                  const filtered = recentUsers.filter(x => x.userId !== u.userId);
                  localStorage.setItem("recentUsers", JSON.stringify(filtered));
                  setRecentUsers(filtered);
                }}
                className="search-recent-remove"
                aria-label="Remove recent user"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}