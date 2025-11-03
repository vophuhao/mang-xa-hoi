import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";

import { useQueries } from "@tanstack/react-query";
import { MoreHorizontal, Trash2 } from 'lucide-react';

import ConfirmDialog from "@/components/common/ConfirmDialog";
import OnlineStatusIndicator from "@/components/common/OnlineStatusIndicator";
import useAuth from "@/hooks/useAuth";
import useOnlineUsers from "@/hooks/useOnlineUsers";
import { POST_QUERY_KEYS } from "@/hooks/usePost";
import useSocket from "@/hooks/useSocket";
import { getPostById, saveCallHistory, getUserLastOnline } from "@/lib/api";
import { formatLastOnline } from "@/utils/timeUtils";

export default function ChatWindow({
  selectedChat,
  groupedMessages = [],
  messagesContainerRef,
  messagesEndRef,
  isOwnMessage,
  handleMarkAsRead,
  handleReaction,
  handleDeleteMessage,
  selectedImages,
  handleRemoveImage,
  imageInputRef,
  handleImageChange,
  newMessage,
  setNewMessage,
  sendingMessage,
  handleSendMessage,
  user,
  conversationFullyLoaded = false,
  hasNextPage = false,
  loadMoreMessages,
  isLoadingMore = false,
}) {
  const { user: currentUser } = useAuth();
  const { isUserOnline } = useOnlineUsers();
  const { socket } = useSocket();

  // ✅ SỬA: Định nghĩa tất cả state và variables trước
  const [messageContextMenu, setMessageContextMenu] = useState(null);
  const [partnerLastOnline, setPartnerLastOnline] = useState(null);

  // ✅ THÊM: State cho confirm dialog
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    messageId: null,
  });

  // ✅ SỬA: Định nghĩa isPartnerOnline TRƯỚC khi sử dụng
  const isPartnerOnline = useMemo(() => {
    return selectedChat?.partner?._id ? isUserOnline(selectedChat.partner._id) : false;
  }, [selectedChat?.partner?._id, isUserOnline]);

  // ✅ THÊM: Fetch lastOnline khi selectedChat thay đổi hoặc partner offline
  useEffect(() => {
    const fetchLastOnline = async () => {
      if (!selectedChat?.partner?._id || isPartnerOnline) {
        setPartnerLastOnline(null);
        return;
      }
      
      try {
        const response = await getUserLastOnline(selectedChat.partner._id);
        setPartnerLastOnline(response.data?.lastOnline);
      } catch (error) {
        console.error('Error fetching last online:', error);
        setPartnerLastOnline(null);
      }
    };
    
    fetchLastOnline();
  }, [selectedChat?.partner?._id, isPartnerOnline]);

  // ✅ THÊM: Clear lastOnline khi user comes online
  useEffect(() => {
    if (isPartnerOnline) {
      setPartnerLastOnline(null);
    }
  }, [isPartnerOnline]);

  // ✅ Existing code for post queries
  const postIds = useMemo(() => {
    return groupedMessages
      .filter(item => item.type === "message")
      .map(item => item.message)
      .filter(message => 
        message.messageType === "post_share" && 
        (message.sharedPostId || (typeof message.sharedPost === "string"))
      )
      .map(message => 
        message.sharedPostId || 
        (typeof message.sharedPost === "string" ? message.sharedPost : null)
      )
      .filter(Boolean);
  }, [groupedMessages]);

  const postQueries = useQueries({
    queries: postIds.map(postId => ({
      queryKey: [POST_QUERY_KEYS.POST, postId],
      queryFn: () => getPostById(postId),
      enabled: !!postId,
      staleTime: 5 * 60 * 1000,
      cacheTime: 10 * 60 * 1000,
    })),
  });

  const postMap = useMemo(() => {
    const map = {};
    postQueries.forEach((query, index) => {
      if (query.data) {
        map[postIds[index]] = query.data;
      }
    });
    return map;
  }, [postQueries, postIds]);

  // ✅ Other existing functions
  const bubbleMaxWidth = "75%";

  const startCall = async () => {
    if (!isPartnerOnline || !selectedChat?.partner?._id) return;

    try {
      const callData = {
        callerId: currentUser?.data?._id,
        receiverId: selectedChat.partner._id,
        callerName: currentUser?.data?.userId || currentUser?.data?.username,
        receiverName: selectedChat.partner.userId || selectedChat.partner.username,
        timestamp: new Date().toISOString(),
      };

      if (socket) {
        socket.emit("call_request", callData);
        await saveCallHistory({
          callerId: callData.callerId,
          receiverId: callData.receiverId,
          status: "initiated",
          startTime: callData.timestamp,
        });
      }
    } catch (error) {
      console.error("Error starting call:", error);
    }
  };

  // ✅ SỬA: Handle delete message với popup
  const handleDeleteClick = (messageId) => {
    setMessageContextMenu(null);
    setConfirmDialog({
      isOpen: true,
      messageId,
    });
  };

  const handleDeleteConfirm = async () => {
    const { messageId } = confirmDialog;
    try {
      const result = await handleDeleteMessage(messageId);
      if (result && result.success) {
        console.log('Message deleted successfully');
      } else {
        alert('Không thể xóa tin nhắn: ' + (result?.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Delete message error:', error);
      alert('Không thể xóa tin nhắn: ' + error.message);
    }
  };

  // Helper functions
  const getCallStatusText = (status, isOwn) => {
    const statusMap = {
      initiated: isOwn ? "Cuộc gọi đi" : "Cuộc gọi đến",
      answered: "Cuộc gọi",
      declined: isOwn ? "Cuộc gọi bị từ chối" : "Đã từ chối cuộc gọi",
      missed: isOwn ? "Cuộc gọi nhỡ" : "Cuộc gọi nhỡ",
      ended: "Cuộc gọi đã kết thúc",
    };
    return statusMap[status] || "Cuộc gọi";
  };

  const renderTextWithBreaks = (text) => {
    if (!text) return "";
    return text.split('\n').map((line, index) => (
      <span key={index}>
        {line}
        {index < text.split('\n').length - 1 && <br />}
      </span>
    ));
  };

  const isVideoUrl = (url) => {
    if (!url) return false;
    const videoExtensions = ['.mp4', '.mov', '.avi', '.mkv', '.webm'];
    return videoExtensions.some(ext => url.toLowerCase().includes(ext));
  };

  const cloudinaryVideoThumbnail = (videoUrl) => {
    if (!videoUrl || !videoUrl.includes('cloudinary')) return null;
    try {
      return videoUrl.replace('/video/upload/', '/video/upload/c_thumb,w_300,h_200/');
    } catch (error) {
      return null;
    }
  };

  // ✅ Early return nếu không có selectedChat
  if (!selectedChat) {
    return (
      <div className="flex flex-1 items-center justify-center bg-white dark:bg-gray-900">
        <div className="text-center">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            Chọn một cuộc hội thoại
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            Chọn một cuộc hội thoại từ danh sách để bắt đầu nhắn tin
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-w-0 flex-1 flex-col bg-white dark:bg-gray-900">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-300 bg-white p-3 md:p-4 dark:border-gray-700 dark:bg-gray-900">
        <div className="flex items-center space-x-2 md:space-x-3">
          <div className="relative">
            <a href={`/${selectedChat.partner?.userId || selectedChat.partner?._id}`}>
              <img
                src={
                  selectedChat.partner?.avatarUrl ||
                  `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedChat.partner?.userId || selectedChat.partner?.username || "User")}&background=random`
                }
                alt={selectedChat.partner?.userId || selectedChat.partner?.username || "User"}
                className="h-10 w-10 rounded-full object-cover"
              />
            </a>
            <OnlineStatusIndicator
              isOnline={isPartnerOnline}
              size="sm"
              className="right-0 bottom-0"
            />
          </div>

          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-sm font-bold text-gray-900 md:text-base dark:text-white">
                {selectedChat.partner?.userId || selectedChat.partner?.username || "Unknown User"}
                {selectedChat.partner?.isVerified && (
                  <span className="ml-1 text-blue-500 dark:text-blue-400">✓</span>
                )}
              </h3>
              {isPartnerOnline && (
                <span className="hidden text-xs font-medium text-green-600 md:inline dark:text-green-400">
                  • Online
                </span>
              )}
            </div>
            <p className="text-xs text-gray-500 md:text-sm dark:text-gray-400">
              @{selectedChat.partner?.username || "unknown"}
              {!isPartnerOnline && (
                <span className="ml-2 text-red-500 dark:text-red-400">
                  • {partnerLastOnline ? formatLastOnline(partnerLastOnline) : "Offline"}
                </span>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            type="button"
            title={isPartnerOnline ? "Gọi" : "Người dùng không trực tuyến"}
            onClick={startCall}
            disabled={!isPartnerOnline}
            className={`rounded-full p-2 text-lg transition-colors ${
              isPartnerOnline
                ? "cursor-pointer bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700"
                : "cursor-not-allowed bg-gray-50 text-gray-400 dark:bg-gray-800 dark:text-gray-600"
            }`}
          >
            📞
          </button>
        </div>
      </div>

      {/* Messages Area */}
      <div
        ref={messagesContainerRef}
        className="flex-1 space-y-3 overflow-y-auto bg-white p-3 md:p-4 dark:bg-gray-900"
      >
        <div>
          {hasNextPage && (
            <div className="flex justify-center py-4">
              {isLoadingMore ? (
                <div className="flex items-center space-x-2 text-gray-500 dark:text-gray-400">
                  <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-gray-400 dark:border-gray-500"></div>
                  <span className="text-sm">Đang tải...</span>
                </div>
              ) : (
                <div className="text-center text-xs text-gray-400 dark:text-gray-500">
                  Kéo xuống để tải thêm
                </div>
              )}
            </div>
          )}

          {conversationFullyLoaded && (
            <div className="mb-4 flex justify-center">
              <div className="flex w-full flex-col items-center p-4 md:w-72 md:p-6">
                <img
                  src={
                    selectedChat.partner?.avatarUrl ||
                    `https://ui-avatars.com/api/?name=${selectedChat.partner?.userId || selectedChat.partner?.username || "User"}&background=random`
                  }
                  alt={selectedChat.partner?.userId || selectedChat.partner?.username || "User"}
                  className="h-16 w-16 rounded-full border-2 border-gray-200 object-cover md:h-24 md:w-24 dark:border-gray-700"
                />
                <h2 className="mt-4 text-base font-semibold text-gray-900 md:text-lg dark:text-white">
                  {selectedChat.partner?.userId || selectedChat.partner?.username || "Unknown User"}
                </h2>
                {selectedChat.partner?.bio && (
                  <p className="text-center text-xs text-gray-500 md:text-sm dark:text-gray-400">
                    {selectedChat.partner.bio}
                  </p>
                )}
                <a
                  href={`/${selectedChat.partner?.userId || selectedChat.partner?._id}`}
                  className="mt-4 inline-block rounded-lg bg-gray-100 px-4 py-2 text-xs font-medium text-gray-900 hover:bg-gray-200 md:text-sm dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700"
                >
                  Xem trang cá nhân
                </a>
              </div>
            </div>
          )}

          {/* ✅ Messages rendering với dropdown menu */}
          {groupedMessages.map((item, idx) => {
            if (item.type === "date") {
              return (
                <div key={`date-${idx}`} className="my-4 flex items-center">
                  <div className="flex-grow border-gray-300 dark:border-gray-700"></div>
                  <span className="mx-4 rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                    {item.date}
                  </span>
                  <div className="flex-grow border-gray-300 dark:border-gray-700"></div>
                </div>
              );
            }

            const message = item.message;
            const isOwn = isOwnMessage(message);

            return (
              <div key={message._id} className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
                {!isOwn && (
                  <img
                    src={
                      selectedChat.partner?.avatarUrl ||
                      `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedChat.partner?.username || "User")}&background=random`
                    }
                    alt={selectedChat.partner?.username || "User"}
                    className="mt-1 mr-2 h-8 w-8 rounded-full object-cover"
                  />
                )}

                <div className="group relative mt-2 mb-2 flex items-start">
                  
                  {isOwn && (
                    <div className="relative mr-2 flex items-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setMessageContextMenu(messageContextMenu === message._id ? null : message._id);
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-all"
                        title="Tùy chọn"
                      >
                        <MoreHorizontal className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                      </button>

                      {/* Dropdown menu */}
                      {messageContextMenu === message._id && (
                        <div className="absolute left-0 top-full z-10 mt-1 w-48 rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 dark:bg-gray-800">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              // ✅ SỬA: Gọi handleDeleteClick thay vì handleDelete
                              handleDeleteClick(message._id);
                            }}
                            className="flex w-full items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                          >
                            <Trash2 className="mr-3 h-4 w-4" />
                            Xóa tin nhắn
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Message content */}
                  <div className="flex-1">
                    {/* Call messages */}
                    {message.messageType === "call" && message.callData ? (
                      <div className={`flex w-full ${isOwn ? "justify-end" : "justify-start"}`}>
                        <div
                          className={`max-w-xs cursor-pointer rounded-xl px-3 py-2 leading-5 break-words md:px-4 md:py-3 ${
                            isOwn
                              ? "bg-blue-500 text-white dark:bg-blue-600"
                              : "border border-gray-200 bg-[#EFEFEF] text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                          }`}
                          onClick={() => {
                            try {
                              if (!isOwn && !message.isRead && typeof handleMarkAsRead === "function") {
                                handleMarkAsRead(message._id);
                              }
                            } catch (err) {
                              console.error(err);
                            }
                          }}
                        >
                          <div className="flex items-center space-x-2">
                            <div className="flex-1">
                              <div className={`text-xs font-medium md:text-sm ${isOwn ? "text-white" : "text-gray-900 dark:text-white"}`}>
                                {getCallStatusText(message.callData.status, isOwn)}
                              </div>
                              <div className={`mt-1 text-xs ${isOwn ? "text-blue-100 dark:text-blue-200" : "text-gray-500 dark:text-gray-400"}`}>
                                {new Date(message.createdAt).toLocaleString("vi-VN", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                  day: "2-digit",
                                  month: "2-digit",
                                })}
                              </div>
                            </div>

                            {/* Call again button */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (isPartnerOnline) {
                                  startCall();
                                }
                              }}
                              disabled={!isPartnerOnline}
                              title={isPartnerOnline ? "Gọi lại" : "Người dùng không trực tuyến"}
                              className={`rounded-full p-1 transition-colors ${
                                isPartnerOnline
                                  ? `hover:bg-opacity-20 cursor-pointer hover:bg-white ${isOwn ? "text-white" : "text-gray-600"}`
                                  : "cursor-not-allowed text-gray-400"
                              }`}
                            >
                              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : 
                    
                    /* Post share messages */
                    message.messageType === "post_share" && (message.sharedPost || message.sharedPostId || message.content) ? (
                      <div className="flex w-full flex-col space-y-2">
                        <div className={`flex w-full ${isOwn ? "justify-end" : "justify-start"}`}>
                          <div className="overflow-hidden rounded-lg border bg-[#1f2937] text-white shadow-sm">
                            {/* Post share content*/}
                            {(() => {
                              const postId = message.sharedPost && typeof message.sharedPost === "string"
                                ? message.sharedPost
                                : (message.sharedPost && message.sharedPost._id) || message.sharedPostId;
                              const populatedPost = message.sharedPost && typeof message.sharedPost === "object"
                                ? message.sharedPost
                                : postMap[postId] || null;
                              const post = populatedPost;
                              const author = post?.user || post?.author || post?.postedBy || post?.owner || (message.sharedPost && message.sharedPost.user) || {};
                              const mediaUrls = post?.thumbnailUrl || post?.mediaUrls || (post?.images && (post.images[0]?.url || post.images[0])) || (post?.media && (post.media[0]?.url || post.media[0])) || message.mediaUrl || null;
                              const firstMediaUrl = Array.isArray(mediaUrls) ? mediaUrls[0] : mediaUrls;
                              let previewImgSrc = null;
                              if (firstMediaUrl) {
                                if (isVideoUrl(firstMediaUrl)) previewImgSrc = cloudinaryVideoThumbnail(firstMediaUrl) || null;
                                else previewImgSrc = firstMediaUrl;
                              }
                              const caption = post?.caption || "";
                              
                              return (
                                <>
                                  <a href={`/${author?.userId || author?.username || author?._id || ""}`} className="flex items-center space-x-3 px-3 py-2 hover:underline">
                                    <img src={author?.avatarUrl || `https://ui-avatars.com/api/?name=${author?.userId || author?.username || "User"}&background=random`} alt={author?.userId || author?.username || "user"} className="h-8 w-8 rounded-full object-cover" />
                                    <div className="text-sm font-medium">{author?.userId || author?.username || author?.displayName || "User"}</div>
                                  </a>
                                  <a href={`/${author?.userId || author?.username || author?._id || ""}/p/${postId || ""}`} className="inline-block">
                                    <div className="relative w-56 flex-shrink-0 overflow-hidden rounded-md bg-black sm:w-64">
                                      {previewImgSrc ? (
                                        <>
                                          <img src={previewImgSrc} alt="post preview" className="h-auto max-h-[70vh] w-full object-contain" loading="lazy" />
                                          {isVideoUrl(firstMediaUrl) && (
                                            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                                              <div className="bg-opacity-50 flex h-12 w-12 items-center justify-center rounded-full bg-black">
                                                <svg className="h-6 w-6 text-white" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                                                  <path d="M8 5v14l11-7z" />
                                                </svg>
                                              </div>
                                            </div>
                                          )}
                                        </>
                                      ) : (
                                        <div className="flex w-full items-center justify-center py-8 text-sm text-gray-200">Xem bài viết</div>
                                      )}
                                    </div>
                                  </a>
                                  {caption ? <div className="px-3 py-2 text-sm text-gray-100">{caption.length > 200 ? `${caption.slice(0, 200)}...` : caption}</div> : null}
                                </>
                              );
                            })()}
                          </div>
                        </div>

                        {/* Message content sau post share */}
                        {message.content && (
                          <div className={`flex w-full ${isOwn ? "justify-end" : "justify-start"}`}>
                            <div
                              className={`cursor-pointer rounded-xl px-3 py-2 leading-5 break-words md:px-4 ${isOwn ? "bg-blue-500 text-white dark:bg-blue-600" : "border border-gray-200 bg-[#EFEFEF] text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-white"}`}
                              style={{ maxWidth: bubbleMaxWidth, minWidth: 96 }}
                              onClick={() => {
                                try {
                                  if (!isOwn && !message.isRead && typeof handleMarkAsRead === "function")
                                    handleMarkAsRead(message._id);
                                } catch (err) {
                                  console.error(err);
                                }
                              }}
                              onDoubleClick={() => handleReaction(message._id, "❤️")}
                            >
                              <p className="text-xs md:text-sm">{renderTextWithBreaks(message.content)}</p>
                              {message.reactions && message.reactions.length > 0 && (
                                <div className="mt-1 flex space-x-1">
                                  {message.reactions.map((reaction, idx) => (
                                    <span key={idx} className="text-xs">{reaction.emoji}</span>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : 
                    
                    /* Media messages */
                    message.messageType === "media" && message.mediaUrl ? (
                      <div className={`flex w-full ${isOwn ? "justify-end" : "justify-start"}`}>
                        <div className="rounded-2xl px-0 py-0">
                          <div className="relative w-56 flex-shrink-0 overflow-hidden rounded-lg bg-black sm:w-64">
                            {message.mediaType === "image" ? (
                              <img
                                src={message.mediaUrl}
                                alt="Shared image"
                                className="h-auto max-h-[70vh] w-full object-contain"
                              />
                            ) : message.mediaType === "video" ? (
                              <video
                                src={message.mediaUrl}
                                controls
                                poster={cloudinaryVideoThumbnail(message.mediaUrl) || undefined}
                                className="h-auto max-h-[70vh] w-full"
                              />
                            ) : (
                              <div className="flex w-full items-center justify-center py-8 text-sm text-gray-200">
                                Không hỗ trợ media này
                              </div>
                            )}
                          </div>
                          {message.content && (
                            <p className="mt-2 text-xs text-gray-900 md:text-sm dark:text-white">
                              {message.content}
                            </p>
                          )}
                        </div>
                      </div>
                    ) : (
                      
                      /* Text messages */
                      <div className={`flex w-full ${isOwn ? "justify-end" : "justify-start"}`}>
                        <div
                          className={`cursor-pointer rounded-xl px-3 py-2 leading-5 break-words md:px-4 ${
                            isOwn
                              ? "bg-blue-500 text-white dark:bg-blue-600"
                              : "border border-gray-200 bg-[#EFEFEF] text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                          }`}
                          style={{ maxWidth: bubbleMaxWidth, minWidth: 96 }}
                          onClick={() => {
                            try {
                              if (!isOwn && !message.isRead && typeof handleMarkAsRead === "function")
                                handleMarkAsRead(message._id);
                            } catch (err) {
                              console.error(err);
                            }
                          }}
                          onDoubleClick={() => handleReaction(message._id, "❤️")}
                        >
                          {message.messageType === "text" && (
                            <p className="text-xs md:text-sm">
                              {renderTextWithBreaks(message.content)}
                            </p>
                          )}

                          {message.messageType === "location" && message.location && (
                            <div>
                              <p className="text-xs md:text-sm">📍 {message.location.name}</p>
                              <p className="text-xs opacity-75">
                                {message.location.coordinates[1]}, {message.location.coordinates[0]}
                              </p>
                            </div>
                          )}

                          {message.reactions && message.reactions.length > 0 && (
                            <div className="mt-1 flex space-x-1">
                              {message.reactions.map((reaction, idx) => (
                                <span key={idx} className="text-xs">
                                  {reaction.emoji}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Tooltip */}
                  <div className="pointer-events-none absolute -top-7 left-1/2 z-20 -translate-x-1/2 transform opacity-0 transition-opacity duration-150 group-hover:opacity-100">
                    <div className="rounded bg-gray-800 px-2 py-1 text-xs whitespace-nowrap text-white shadow-lg">
                      {new Date(message.createdAt).toLocaleTimeString("vi-VN", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                    <div className="mx-auto h-0 w-0 border-t-6 border-r-6 border-l-6 border-t-gray-800 border-r-transparent border-l-transparent"></div>
                  </div>
                </div>

                {isOwn && (
                  <img
                    src={
                      user?.data?.avatarUrl ||
                      `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.data?.userId || "You")}&background=random`
                    }
                    alt="You"
                    className="mt-1 ml-2 h-8 w-8 rounded-full object-cover"
                  />
                )}
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Click outside to close message context menu */}
      {messageContextMenu && (
        <div 
          className="fixed inset-0 z-5" 
          onClick={() => setMessageContextMenu(null)}
        />
      )}

      {/* ✅ THÊM: Confirm Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog({ isOpen: false, messageId: null })}
        onConfirm={handleDeleteConfirm}
        title="Xóa tin nhắn"
        message="Bạn có chắc chắn muốn xóa tin nhắn này? Hành động này không thể hoàn tác."
        confirmText="Xóa"
        cancelText="Hủy"
        type="danger"
      />

      {/* Input area - existing code... */}
      <form
        onSubmit={handleSendMessage}
        className="border-t border-gray-200 bg-white p-3 md:p-4 dark:border-gray-700 dark:bg-gray-900"
      >
        {selectedImages.length > 0 && (
          <div className="mb-2 flex space-x-2 overflow-x-auto">
            {selectedImages.map((img, idx) => (
              <div key={idx} className="relative flex-shrink-0">
                {img.mediaType === "image" ? (
                  <img
                    src={img.url}
                    alt="preview"
                    className="h-16 w-16 rounded border border-gray-300 object-cover md:h-20 md:w-20 dark:border-gray-600"
                  />
                ) : (
                  <video
                    src={img.url}
                    controls
                    className="h-16 w-16 rounded border border-gray-300 object-cover md:h-20 md:w-20 dark:border-gray-600"
                  />
                )}
                <button
                  type="button"
                  className="bg-opacity-50 dark:bg-opacity-80 hover:bg-opacity-70 absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-black text-sm text-white dark:bg-gray-800"
                  onClick={() => handleRemoveImage(idx)}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="flex w-full items-center">
          <div className="flex w-full items-center rounded-full border border-gray-300 bg-white px-3 py-2 dark:border-gray-600 dark:bg-gray-800">
            <button
              type="button"
              className="mr-2 flex-shrink-0 text-xl focus:outline-none md:text-2xl"
            >
              <span role="img" aria-label="emoji">
                😊
              </span>
            </button>
            <textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onInput={(e) => {
                e.target.style.height = "auto";
                e.target.style.height = e.target.scrollHeight + "px";
              }}
              placeholder="Nhắn tin..."
              rows={1}
              className="flex-1 resize-none overflow-hidden border-none bg-transparent text-sm text-gray-900 placeholder-gray-400 outline-none md:text-base dark:bg-gray-800 dark:text-white dark:placeholder-gray-500"
              disabled={sendingMessage}
            />
            <div className="ml-2 flex items-center space-x-1 md:space-x-2">
              {newMessage.trim().length > 0 || selectedImages.length > 0 ? (
                <span
                  className="ml-2 cursor-pointer px-2 py-1 text-sm font-semibold text-blue-500 select-none hover:text-blue-600 md:px-4 md:py-2 md:text-base dark:text-blue-400 dark:hover:text-blue-300"
                  onClick={() => !sendingMessage && handleSendMessage({ preventDefault: () => {} })}
                  role="button"
                >
                  {sendingMessage ? "Đang gửi..." : "Gửi"}
                </span>
              ) : (
                <>
                  <button
                    type="button"
                    className="text-lg hover:opacity-70 focus:outline-none md:text-xl"
                    title="Ghi âm"
                  >
                    🎤
                  </button>
                  <input
                    type="file"
                    accept="image/*,video/*"
                    multiple
                    style={{ display: "none" }}
                    ref={imageInputRef}
                    onChange={handleImageChange}
                  />
                  <button
                    type="button"
                    className="text-lg hover:opacity-70 focus:outline-none md:text-xl"
                    title="Chọn ảnh/video"
                    onClick={() => imageInputRef.current.click()}
                  >
                    🖼️
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}

const getCallStatusText = (status, isOwn) => {
  switch (isOwn) {
    case false:
      return "Cuộc gọi đến";
    case true:
      return "Cuộc gọi đi";
    default:
      return "Cuộc gọi";
  }
};

const isVideoUrl = (u) => typeof u === "string" && /\.(mp4|mov|webm|ogg|mkv)(?:\?.*)?$/i.test(u);
const isCloudinaryUrl = (u) => typeof u === "string" && u.includes("res.cloudinary.com");

const cloudinaryVideoThumbnail = (url) => {
  if (!isCloudinaryUrl(url)) return null;
  try {
    const withTransform = url.replace("/upload/", "/upload/so_0,f_auto,q_auto,w_800/");

    return withTransform.replace(/\.(mp4|mov|webm|ogg|mkv)(?:[?#].*)?$/i, ".jpg");
  } catch {
    return null;
  }
};

const renderTextWithBreaks = (text) => {
  if (typeof text !== "string") return text;
  return text.split(/(\n\r?|\r\n?)/).map((part, idx) => {
    if (part.match(/^\s*$/)) return <br key={idx} />;
    return part;
  });
};
