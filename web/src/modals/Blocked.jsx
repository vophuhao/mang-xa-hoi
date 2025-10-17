import { useState, useEffect } from "react";

import { X, Search, Loader2 } from "lucide-react";

import useAuth from "@/hooks/useAuth";
import { useBlockActions } from "@/hooks/useBlock";

export default function BlockedModal({ isOpen, onClose, blockedData = [] }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [localBlockedData, setLocalBlockedData] = useState([]);
  const [localBlockedIds, setLocalBlockedIds] = useState(new Set());
  const [pendingIds, setPendingIds] = useState(new Set());

  const { toggleBlockUser } = useBlockActions();
  const { user } = useAuth();

  useEffect(() => {
    if (isOpen && blockedData.length > 0) {
      setLocalBlockedData(blockedData);
      setLocalBlockedIds(new Set(blockedData.map((b) => b.blocked?._id)));
    }
  }, [isOpen, blockedData]);

  if (!isOpen) return null;

  // Lọc theo tên hoặc userId
  const filteredBlocked = localBlockedData.filter(
    (b) =>
      b.blocked?.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.blocked?.userId?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Optimistic toggle + loading theo user
  const handleBlockClick = async (targetUserId, isBlocked) => {
    setPendingIds((prev) => {
      const s = new Set(prev);
      s.add(targetUserId);
      return s;
    });

    try {
      setLocalBlockedIds((prev) => {
        const updated = new Set(prev);
        if (isBlocked) updated.delete(targetUserId);
        else updated.add(targetUserId);
        return updated;
      });

      await toggleBlockUser(targetUserId);
    } catch (err) {
      console.error("Block error:", err);
      // rollback
      setLocalBlockedIds((prev) => {
        const updated = new Set(prev);
        if (isBlocked) updated.add(targetUserId);
        else updated.delete(targetUserId);
        return updated;
      });
    } finally {
      setPendingIds((prev) => {
        const s = new Set(prev);
        s.delete(targetUserId);
        return s;
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-center items-center bg-black/50 backdrop-blur-sm transition-opacity">
      <div className="bg-white dark:bg-gray-900 w-full max-w-md sm:max-w-lg max-h-[90vh] rounded-2xl shadow-2xl ring-1 ring-black/5 dark:ring-white/10 overflow-hidden">
        {/* Header */}
        <div className="sticky top-0 z-10 flex justify-between items-center px-4 py-3 border-b bg-gradient-to-r from-white to-gray-50 dark:from-gray-900 dark:to-gray-800 border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
            Người bạn đã chặn
          </h2>
          <button
            onClick={onClose}
            className="inline-flex items-center justify-center rounded-md p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-800 transition"
            aria-label="Đóng"
          >
            <X size={20} />
          </button>
        </div>

        {/* Ô tìm kiếm */}
        <div className="p-3">
          <div className="relative">
            <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-gray-400">
              <Search size={16} />
            </span>
            <input
              type="text"
              placeholder="Tìm kiếm người dùng..."
              className="w-full pl-9 pr-9 py-2 text-sm rounded-full border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute inset-y-0 right-2 flex items-center justify-center rounded-full p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                aria-label="Xóa tìm kiếm"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Danh sách */}
        <div className="max-h-[350px] overflow-y-auto divide-y divide-gray-100 dark:divide-gray-800">
          {filteredBlocked.length > 0 ? (
            filteredBlocked.map((b) => {
              const blockedUser = b.blocked;
              if (!blockedUser) return null;

              const isBlocked = localBlockedIds.has(blockedUser._id);
              const isCurrentUser = blockedUser._id === user?.data?._id;
              const isPending = pendingIds.has(blockedUser._id);

              return (
                <div
                  key={b._id}
                  className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/60 transition"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={blockedUser.avatarUrl || "/default-avatar.png"}
                      alt={blockedUser.username}
                      className="w-11 h-11 rounded-full object-cover ring-1 ring-gray-200 dark:ring-gray-700"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-gray-800 dark:text-gray-100 truncate max-w-[220px] sm:max-w-[260px]">
                          {blockedUser.username}
                        </p>
                        {isCurrentUser && (
                          <span className="text-[11px] px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                            Bạn
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                        {blockedUser.userId ? `@${blockedUser.userId}` : "Người dùng"}
                      </p>
                    </div>
                  </div>

                  {!isCurrentUser && (
                    <button
                      onClick={() => handleBlockClick(blockedUser._id, isBlocked)}
                      disabled={isPending}
                      className={`inline-flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg font-medium transition focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-60 disabled:cursor-not-allowed
                        ${
                          isBlocked
                            ? "border border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-200 bg-transparent hover:bg-gray-100 dark:hover:bg-gray-700"
                            : "bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
                        }`}
                    >
                      {isPending ? (
                        <>
                          <Loader2 size={14} className="animate-spin" />
                          Đang xử lý...
                        </>
                      ) : (
                        <>{isBlocked ? "Bỏ chặn" : "Chặn lại"}</>
                      )}
                    </button>
                  )}
                </div>
              );
            })
          ) : (
            <div className="flex flex-col items-center justify-center text-center gap-1 py-10 text-gray-500 dark:text-gray-400">
              <Search size={20} />
              <p className="text-sm">Bạn chưa chặn người dùng nào</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}