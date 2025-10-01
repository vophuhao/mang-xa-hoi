import { useState } from "react";

import { searchAll } from "../lib/api";

export default function SearchPanel() {
  const [query, setQuery] = useState("");
  const [result, setResult] = useState({ users: [], hashtags: [] });
  const [loading, setLoading] = useState(false);

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
            onClick={() => window.location.href = `/home/users/userid/${u.userId}`}
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
    </div>
  );
}