import { useState, useEffect } from "react";

import { X } from "lucide-react";

import useUser from "@/hooks/useUser";

export default function FollowerModal({ isOpen, onClose, followersData, followingData }) {
    const [searchTerm, setSearchTerm] = useState("");
    const [localFollowBackIds, setLocalFollowBackIds] = useState(new Set());

    const { toggleFollow } = useUser();

    // ✅ Khi mở modal, khởi tạo danh sách những người mình đang follow
    useEffect(() => {
        if (isOpen && Array.isArray(followingData)) {
            const ids = new Set(followingData.map((f) => f._id));
            setLocalFollowBackIds(ids);
        }
    }, [isOpen, followingData]);


    if (!isOpen) return null;

    // ✅ Lọc người theo dõi
    const filteredFollowers = followersData.filter(
        (f) =>
            f.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            f.userId?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // ✅ Khi click theo dõi hoặc bỏ theo dõi lại
    const handleFollowBack = async (targetUserId, isFollowingBack) => {
        try {
            // Cập nhật UI ngay
            setLocalFollowBackIds((prev) => {
                const updated = new Set(prev);
                if (isFollowingBack) updated.delete(targetUserId);
                else updated.add(targetUserId);
                return updated;
            });

            // Gọi API
            await toggleFollow(targetUserId, isFollowingBack);
        } catch (err) {
            console.error("Follow back error:", err);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex justify-center items-center bg-black/40 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-900 w-[520px] max-h-[90vh] rounded-2xl shadow-xl overflow-hidden animate-fadeIn">
                {/* Header */}
                <div className="flex justify-between items-center px-4 py-3 border-b dark:border-gray-700">
                    <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                        Người theo dõi bạn
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                    >
                        <X size={22} />
                    </button>
                </div>

                {/* Ô tìm kiếm */}
                <div className="p-3">
                    <input
                        type="text"
                        placeholder="Tìm kiếm"
                        className="w-full px-3 py-2 text-sm rounded-lg border dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-400"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                {/* Danh sách followers */}
                <div className="max-h-[350px] overflow-y-auto">
                    {filteredFollowers.length > 0 ? (
                        filteredFollowers.map((u) => {
                            const isFollowingBack = localFollowBackIds.has(u._id);
                            return (
                                <div
                                    key={u._id}
                                    className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
                                >
                                    <div className="flex items-center gap-3">
                                        <img
                                            src={u.avatarUrl || "/default-avatar.png"}
                                            alt={u.username}
                                            className="w-10 h-10 rounded-full object-cover"
                                        />
                                        <div>
                                            <p className="font-medium text-gray-800 dark:text-gray-100">
                                                {u.username}
                                            </p>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                                {u.userId || "Người dùng"}
                                            </p>
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => handleFollowBack(u._id, isFollowingBack)}
                                        className={`${isFollowingBack
                                                ? "bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-300"
                                                : "bg-blue-600 hover:bg-blue-700 text-white"
                                            } text-sm px-3 py-1.5 rounded-lg font-medium transition`}
                                    >
                                        {isFollowingBack ? "Đang theo dõi" : "Theo dõi lại"}
                                    </button>
                                </div>
                            );
                        })
                    ) : (
                        <p className="text-center text-sm text-gray-500 dark:text-gray-400 py-5">
                            Không có người theo dõi nào
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}
