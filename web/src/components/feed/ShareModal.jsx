import { useMemo, useState, useEffect } from "react";

import { X, Check } from "lucide-react";
import { toast } from "react-toastify";

import { useUserFollowing, useUserFollowers } from "@/hooks/useUser";
import { sendMessage, searchUsers } from "@/lib/api";

export default function ShareModal({ open, post, currentUser, onClose, onShare, onCopy }) {
  const [q, setQ] = useState("");
  
  // selection + message
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [messageText, setMessageText] = useState("");
  const [sendingAll, setSendingAll] = useState(false);

  const username = currentUser?.data?.userId || currentUser?.userId;
  const followingQuery = useUserFollowing(username, 1);
  const followersQuery = useUserFollowers(username, 1);

  const followings = followingQuery?.data?.data || followingQuery?.data || [];
  const followers = followersQuery?.data?.data || followersQuery?.data || [];

  const filterUsers = (list) =>
    list.filter(u => {
      const name = (u.userId || u.username || u._id || "").toString().toLowerCase();
      return name.includes(q.trim().toLowerCase());
    });

  const visibleFollowings = useMemo(() => filterUsers(followings), [q, followings]);
  const visibleFollowers = useMemo(() => filterUsers(followers), [q, followers]);

  const isSearching = q.trim().length > 0;
  const [searchResults, setSearchResults] = useState([]);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [recentUsers, setRecentUsers] = useState([]);

  useEffect(() => {
    if (!open) return;
    const stored = JSON.parse(localStorage.getItem("recentUsers") || "[]");
    setRecentUsers(stored);
  }, [open]);

  const usersGrid = useMemo(() => {
    const map = new Map();
    // Grid luôn là: selectedUsers (đặt trước) + recentUsers + followings + followers
    // Không đưa searchResults vào grid — search chỉ hiển thị tạm bên trên.
    const source = [...selectedUsers, ...recentUsers, ...visibleFollowings, ...visibleFollowers];
    source.forEach(u => {
      const id = u._id || u.userId || u.id;
      if (!map.has(id)) map.set(id, u);
    });
    return Array.from(map.values());
  }, [visibleFollowings, visibleFollowers, recentUsers, selectedUsers]);

  if (!open) return null;

  const buildPostUrl = (p) => {
    if (!p) return window.location.origin;
    if (p.userId && p._id) return `${window.location.origin}/${p.userId}/p/${p._id}`;
    if (p._id) return `${window.location.origin}/post/${p._id}`;
    return window.location.origin;
  };

  const isSelected = (u) => selectedUsers.some(s => (s._id || s.userId || s.id) === (u._id || u.userId || u.id));


  // send to all selected users
  const handleSendSelected = async () => {
    if (selectedUsers.length === 0) {
      toast.info("Chưa chọn người để chia sẻ", { position: "bottom-center" });
      return;
    }
    const postUrl = buildPostUrl(post);
    setSendingAll(true);
    try {
      const tasks = selectedUsers.map(u => {
        const recipientId = u._id || u.userId || u.id;
        return sendMessage({
          recipientId,
          messageType: "post_share",
          sharedPost: post?._id || post?.id,
          content: (messageText ? messageText: ""),
        });
      });
      const results = await Promise.allSettled(tasks);
      const failed = results.some(r => r.status === "rejected");
      if (failed) {
        toast.warn("Gửi hoàn tất nhưng có lỗi với một vài người", { position: "bottom-center" });
      } else {
        toast.success("Đã gửi", { position: "bottom-center" });
      }
      if (typeof onShare === "function") onShare(selectedUsers, postUrl);
      setSelectedUsers([]);
      setMessageText("");
      onClose && onClose();
    } catch (err) {
      console.error("Share send error:", err);
      toast.error("Gửi thất bại", { position: "bottom-center" });
    } finally {
      setSendingAll(false);
    }
  };

  const handleSearch = async (e) => {
    const value = e.target.value;
    setQ(value);
    if (!value.trim()) {
      setSearchResults([]);
      setLoadingSearch(false);
      return;
    }
    setLoadingSearch(true);
    try {
      const res = await searchUsers(value);
      setSearchResults(res?.data ?? []);
    } catch (err) {
      console.error("Search error:", err);
      setSearchResults([]);
    } finally {
      setLoadingSearch(false);
    }
  };

  // toggleSelectUser updated: if selecting from search, persist to recentUsers and clear search
  const toggleSelectUserFromList = (user, fromSearch = false) => {
    const id = user._id || user.userId || user.id;
    setSelectedUsers(prev => {
      const exists = prev.some(p => (p._id || p.userId || p.id) === id);
      if (exists) {
        return prev.filter(p => (p._id || p.userId || p.id) !== id);
      } else {
        // if selecting from search, update recentUsers storage
        if (fromSearch) {
          const filtered = (recentUsers || []).filter((r) => (r.userId || r._id) !== (user.userId || user._id));
          const updatedRecent = [user, ...filtered].slice(0, 10);
          setRecentUsers(updatedRecent);
          localStorage.setItem("recentUsers", JSON.stringify(updatedRecent));
          // clear search inputs
          setQ("");
          setSearchResults([]);
        }
        return [...prev, user];
      }
    });
  };

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
            value={q}
            onChange={handleSearch}
            placeholder="Tìm kiếm người nhận..."
            className="w-full px-4 py-2 bg-gray-100 dark:bg-zinc-800 rounded-lg focus:outline-none"
          />
        </div>

        {/* Users grid / search results */}
        <div className="p-4 overflow-y-auto h-[250px] sm:h-[300px] md:h-[320px]">
          {followingQuery.isLoading || followersQuery.isLoading ? (
            <div className="text-center py-6 text-gray-500">Đang tải...</div>
          ) : (
            <>
              {isSearching ? (
                loadingSearch ? (
                  <div className="text-center py-6 text-gray-500">Đang tìm kiếm...</div>
                ) : searchResults.length > 0 ? (
                  <div className="flex flex-col gap-2">
                    {searchResults.map((user) => (
                      <div
                        key={user.userId || user._id}
                        onClick={() => toggleSelectUserFromList(user, true)}
                        className="flex items-center justify-between px-2 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800 cursor-pointer"
                      >
                        <div className="flex items-center gap-3">
                          <img
                            src={user.avatarUrl || `https://ui-avatars.com/api/?name=${user.userId || user.username}&background=random`}
                            alt={user.username}
                            className="w-8 h-8 rounded-full object-cover"
                          />
                          <div>
                            <p className="font-medium text-sm">{user.username || user.userId}</p>
                            <p className="text-xs text-gray-500">{user.userId}</p>
                          </div>
                        </div>
                        {isSelected(user) ? (
                          <Check size={22} className="text-blue-500" />
                        ) : (
                          <div className="w-5 h-5 border rounded-full" />
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  // if no search results, show "not found" message
                  <p className="text-center text-gray-400">Không tìm thấy người dùng</p>
                )
              ) : (
                <>
                  {usersGrid.length > 0 && (
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-4 py-2">
                      {usersGrid.map(user => (
                        <div
                          key={user._id || user.userId}
                          onClick={() => toggleSelectUserFromList(user, false)}
                          className="relative flex flex-col items-center cursor-pointer group"
                        >
                          <img
                            src={user.avatarUrl || `https://ui-avatars.com/api/?name=${user.userId || user.username}&background=random`}
                            alt={user.username}
                            className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full object-cover ${isSelected(user) ? "ring-2 ring-blue-500" : ""}`}
                          />
                          <span className="text-sm mt-1 text-center truncate w-[70px] sm:w-[80px]">
                            {user.username || user.userId}
                          </span>
                          {isSelected(user) && (
                            <div className="absolute bottom-6 right-5 sm:bottom-7 sm:right-6 bg-blue-500 text-white rounded-full p-[2px]">
                              <Check size={14} />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 space-y-3 border-t border-gray-200 dark:border-zinc-700">
          <input
            type="text"
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            placeholder="Soạn tin nhắn..."
            className="w-full px-4 py-2 bg-gray-100 dark:bg-zinc-800 rounded-lg focus:outline-none"
            disabled={sendingAll}
          />
          <div className="flex gap-2">
            <button
              onClick={() => { if (typeof onCopy === "function") onCopy(post); }}
              className="flex-1 bg-gray-200 dark:bg-zinc-700 hover:bg-gray-300 dark:hover:bg-zinc-600 text-black dark:text-white py-2 rounded-lg"
              disabled={sendingAll}
            >
              Sao chép liên kết
            </button>
            <button
              onClick={handleSendSelected}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg"
              disabled={sendingAll}
            >
              {sendingAll ? "Đang gửi..." : "Gửi"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}