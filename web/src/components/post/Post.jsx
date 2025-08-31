import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { 
  Heart, 
  MessageCircle, 
  Send, 
  Bookmark, 
  MoreHorizontal,
  HeartOff 
} from 'lucide-react';

import { likePost, deletePost } from '../../store/slices/postSlice';
import Avatar from '../ui/Avatar';
import Button from '../ui/Button';
import { Card } from '../ui/Card';
import { cn } from '../../lib/utils';

const Post = ({ post }) => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const [showComments, setShowComments] = useState(false);
  const [showOptions, setShowOptions] = useState(false);

  const handleLike = () => {
    dispatch(likePost(post._id));
  };

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this post?')) {
      dispatch(deletePost(post._id));
    }
  };

  const formatDate = (date) => {
    const now = new Date();
    const postDate = new Date(date);
    const diffInSeconds = Math.floor((now - postDate) / 1000);

    if (diffInSeconds < 60) return 'just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d`;
    
    return postDate.toLocaleDateString();
  };

  if (!post) return null;

  return (
    <Card className="mb-6 max-w-lg mx-auto">
      {/* Post Header */}
      <div className="flex items-center justify-between p-4 pb-3">
        <Link 
          to={`/profile/${post.author?.username}`}
          className="flex items-center space-x-3"
        >
          <Avatar
            src={post.author?.avatar}
            alt={post.author?.username}
            size="sm"
          />
          <div>
            <p className="font-semibold text-sm text-gray-900 dark:text-white">
              {post.author?.username}
            </p>
            {post.location && (
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {post.location}
              </p>
            )}
          </div>
        </Link>
        
        <div className="relative">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowOptions(!showOptions)}
          >
            <MoreHorizontal className="w-4 h-4" />
          </Button>
          
          {showOptions && (
            <div className="absolute right-0 top-8 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg py-1 z-10">
              {user?._id === post.author?._id && (
                <>
                  <button
                    onClick={handleDelete}
                    className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    Delete
                  </button>
                  <button className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">
                    Edit
                  </button>
                </>
              )}
              <button className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">
                Report
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Post Image */}
      {post.image && (
        <div className="relative">
          <img
            src={post.image}
            alt={post.caption}
            className="w-full h-auto max-h-96 object-cover"
          />
        </div>
      )}

      {/* Post Actions */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLike}
              className="p-0"
            >
              {post.isLiked ? (
                <Heart className="w-6 h-6 text-red-500 fill-current" />
              ) : (
                <HeartOff className="w-6 h-6" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowComments(!showComments)}
              className="p-0"
            >
              <MessageCircle className="w-6 h-6" />
            </Button>
            <Button variant="ghost" size="sm" className="p-0">
              <Send className="w-6 h-6" />
            </Button>
          </div>
          <Button variant="ghost" size="sm" className="p-0">
            <Bookmark className="w-6 h-6" />
          </Button>
        </div>

        {/* Likes Count */}
        {post.likes > 0 && (
          <p className="font-semibold text-sm text-gray-900 dark:text-white mb-2">
            {post.likes} {post.likes === 1 ? 'like' : 'likes'}
          </p>
        )}

        {/* Caption */}
        {post.caption && (
          <div className="mb-2">
            <Link 
              to={`/profile/${post.author?.username}`}
              className="font-semibold text-sm text-gray-900 dark:text-white mr-2"
            >
              {post.author?.username}
            </Link>
            <span className="text-sm text-gray-900 dark:text-white">
              {post.caption}
            </span>
          </div>
        )}

        {/* Comments */}
        {post.commentsCount > 0 && !showComments && (
          <button
            onClick={() => setShowComments(true)}
            className="text-sm text-gray-500 dark:text-gray-400 mb-2"
          >
            View all {post.commentsCount} comments
          </button>
        )}

        {/* Timestamp */}
        <p className="text-xs text-gray-500 dark:text-gray-400 uppercase">
          {formatDate(post.createdAt)}
        </p>
      </div>

      {/* Comments Section */}
      {showComments && (
        <div className="border-t border-gray-200 dark:border-gray-700 p-4">
          <div className="space-y-3 mb-4">
            {post.comments?.map((comment) => (
              <div key={comment._id} className="flex space-x-2">
                <Avatar
                  src={comment.author?.avatar}
                  alt={comment.author?.username}
                  size="xs"
                />
                <div className="flex-1">
                  <Link 
                    to={`/profile/${comment.author?.username}`}
                    className="font-semibold text-sm text-gray-900 dark:text-white mr-2"
                  >
                    {comment.author?.username}
                  </Link>
                  <span className="text-sm text-gray-900 dark:text-white">
                    {comment.content}
                  </span>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {formatDate(comment.createdAt)}
                  </p>
                </div>
              </div>
            ))}
          </div>
          
          {/* Add Comment */}
          <div className="flex space-x-2">
            <Avatar
              src={user?.avatar}
              alt={user?.username}
              size="xs"
            />
            <input
              type="text"
              placeholder="Add a comment..."
              className="flex-1 text-sm bg-transparent border-none outline-none placeholder-gray-500 dark:placeholder-gray-400"
            />
            <Button variant="ghost" size="sm" className="text-blue-500">
              Post
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
};

export default Post;
