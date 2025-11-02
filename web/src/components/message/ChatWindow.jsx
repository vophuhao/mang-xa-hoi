import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";

import { useQueries } from "@tanstack/react-query";

import OnlineStatusIndicator from "@/components/common/OnlineStatusIndicator";
import useAuth from "@/hooks/useAuth";
import useOnlineUsers from "@/hooks/useOnlineUsers";
import { POST_QUERY_KEYS } from "@/hooks/usePost";
import useSocket from "@/hooks/useSocket";
import { getPostById, saveCallHistory } from "@/lib/api";

export default function ChatWindow({
  selectedChat,
  groupedMessages = [],
  messagesContainerRef,
  messagesEndRef,
  isOwnMessage,
  handleMarkAsRead,
  handleReaction,
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
  const postIds = useMemo(() => {
    const s = new Set();
    groupedMessages.forEach((item) => {
      if (item.type !== "message") return;
      const m = item.message;
      if (!m) return;
      if (m.messageType !== "post_share") return;
      const pid =
        m.sharedPost && typeof m.sharedPost === "string"
          ? m.sharedPost
          : (m.sharedPost && m.sharedPost._id) || m.sharedPostId;
      if (pid) s.add(String(pid));
      else if (typeof m.content === "string") {
        const match = m.content.match(/\/p\/([a-zA-Z0-9_-]+)/);
        if (match) s.add(match[1]);
      }
    });
    return Array.from(s);
  }, [groupedMessages]);

  const postQueries = useQueries({
    queries: postIds.map((id) => ({
      queryKey: POST_QUERY_KEYS.post(id),
      queryFn: () => getPostById(id),
      enabled: !!id,
      staleTime: 5 * 60 * 1000,
    })),
  });

  const postMap = useMemo(() => {
    const map = {};
    postQueries.forEach((q, idx) => {
      const id = postIds[idx];
      const res = q?.data;
      const data = res?.data || res || null;
      if (data) map[id] = data;
    });
    return map;
  }, [postQueries, postIds]);

  const { user: authUser } = useAuth();
  const userId = authUser?.data?._id;
  const { emit } = useSocket();
  const [bubbleMaxWidth, setBubbleMaxWidth] = useState("40%");

  // ✅ THÊM: Scroll detection refs
  const scrollPositionRef = useRef(0);
  const isLoadingRef = useRef(false);
  const loadTriggerRef = useRef(null);

  // ✅ THÊM: Intersection Observer để detect scroll to top
  useEffect(() => {
    if (!messagesContainerRef?.current || !hasNextPage || isLoadingMore) return;

    const container = messagesContainerRef.current;
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting && !isLoadingRef.current && hasNextPage) {
          console.log("[SCROLL] Loading more messages...");
          isLoadingRef.current = true;

          // Lưu scroll position trước khi load
          scrollPositionRef.current = container.scrollHeight - container.scrollTop;

          // Load more messages
          if (loadMoreMessages) {
            loadMoreMessages().finally(() => {
              isLoadingRef.current = false;
            });
          }
        }
      },
      {
        root: container,
        rootMargin: "50px 0px 0px 0px",
        threshold: 0.1,
      }
    );

    if (loadTriggerRef.current) {
      observer.observe(loadTriggerRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, [hasNextPage, isLoadingMore, loadMoreMessages, messagesContainerRef]);

  // ✅ THÊM: Maintain scroll position sau khi load more
  useEffect(() => {
    if (!messagesContainerRef?.current || !scrollPositionRef.current) return;

    const container = messagesContainerRef.current;
    const newScrollTop = container.scrollHeight - scrollPositionRef.current;

    // Restore scroll position
    container.scrollTop = newScrollTop;
    scrollPositionRef.current = 0;
  }, [groupedMessages.length]);

  useLayoutEffect(() => {
    const compute = () => {
      try {
        const el = messagesContainerRef?.current;
        const base = el?.clientWidth || window.innerWidth;
        setBubbleMaxWidth(`${Math.floor(base * 0.4)}px`);
      } catch {
        setBubbleMaxWidth(`${Math.floor(window.innerWidth * 0.4)}px`);
      }
    };
    compute();
    window.addEventListener("resize", compute);
    return () => window.removeEventListener("resize", compute);
  }, [messagesContainerRef]);

  useEffect(() => {
    if (!messagesEndRef?.current || isLoadingRef.current) return;

    const container = messagesContainerRef?.current;
    if (!container) return;

    const isNearBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight < 100;

    if (isNearBottom || groupedMessages.length <= 10) {
      const t = setTimeout(() => {
        try {
          messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
        } catch (err) {
          console.warn("Scroll error:", err);
        }
      }, 100);
      return () => clearTimeout(t);
    }
  }, [selectedChat?._id, groupedMessages?.length, messagesEndRef, messagesContainerRef]);

  const handleInputKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!sendingMessage) {
        handleSendMessage(e);
      }
    }
  };

  // ✅ SỬA: startCall với kiểm tra online status
  const startCall = async () => {
    if (!selectedChat?.partner?._id) return;

    // ✅ THÊM: Kiểm tra online status trước khi gọi
    if (!isPartnerOnline) {
      // Có thể thêm toast notification nếu cần
      console.log("[CALL] Cannot call - user is offline");
      return;
    }

    const partnerId = String(selectedChat.partner._id);

    const roomId = `room_${userId}_${partnerId}_${Date.now()}`;
    const fromUserName = authUser?.data?.userId || authUser?.data?.displayName || "";

    try {
      console.log("[CALL] Starting call with roomId:", roomId);

      // ✅ CHỈ tạo call history với status "outgoing"
      await saveCallHistory({
        recipientId: partnerId,
        status: "outgoing",
        roomId: String(roomId),
        startedAt: new Date().toISOString(),
      });

      console.log("[CALL] Outgoing call history created");
    } catch (error) {
      console.error("[CALL] Failed to create call history:", error);
    }

    // Emit call request
    emit("call_request", {
      toUserId: partnerId,
      fromUserId: userId,
      fromUserName,
      roomId,
    });

    // Mở call page
    const url = `/call?roomId=${encodeURIComponent(roomId)}&role=caller&to=${encodeURIComponent(partnerId)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  // ✅ THÊM: Hook để check online status
  const { isUserOnline } = useOnlineUsers();

  if (!selectedChat) {
    return (
      <div className="flex flex-1 items-center justify-center bg-gray-50 text-gray-500 dark:bg-gray-900 dark:text-gray-400">
        <div className="px-4 text-center">
          <div className="mb-4 text-4xl md:text-6xl">💬</div>
          <h3 className="mb-2 text-base font-medium text-gray-900 md:text-lg dark:text-white">
            Chọn một đoạn chat để bắt đầu
          </h3>
          <p className="text-sm">Tin nhắn của bạn sẽ hiển thị ở đây</p>
        </div>
      </div>
    );
  }

  // ✅ THÊM: Check online status của partner
  const isPartnerOnline = isUserOnline(selectedChat.partner?._id);

  return (
    <div className="flex min-w-0 flex-1 flex-col bg-white dark:bg-gray-900">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-300 bg-white p-3 md:p-4 dark:border-gray-700 dark:bg-gray-900">
        <div className="flex items-center space-x-2 md:space-x-3">
          {/* Avatar with Online Status */}
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
            {/* ✅ THÊM: Online Status Indicator */}
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
              {/* ✅ THÊM: Online status text */}
              {isPartnerOnline && (
                <span className="hidden text-xs font-medium text-green-600 md:inline dark:text-green-400">
                  • Online
                </span>
              )}
            </div>
            <p className="text-xs text-gray-500 md:text-sm dark:text-gray-400">
              @{selectedChat.partner?.username || "unknown"}
              {!isPartnerOnline && (
                <span className="ml-2 text-red-500 dark:text-red-400">• Offline</span>
              )}
            </p>
          </div>
        </div>

        {/* Call button */}
        <div className="flex items-center space-x-2">
          <button
            type="button"
            title={isPartnerOnline ? "Gọi" : "Người dùng không trực tuyến"}
            onClick={startCall}
            disabled={!isPartnerOnline} // ✅ THÊM: Disable khi offline
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

      {/* Messages Area - giữ nguyên existing code */}
      <div
        ref={messagesContainerRef}
        className="flex-1 space-y-3 overflow-y-auto bg-white p-3 md:p-4 dark:bg-gray-900"
      >
        <div>
          {/* ✅ THÊM: Load more trigger và loading indicator */}
          {hasNextPage && (
            <div ref={loadTriggerRef} className="flex justify-center py-4">
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

          {/* ✅ Messages rendering - giữ nguyên code cũ */}
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

                <div className={`group relative mt-2 mb-2 rounded-full px-0 py-0`}>
                  {/* ✅ SỬA: Render cuộc gọi theo status mới */}
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
                            if (
                              !isOwn &&
                              !message.isRead &&
                              typeof handleMarkAsRead === "function"
                            ) {
                              handleMarkAsRead(message._id);
                            }
                          } catch (err) {
                            console.error(err);
                          }
                        }}
                      >
                        <div className="flex items-center space-x-2">
                          {/* Call icon */}
                          <div
                            className={`text-lg md:text-xl ${isOwn ? "text-white" : "text-gray-600 dark:text-gray-300"}`}
                          >
                          </div>

                          <div className="flex-1">
                            {/* ✅ SỬA: Call status text theo logic mới */}
                            <div
                              className={`text-xs font-medium md:text-sm ${isOwn ? "text-white" : "text-gray-900 dark:text-white"}`}
                            >
                              {getCallStatusText(message.callData.status, isOwn)}
                            </div>

                            {/* Call time */}
                            <div
                              className={`mt-1 text-xs ${isOwn ? "text-blue-100 dark:text-blue-200" : "text-gray-500 dark:text-gray-400"}`}
                            >
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
                              // ✅ THÊM: Kiểm tra online trước khi gọi lại
                              if (isPartnerOnline) {
                                startCall();
                              }
                            }}
                            disabled={!isPartnerOnline} // ✅ THÊM: Disable khi offline
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
                  ) : /* ✅ EXISTING: Post share rendering */
                  message.messageType === "post_share" &&
                    (message.sharedPost || message.sharedPostId || message.content) ? (
                    // ...existing post_share code...
                    (() => {
                      const postId =
                        message.sharedPost && typeof message.sharedPost === "string"
                          ? message.sharedPost
                          : (message.sharedPost && message.sharedPost._id) || message.sharedPostId;
                      const populatedPost =
                        message.sharedPost && typeof message.sharedPost === "object"
                          ? message.sharedPost
                          : postMap[postId] || null;
                      const post = populatedPost;
                      const author =
                        post?.user ||
                        post?.author ||
                        post?.postedBy ||
                        post?.owner ||
                        (message.sharedPost && message.sharedPost.user) ||
                        {};
                      const mediaUrls =
                        post?.thumbnailUrl ||
                        post?.mediaUrls ||
                        (post?.images && (post.images[0]?.url || post.images[0])) ||
                        (post?.media && (post.media[0]?.url || post.media[0])) ||
                        message.mediaUrl ||
                        null;
                      const firstMediaUrl = Array.isArray(mediaUrls) ? mediaUrls[0] : mediaUrls;
                      let previewImgSrc = null;
                      if (firstMediaUrl) {
                        if (isVideoUrl(firstMediaUrl))
                          previewImgSrc = cloudinaryVideoThumbnail(firstMediaUrl) || null;
                        else previewImgSrc = firstMediaUrl;
                      }
                      const caption = post?.caption || "";
                      return (
                        <div className="flex w-full flex-col space-y-2">
                          <div className={`flex w-full ${isOwn ? "justify-end" : "justify-start"}`}>
                            <div className="overflow-hidden rounded-lg border bg-[#1f2937] text-white shadow-sm">
                              <a
                                href={`/${author?.userId || author?.username || author?._id || ""}`}
                                className="flex items-center space-x-3 px-3 py-2 hover:underline"
                              >
                                <img
                                  src={
                                    author?.avatarUrl ||
                                    `https://ui-avatars.com/api/?name=${author?.userId || author?.username || "User"}&background=random`
                                  }
                                  alt={author?.userId || author?.username || "user"}
                                  className="h-8 w-8 rounded-full object-cover"
                                />
                                <div className="text-sm font-medium">
                                  {author?.userId ||
                                    author?.username ||
                                    author?.displayName ||
                                    "User"}
                                </div>
                              </a>

                              <a
                                href={`/${author?.userId || author?.username || author?._id || ""}/p/${postId || ""}`}
                                className="inline-block"
                              >
                                <div className="relative w-56 flex-shrink-0 overflow-hidden rounded-md bg-black sm:w-64">
                                  {previewImgSrc ? (
                                    <>
                                      <img
                                        src={previewImgSrc}
                                        alt="post preview"
                                        className="h-auto max-h-[70vh] w-full object-contain"
                                        loading="lazy"
                                      />
                                      {isVideoUrl(firstMediaUrl) && (
                                        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                                          <div className="bg-opacity-50 flex h-12 w-12 items-center justify-center rounded-full bg-black">
                                            <svg
                                              className="h-6 w-6 text-white"
                                              viewBox="0 0 24 24"
                                              fill="currentColor"
                                              aria-hidden
                                            >
                                              <path d="M8 5v14l11-7z" />
                                            </svg>
                                          </div>
                                        </div>
                                      )}
                                    </>
                                  ) : (
                                    <div className="flex w-full items-center justify-center py-8 text-sm text-gray-200">
                                      Xem bài viết
                                    </div>
                                  )}
                                </div>
                              </a>

                              {caption ? (
                                <div className="px-3 py-2 text-sm text-gray-100">
                                  {caption.length > 200 ? `${caption.slice(0, 200)}...` : caption}
                                </div>
                              ) : null}
                            </div>
                          </div>

                          {message.content && (
                            <div
                              className={`flex w-full ${isOwn ? "justify-end" : "justify-start"}`}
                            >
                              <div
                                className={`cursor-pointer rounded-xl px-3 py-2 leading-5 break-words md:px-4 ${isOwn ? "bg-blue-500 text-white dark:bg-blue-600" : "border border-gray-200 bg-[#EFEFEF] text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-white"}`}
                                style={{ maxWidth: bubbleMaxWidth, minWidth: 96 }}
                                onClick={() => {
                                  try {
                                    if (
                                      !isOwn &&
                                      !message.isRead &&
                                      typeof handleMarkAsRead === "function"
                                    )
                                      handleMarkAsRead(message._id);
                                  } catch (err) {
                                    console.error(err);
                                  }
                                }}
                                onDoubleClick={() => handleReaction(message._id, "❤️")}
                              >
                                <p className="text-xs md:text-sm">
                                  {renderTextWithBreaks(message.content)}
                                </p>

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
                      );
                    })()
                  ) : /* ✅ EXISTING: Media rendering */
                  message.messageType === "media" && message.mediaUrl ? (
                    // ...existing media code...
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
                  ) : (
                    /* ✅ EXISTING: Text messages */
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

      {/* Input area - giữ nguyên */}
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
              onKeyDown={handleInputKeyDown}
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

// ✅ SỬA: Helper function - chỉ 3 status
const getCallStatusText = (status, isOwn) => {
  switch (status) {
    case "declined":
      return "Cuộc gọi bị từ chối";
    case "incoming":
      return "Cuộc gọi đến";
    case "outgoing":
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
