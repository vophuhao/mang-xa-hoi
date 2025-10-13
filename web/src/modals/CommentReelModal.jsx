import { useState } from "react";

import { X } from "lucide-react";


import CommentInputReel from "@/components/feed/CommentInputReel";
import CommentListReel from "@/components/feed/CommentListReel";
import { navigate } from "@/lib/navigation";

export default function CommentModal({
    isOpen,
    onClose,
    postId,
    post,
    currentUserId,
    
}) {
    const [replyState, setReplyState] = useState(null);

    const handleReplyStateChange = (newReplyState) => {
        setReplyState(newReplyState);
    };
    const handleReplyCancel = () => {
        setReplyState(null);
    };
    const onUsernameClick = (userId) => {
       navigate(`/${userId}`);
    };
    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex justify-end  mt-20 mr-14"
            onClick={onClose} // bấm vùng ngoài sẽ đóng
        >
            {/* Modal nội dung */}
            <div
                className="bg-white dark:bg-[#121212] sm:w-[350px] h-[450px] w-[320px] p-3 flex flex-col relative "
                onClick={(e) => e.stopPropagation()} // ✅ CHẶN CLICK lan ra ngoài
            >
                {/* Nút đóng */}
                <button
                    onClick={onClose}
                    className="absolute text-black top-3 right-3 p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-800"
                >
                    <X size={20} />
                </button>

                <h2 className="text-lg font-semibold mb-4 px-2 dark:text-gray-100 text-black">Bình luận</h2>

                {/* Danh sách bình luận */}
                <div className="flex-1 overflow-y-auto scrollbar-hide">
                    <CommentListReel
                        postId={postId}
                        post={post}
                        currentUserId={currentUserId}
                        onUsernameClick={onUsernameClick}
                         onReplyStateChange={handleReplyStateChange}
                    />
                </div>

                {/* Ô nhập bình luận */}
                <div className="border-t p-2 flex items-center gap-2 dark:border-gray-700">
                    <CommentInputReel

                        postId={post._id}
                        placeholder={
                            replyState ? `Trả lời @${replyState.parentUsername}...` : "Thêm bình luận..."
                        }
                        parentId={replyState?.parentId}
                        initialContent={replyState?.initialContent}
                        onReplyCancel={handleReplyCancel}
                    />
                </div>
            </div>
        </div>
    );

}
