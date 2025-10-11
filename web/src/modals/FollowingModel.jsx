import { useState, useEffect } from "react";

import { X } from "lucide-react";

import useUser from "@/hooks/useUser";

export default function FollowingModal({ isOpen, onClose, followingData = [] }) {
    const [searchTerm, setSearchTerm] = useState("");
    const [localFollowingData, setLocalFollowingData] = useState([]); // ✅ Dữ liệu local độc lập
    const [localFollowingIds, setLocalFollowingIds] = useState(new Set());

    const { toggleFollow } = useUser();

    // ✅ Khi mở modal, chỉ set dữ liệu một lần
    useEffect(() => {
        if (isOpen && followingData.length > 0) {
            setLocalFollowingData(followingData);
            setLocalFollowingIds(new Set(followingData.map((f) => f._id)));
        }
    }, [isOpen]);

    if (!isOpen) return null;

    // ✅ Dùng localFollowingData để filter (thay vì followingData)
    const filteredFollowing = localFollowingData.filter(
        (f) =>
            f.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            f.userId?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleFollowClick = async (targetUserId, isFollowing) => {
        try {
            // ✅ Cập nhật trạng thái local ngay lập tức
            setLocalFollowingIds((prev) => {
                const updated = new Set(prev);
                if (isFollowing) updated.delete(targetUserId);
                else updated.add(targetUserId);
                return updated;
            });

            // ✅ Gọi API thật (không ảnh hưởng danh sách local)
            await toggleFollow(targetUserId, isFollowing);
        } catch (err) {
            console.error("Follow error:", err);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex justify-center items-center bg-black/40 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-900 w-[520px] max-h-[90vh] rounded-2xl shadow-xl overflow-hidden animate-fadeIn">
                {/* Header */}
                <div className="flex justify-between items-center px-4 py-3 border-b dark:border-gray-700">
                    <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                        Người đang theo dõi
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

                {/* Danh sách */}
                <div className="max-h-[350px] overflow-y-auto">
                    {filteredFollowing.length > 0 ? (
                        filteredFollowing.map((u) => {
                            const isFollowing = localFollowingIds.has(u._id);
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
                                        onClick={() =>
                                            handleFollowClick(u._id, isFollowing)
                                        }
                                        className={`${
                                            isFollowing
                                                ? "bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-300"
                                                : "bg-blue-600 hover:bg-blue-700 text-white"
                                        } text-sm px-3 py-1.5 rounded-lg font-medium transition`}
                                    >
                                        {isFollowing ? "Đang theo dõi" : "Theo dõi"}
                                    </button>
                                </div>
                            );
                        })
                    ) : (
                        <p className="text-center text-sm text-gray-500 dark:text-gray-400 py-5">
                            Không tìm thấy người dùng nào
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}
