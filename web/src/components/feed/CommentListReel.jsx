import { MessageCircle, Plus } from "lucide-react";

import { useCommentActions, useInfiniteComments } from "@/hooks/useComment";
import { navigate } from "@/lib/navigation";

import CommentItem from "./CommentItem";
import PostCaption from "./PostCaption";

const CommentListReel = ({ postId, currentUserId, post, onUsernameClick, onReplyStateChange }) => {
  const {
    data: commentsData,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteComments(postId, 10);
  const { likeComment, deleteComment } = useCommentActions();

  // Flatten all pages of comments into a single array
  // Server returns { success, data: [...], pagination } format
  const comments = commentsData?.pages?.flatMap((page) => page.data || []) || [];

  console.log("Infinite comments debug:", {
    commentsData,
    pages: commentsData?.pages,
    comments,
    hasNextPage,
    isLoading,
  });

  console.log("hasNextPage value:", hasNextPage);
  console.log("typeof hasNextPage:", typeof hasNextPage);

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

  const handleReply = (targetComment, replyingToComment = null) => {
    // Set reply state for parent component to handle
    if (onReplyStateChange) {
      // If replying to a reply, mention the reply author but use the parent comment ID
      const mentionUsername = replyingToComment
        ? replyingToComment.user.userId
        : targetComment.user.userId;

      onReplyStateChange({
        parentId: targetComment._id,
        parentUsername: targetComment.user.userId,
        initialContent: `@${mentionUsername} `,
      });
    }
  };

  const handleLike = (commentId, additionalData) => {
    // additionalData contains: { postId, parentId, isLiked, likeCount }
    likeComment({
      commentId,
      postId: additionalData?.postId || postId,
      parentId: additionalData?.parentId,
    });
  };

  const onTagClick = (tag) => {
    navigate(`/hashtags/${tag}`);
  }
  const handleDelete = (commentId, additionalData) => {
    // additionalData contains: { postId, parentId, isReply }
    deleteComment({
      commentId,
      postId: additionalData?.postId || postId,
      parentId: additionalData?.parentId,
    });
  };

  const handleReport = (comment) => {
    // TODO: Implement report functionality
    console.log("Report comment:", comment._id);
    alert(`Đã báo cáo bình luận của ${comment.user.userId}`);
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

  if (!comments?.length && !post?.caption) {
    return (
      <div className="flex-1 p-2 text-center text-gray-500 dark:text-gray-400">
        <MessageCircle size={48} className="mx-auto mb-4 opacity-50" />
        <p>Chưa có bình luận nào.</p>
        <p className="text-sm">Hãy là người đầu tiên bình luận!</p>
      </div>
    );
  }

  return (
    <div className="scrollbar-hide max-h-133 flex-1 space-y-1 overflow-y-auto p-2">

    
      {/* Regular comments */}
      {comments?.map((comment) => (
        <CommentItem
          key={comment._id}
          comment={comment}
          currentUserId={currentUserId}
          onLike={handleLike}
          onReply={handleReply}
          onDelete={handleDelete}
          onReport={handleReport}
          onUsernameClick={onUsernameClick}
          postId={postId}
        />
      ))}

      {/* Load More Button */}
      {hasNextPage && (
        <div className="flex justify-center py-3">
          <button
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 transition-colors hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-gray-800 dark:hover:bg-gray-700"
            aria-label="Tải thêm bình luận"
          >
            {isFetchingNextPage ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-500 border-t-transparent"></div>
            ) : (
              <Plus size={16} className="text-gray-600 dark:text-gray-300" />
            )}
          </button>
        </div>
      )}
    </div>
  );
};

export default CommentListReel;
