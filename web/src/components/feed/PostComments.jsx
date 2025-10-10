const PostComments = ({ post, onViewAllComments }) => {
  const { commentCount } = post;

  if (commentCount === 0) return null;

  return (
    <>
      <button
        onClick={onViewAllComments}
        className="text-sm font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
      >
        {commentCount === 1
          ? "Xem 1 bình luận"
          : `Xem tất cả ${commentCount.toLocaleString()} bình luận`}
      </button>
    </>
  );
};

export default PostComments;
