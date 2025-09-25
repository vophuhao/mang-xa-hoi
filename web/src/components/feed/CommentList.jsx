import { MessageCircle } from "lucide-react";

import { useCommentActions, useComments } from "@/hooks/useComment";

import CommentItem from "./CommentItem";

const CommentList = ({ postId, currentUserId, post, onUsernameClick }) => {
  const { data: comments, isLoading, error } = useComments(postId);
  const { likeComment, deleteComment } = useCommentActions();

  // Create a fake comment object for post caption
  const createCaptionComment = (post) => {
    if (!post?.caption) return null;

    return {
      _id: `caption-${post._id}`,
      content: post.caption,
      user: post.user,
      createdAt: post.createdAt,
      likesCount: 0,
      isLikedByCurrentUser: false,
      isCaption: true, // Flag to identify this as a caption
    };
  };

  const handleReply = (comment) => {
    // Scroll to comment input or focus it
    const commentInput = document.querySelector("[data-comment-input]");
    if (commentInput) {
      commentInput.focus();
      commentInput.value = `@${comment.user.username} `;
    }
  };

  const handleLike = (commentId) => {
    likeComment(commentId, { postId });
  };

  const handleDelete = (commentId) => {
    if (confirm("Bạn có chắc chắn muốn xóa bình luận này?")) {
      deleteComment(commentId, { postId });
    }
  };

  const handleReport = (comment) => {
    // TODO: Implement report functionality
    console.log("Report comment:", comment._id);
    alert(`Đã báo cáo bình luận của ${comment.user.username}`);
  };

  if (isLoading) {
    return (
      <div className="flex-1 space-y-4 p-2">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex animate-pulse items-start space-x-3">
            <div className="h-8 w-8 rounded-full bg-gray-300 dark:bg-gray-600"></div>
            <div className="flex-1 space-y-2">
              <div className="h-4 w-3/4 rounded bg-gray-300 dark:bg-gray-600"></div>
              <div className="h-3 w-1/2 rounded bg-gray-300 dark:bg-gray-600"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 p-2 text-center text-red-500">
        Không thể tải bình luận. Vui lòng thử lại.
      </div>
    );
  }

  if (!comments?.data?.length && !post?.caption) {
    return (
      <div className="flex-1 p-2 text-center text-gray-500 dark:text-gray-400">
        <MessageCircle size={48} className="mx-auto mb-4 opacity-50" />
        <p>Chưa có bình luận nào.</p>
        <p className="text-sm">Hãy là người đầu tiên bình luận!</p>
      </div>
    );
  }

  return (
    <div className="scrollbar-hide max-h-130 flex-1 space-y-1 overflow-y-auto p-2">
      {/* Show caption as first comment if exists */}
      {post?.caption && (
        <CommentItem
          key={`caption-${post._id}`}
          comment={createCaptionComment(post)}
          currentUserId={currentUserId}
          onLike={() => {}} // Caption can't be liked
          onReply={() => {}} // Caption can't be replied to
          onDelete={() => {}} // Caption can't be deleted here
          onReport={() => {}} // Caption can't be reported
          onUsernameClick={onUsernameClick}
          isCaption={true}
        />
      )}

      {/* Regular comments */}
      {comments?.data?.map((comment) => (
        <CommentItem
          key={comment._id}
          comment={comment}
          currentUserId={currentUserId}
          onLike={handleLike}
          onReply={handleReply}
          onDelete={handleDelete}
          onReport={handleReport}
          onUsernameClick={onUsernameClick}
        />
      ))}
    </div>
  );
};

export default CommentList;
