import { useState, useEffect } from "react";

import { X, Check } from "lucide-react";
import { toast } from "react-toastify";

import { searchUsers } from "@/lib/api";

export default function ShareModal({ isOpen, onClose, shareUrl }) {
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [recentUsers, setRecentUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const stored = JSON.parse(localStorage.getItem("recentUsers") || "[]");
    setRecentUsers(stored);
  }, [isOpen]);

  const handleSearch = async (e) => {
    const value = e.target.value;
    setQuery(value);
    if (!value.trim()) {
      setSearchResults([]);
      return;
    }
    setLoading(true);
    try {
      const res = await searchUsers(value);
      setSearchResults(res?.data ?? []);
    } catch (err) {
      console.error("Search error:", err);
      setSearchResults([]);
    }
    setLoading(false);
  };

  const toggleSelectUser = (user) => {
    setSelectedUsers((prev) => {
      const exists = prev.find((u) => u.userId === user.userId);
      if (exists) {
        return prev.filter((u) => u.userId !== user.userId);
      } else {
        const newSelected = [...prev, user];
        if (query.trim()) {
          const filtered = (recentUsers || []).filter((r) => r.userId !== user.userId);
          const updatedRecent = [user, ...filtered].slice(0, 10);
          setRecentUsers(updatedRecent);
          localStorage.setItem("recentUsers", JSON.stringify(updatedRecent));
          setQuery("");
          setSearchResults([]);
        }
        return newSelected;
      }
    });
  };

  const handleSend = () => {
    if (selectedUsers.length === 0) {
      toast.info("Chưa chọn người để chia sẻ", { position: "bottom-center" });
      return;
    }

    const updated = [
      ...selectedUsers,
      ...recentUsers.filter((r) => !selectedUsers.some((s) => s.userId === r.userId)),
    ].slice(0, 10);
    setRecentUsers(updated);
    localStorage.setItem("recentUsers", JSON.stringify(updated));

    toast.success("Đã gửi ", { position: "bottom-center" });
    setSelectedUsers([]);
    onClose();
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success("Đã sao chép liên kết", { position: "bottom-center" });
    } catch {
      toast.error("Không thể sao chép liên kết");
    }
  };

  if (!isOpen) return null;

  const isSearching = query.trim() !== "";

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50">
      <div
        className="
          bg-white dark:bg-zinc-900 
          w-[580px] max-w-[95%] sm:max-w-[480px] md:max-w-[580px]
          rounded-2xl shadow-xl overflow-hidden text-black dark:text-white
          mx-2 sm:mx-0
        "
      >
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-zinc-700">
          <h2 className="text-lg font-semibold">Chia sẻ</h2>
          <button onClick={onClose}>
            <X className="w-6 h-6 text-gray-600 cursor-pointer" />
          </button>
        </div>

        {/* Search bar */}
        <div className="p-4">
          <input
            type="text"
            value={query}
            onChange={handleSearch}
            placeholder="Tìm kiếm người nhận..."
            className="w-full px-4 py-2 bg-gray-100 dark:bg-zinc-800 rounded-lg focus:outline-none"
          />
        </div>

        {/* User list */}
        <div className="p-4 overflow-y-auto h-[250px] sm:h-[300px] md:h-[320px]">
          {loading ? (
            <p className="text-center text-gray-500">Đang tìm kiếm...</p>
          ) : isSearching ? (
            searchResults.length > 0 ? (
              <div className="flex flex-col gap-2">
                {searchResults.map((user) => (
                  <div
                    key={user.userId}
                    onClick={() => toggleSelectUser(user)}
                    className="flex items-center justify-between px-2 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800 cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={user.avatarUrl}
                        alt={user.username}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                      <div>
                        <p className="font-medium text-sm">{user.username}</p>
                        <p className="text-xs text-gray-500">{user.userId}</p>
                      </div>
                    </div>
                    {selectedUsers.some((u) => u.userId === user.userId) ? (
                      <Check size={22} className="text-blue-500" />
                    ) : (
                      <div className="w-5 h-5 border rounded-full" />
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-400">Không tìm thấy người dùng</p>
            )
          ) : recentUsers.length > 0 ? (
            <div
              className="
                grid grid-cols-3 sm:grid-cols-4 gap-4 py-2
              "
            >
              {recentUsers.map((user) => (
                <div
                  key={user.userId}
                  onClick={() => toggleSelectUser(user)}
                  className="relative flex flex-col items-center cursor-pointer group"
                >
                  <img
                    src={user.avatarUrl}
                    alt={user.username}
                    className="w-14 h-14 sm:w-16 sm:h-16 rounded-full object-cover"
                  />
                  <span className="text-sm mt-1 text-center truncate w-[70px] sm:w-[80px]">
                    {user.username}
                  </span>
                  {selectedUsers.some((u) => u.userId === user.userId) && (
                    <div className="absolute bottom-6 right-5 sm:bottom-7 sm:right-6 bg-blue-500 text-white rounded-full p-[2px]">
                      <Check size={14} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-400">Chưa có người gần đây</p>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 space-y-3 border-t border-gray-200 dark:border-zinc-700">
          <input
            type="text"
            placeholder="Soạn tin nhắn..."
            className="w-full px-4 py-2 bg-gray-100 dark:bg-zinc-800 rounded-lg focus:outline-none"
          />
          <div className="flex gap-2">
            <button
              onClick={handleCopyLink}
              className="flex-1 bg-gray-200 dark:bg-zinc-700 hover:bg-gray-300 dark:hover:bg-zinc-600 text-black dark:text-white py-2 rounded-lg"
            >
              Sao chép liên kết
            </button>
            <button
              onClick={handleSend}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg"
            >
              Gửi
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
