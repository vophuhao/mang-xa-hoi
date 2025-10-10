import { useEffect, useState } from "react";

import { useNavigate, useParams } from "react-router-dom";

import PostModal from "@/components/feed/PostModal";
import { useGetPost } from "@/hooks/usePost";

/**
 * PostDetail component - handles Instagram-style URL: /:username/p/:postId
 * Opens the post in a modal overlay with navigation back to previous page
 */
const PostDetail = () => {
  const { username, postId } = useParams();
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const {
    data: postResponse,
    isLoading,
    error,
  } = useGetPost(postId, {
    enabled: !!postId,
  });

  const post = postResponse?.data;

  // Open modal when component mounts and post is loaded
  useEffect(() => {
    if (post && !isLoading) {
      setIsModalOpen(true);
    }
  }, [post, isLoading]);

  // Handle modal close - navigate back
  const handleCloseModal = () => {
    setIsModalOpen(false);
    // Navigate back to previous page or user profile
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate(`/${username}`);
    }
  };

  // Handle username click
  const handleUsernameClick = (clickedUsername) => {
    setIsModalOpen(false);
    navigate(`/${clickedUsername}`);
  };

  // Handle share click
  const handleShareClick = (post) => {
    console.log("Share post:", post._id);
    // TODO: Implement share functionality
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="bg-opacity-75 flex h-screen items-center justify-center bg-black">
        <div className="flex flex-col items-center space-y-4">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
          <p className="text-white">Đang tải bài viết...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="bg-opacity-75 flex h-screen items-center justify-center bg-black">
        <div className="flex flex-col items-center space-y-4 text-center">
          <div className="text-white">
            <h2 className="text-xl font-semibold">Không tìm thấy bài viết</h2>
            <p className="mt-2 text-gray-300">Bài viết này có thể đã bị xóa hoặc không tồn tại.</p>
          </div>
          <button
            onClick={handleCloseModal}
            className="rounded-lg bg-white px-4 py-2 text-black hover:bg-gray-200"
          >
            Quay lại
          </button>
        </div>
      </div>
    );
  }

  // Post not found
  if (!post) {
    return (
      <div className="bg-opacity-75 flex h-screen items-center justify-center bg-black">
        <div className="flex flex-col items-center space-y-4 text-center">
          <div className="text-white">
            <h2 className="text-xl font-semibold">Bài viết không tồn tại</h2>
            <p className="mt-2 text-gray-300">
              Liên kết này có thể không hợp lệ hoặc bài viết đã bị xóa.
            </p>
          </div>
          <button
            onClick={handleCloseModal}
            className="rounded-lg bg-white px-4 py-2 text-black hover:bg-gray-200"
          >
            Quay lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-opacity-75 fixed inset-0 z-50 bg-black">
      <PostModal
        post={post}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onUsernameClick={handleUsernameClick}
        onShareClick={handleShareClick}
      />
    </div>
  );
};

export default PostDetail;
