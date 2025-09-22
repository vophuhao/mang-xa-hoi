import PostActions from "./PostActions";
import PostCaption from "./PostCaption";
import PostComments from "./PostComments";
import PostHeader from "./PostHeader";
import PostMedia from "./PostMedia";
import PostTimestamp from "./PostTimestamp";

const PostCard = ({ post, onUsernameClick, onTagClick, onCommentClick, onShareClick }) => {
  if (!post) return null;

  const handleOptionsClick = () => {
    // TODO: Show post options menu
    console.log("Options clicked for post:", post._id);
  };

  const handleViewAllComments = () => {
    onCommentClick?.(post);
  };

  return (
    <article className="mb-6 space-y-2 overflow-hidden bg-transparent">
      {/* Post Header */}
      <PostHeader user={post.user} location={post.location} onOptionsClick={handleOptionsClick} />

      {/* Post Media */}
      <PostMedia
        mediaUrls={post.mediaUrls}
        mediaType={post.mediaType}
        altText={`Post by ${post.user?.username}`}
      />

      <div className="px-0">
        {/* Post Actions */}
        <PostActions
          post={post}
          onCommentClick={() => handleViewAllComments()}
          onShareClick={() => onShareClick?.(post)}
        />

        {/* Post Caption */}
        <PostCaption
          user={post.user}
          caption={post.caption}
          onTagClick={onTagClick}
          onUsernameClick={onUsernameClick}
        />

        {/* Post Comments */}
        <PostComments post={post} onViewAllComments={handleViewAllComments} />

        {/* Post Timestamp */}
        <PostTimestamp createdAt={post.createdAt} />
      </div>
    </article>
  );
};

export default PostCard;
