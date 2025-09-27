import { useState } from "react";

import { useQueryClient } from "@tanstack/react-query";

import { USER_QUERY_KEYS } from "@/hooks/useUser";

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

  // Post options handlers
  const handleOptionsClick = () => {
    console.log("Post options clicked for:", post?._id);
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
    if (confirm("Bạn có chắc chắn muốn xóa bài viết này?")) {
      console.log("Delete post:", postId);
      setShowPostOptions(false);
      // TODO: Implement delete post functionality
    }
  };

  const handlePostReport = (post) => {
    console.log("Report post:", post._id);
    setShowPostOptions(false);
    alert(`Đã báo cáo bài viết của ${post.user.username}`);
    // TODO: Implement report post functionality
  };

  const handleCopyLink = (post) => {
    const url = `${window.location.origin}/post/${post._id}`;
    navigator.clipboard.writeText(url);
    setShowPostOptions(false);
    alert("Đã sao chép liên kết!");
  };

  const handleShare = (post, onShareClick) => {
    setShowPostOptions(false);
    if (onShareClick) {
      onShareClick(post);
    }
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
    handleUserClick,
  };
};
