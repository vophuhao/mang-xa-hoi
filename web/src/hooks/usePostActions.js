import { useState } from "react";

import { useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";

import { USER_QUERY_KEYS } from "@/hooks/useUser";
import { deletePost } from "@/lib/api";

/**
 * Custom hook for post-related actions
 * Centralizes logic shared between PostCard and PostModal
 */
export const usePostActions = (post, callbacks = {}) => {
  const { onUsernameClick } = callbacks;
  const queryClient = useQueryClient();
  const currentUserData = queryClient.getQueryData(USER_QUERY_KEYS.currentUser);
  const currentUser = currentUserData?.data;

  // Modal states
  const [showPostOptions, setShowPostOptions] = useState(false);

  // Share modal states
  const [showShareModal, setShowShareModal] = useState(false);
  const [sharePostState, setSharePostState] = useState(null);
  const [shareCallback, setShareCallback] = useState(null);

  // Post options handlers
  const handleOptionsClick = () => {
    setShowPostOptions(true);
  };

  const handleCloseOptions = () => {
    setShowPostOptions(false);
  };

  const handlePostEdit = (post) => {
    console.log("Edit post:", post._id);
    setShowPostOptions(false);
    // TODO: Implement edit post functionality
  };

  const handlePostDelete = (postId) => {
    return deletePost(postId)
      .then(() => {
        toast.success("Đã xóa bài viết", {
          position: "bottom-center",
          autoClose: 2500,
          hideProgressBar: true,
          closeOnClick: true,
          pauseOnHover: false,
          draggable: false,
        });
      })
      .catch((error) => {
        console.error("Failed to delete post:", error);
        toast.error("Không thể xóa bài viết", {
          position: "bottom-center",
          autoClose: 2500,
          hideProgressBar: true,
          closeOnClick: true,
          pauseOnHover: false,
          draggable: false,
        });
      })
      .finally(() => {
        setShowPostOptions(false);
      });
  };

  const handlePostReport = (post) => {
    console.log("Report post:", post._id);
    setShowPostOptions(false);
    alert(`Đã báo cáo bài viết của ${post.user.userId}`);
    // TODO: Implement report post functionality
  };

  const handleCopyLink = async (post) => {
    try {
      // Create Instagram-style URL: /username/p/postId
      const userId = post?.user?.userId || "user";
      const postId = post?._id;

      if (!postId) {
        throw new Error("Post ID not found");
      }

      const url = `${window.location.origin}/${userId}/p/${postId}`;

      // Use modern clipboard API with fallback
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(url);
      } else {
        // Fallback for older browsers
        const textArea = document.createElement("textarea");
        textArea.value = url;
        textArea.style.position = "fixed";
        textArea.style.left = "-999999px";
        textArea.style.top = "-999999px";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
      }

      setShowPostOptions(false);
      toast.success("Đã sao chép liên kết của bài viết", {
        position: "bottom-center",
        autoClose: 2500,
        hideProgressBar: true,
        closeOnClick: true,
        pauseOnHover: false,
        draggable: false,
      });
    } catch (error) {
      console.error("Failed to copy link:", error);
      setShowPostOptions(false);
      toast.error("Không thể sao chép liên kết", {
        position: "bottom-center",
        autoClose: 2500,
        hideProgressBar: true,
        closeOnClick: true,
        pauseOnHover: false,
        draggable: false,
      });
    }
  };

  // open share modal (Instagram style)
  const handleShare = (post, onShareClick) => {
    setShowPostOptions(false);
    setSharePostState(post);
    setShareCallback(() => onShareClick || null);
    setShowShareModal(true);
  };

  const handleCloseShare = () => {
    setShowShareModal(false);
    setSharePostState(null);
    setShareCallback(null);
  };

  // User interaction handlers
  const handleUserClick = (username) => {
    console.log("User clicked:", username);
    if (onUsernameClick && username) {
      onUsernameClick(username);
    }
  };

  return {
    currentUser,
    showPostOptions,
    handleOptionsClick,
    handleCloseOptions,
    handlePostEdit,
    handlePostDelete,
    handlePostReport,
    handleCopyLink,
    handleShare,
    showShareModal,
    sharePostState,
    shareCallback,
    handleCloseShare,
    handleUserClick,
  };
};
