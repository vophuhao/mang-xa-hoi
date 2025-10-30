import { useMemo, useState, useLayoutEffect, useEffect } from "react";

import { useQueries } from "@tanstack/react-query";

import useAuth from "@/hooks/useAuth";
import { POST_QUERY_KEYS } from "@/hooks/usePost";
import useSocket from "@/hooks/useSocket";
import { getPostById, saveCallHistory, updateCallStatus } from "@/lib/api";

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
}) {
  const postIds = useMemo(() => {
    const s = new Set();
    groupedMessages.forEach((item) => {
      if (item.type !== "message") return;
      const m = item.message;
      if (!m) return;
      if (m.messageType !== "post_share") return;
      const pid = m.sharedPost && typeof m.sharedPost === "string"
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
  const [callTimeout, setCallTimeout] = useState(null); // ✅ THÊM: Track call timeout

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
    if (!messagesEndRef?.current) return;
    const t = setTimeout(() => {
      try {
        messagesEndRef.current.scrollIntoView({ behavior: "auto", block: "end" });
      } catch (err) {
        // ignore
      }
    }, 0);
    return () => clearTimeout(t);
  }, [selectedChat?._id, groupedMessages?.length, messagesEndRef]);

  const handleInputKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!sendingMessage) {
        handleSendMessage(e);
      }
    }
  };

  // ✅ SỬA: Đơn giản hóa startCall - chỉ có 1 type
  const startCall = async () => {
    if (!selectedChat?.partner?._id) return;
    const partnerId = String(selectedChat.partner._id);
    
    const roomId = `room_${userId}_${partnerId}_${Date.now()}`;
    const fromUserName = authUser?.data?.userId || authUser?.data?.displayName || "";

    try {
      // ✅ Tạo call history với status "outgoing" 
      await saveCallHistory({
        recipientId: partnerId,
        status: "outgoing", // ✅ Đánh dấu là cuộc gọi đi
        roomId: String(roomId),
        startedAt: new Date().toISOString(),
      });
      
      console.log("[CALL] Outgoing call history created");

      // ✅ THÊM: Set timeout 20s để đánh dấu "missed" nếu không có phản hồi
      const timeoutId = setTimeout(async () => {
        try {
          await updateCallStatus(roomId, {
            status: "missed",
            endedAt: new Date().toISOString(),
          });
          console.log("[CALL] Call marked as missed after 20s timeout");
        } catch (error) {
          console.error("[CALL] Failed to update call to missed:", error);
        }
      }, 20000); // 20 seconds

      setCallTimeout(timeoutId);

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

  // ✅ THÊM: Clear timeout khi component unmount
  useEffect(() => {
    return () => {
      if (callTimeout) {
        clearTimeout(callTimeout);
      }
    };
  }, [callTimeout]);

  // ✅ THÊM: Listen for call responses để clear timeout
  useEffect(() => {
    if (!emit?.socket) return;

    const handleCallResponse = ({ accepted, roomId: responseRoomId }) => {
      // Clear timeout nếu có response
      if (callTimeout) {
        clearTimeout(callTimeout);
        setCallTimeout(null);
      }
    };

    emit.socket.on("call_response", handleCallResponse);

    return () => {
      emit.socket.off("call_response", handleCallResponse);
    };
  }, [emit, callTimeout]);

  if (!selectedChat) {
    return (
      <div className="flex items-center justify-center flex-1 text-gray-500 bg-gray-50">
        <div className="text-center">
          <div className="text-6xl mb-4">💬</div>
          <h3 className="text-lg font-medium mb-2">Chọn một đoạn chat để bắt đầu</h3>
          <p className="text-sm">Tin nhắn của bạn sẽ hiển thị ở đây</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-w-0">
      {/* Header */}
      <div className="p-4 border-b border-gray-300 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <img
            src={selectedChat.partner?.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedChat.partner?.userId || selectedChat.partner?.username || 'User')}&background=random`}
            alt={selectedChat.partner?.userId || selectedChat.partner?.username || 'User'}
            className="w-10 h-10 rounded-full object-cover"
          />
          <div>
            <h3 className="font-bold text-gray-900">
              {selectedChat.partner?.userId || selectedChat.partner?.username || 'Unknown User'}
              {selectedChat.partner?.isVerified && <span className="ml-1 text-blue-500">✓</span>}
            </h3>
            <p className="text-sm text-gray-500">@{selectedChat.partner?.username || 'unknown'}</p>
          </div>
        </div>

        {/* ✅ SỬA: Chỉ có 1 nút call */}
        <div className="flex items-center space-x-2">
          <button
            type="button"
            title="Gọi"
            onClick={startCall}
            className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 text-lg"
          >
            📞
          </button>
        </div>
      </div>

      {/* Messages Area */}
      <div ref={messagesContainerRef} className="flex-1 p-4 space-y-3 overflow-y-auto bg-white">
        <div>
          {conversationFullyLoaded && (
            <div className="flex justify-center mb-4">
              <div className="flex flex-col items-center p-6 w-72">
                <img
                  src={
                    selectedChat.partner?.avatarUrl ||
                    `https://ui-avatars.com/api/?name=${selectedChat.partner?.userId || selectedChat.partner?.username || 'User'}&background=random`
                  }
                  alt={selectedChat.partner?.userId || selectedChat.partner?.username || 'User'}
                  className="w-24 h-24 rounded-full object-cover"
                />
                <h2 className="mt-4 text-lg font-semibold text-gray-900">
                  {selectedChat.partner?.userId || selectedChat.partner?.username || 'Unknown User'}
                </h2>
                {selectedChat.partner?.bio && (
                  <p className="text-sm text-gray-500">{selectedChat.partner.bio}</p>
                )}
                <a
                  href={`/${selectedChat.partner?.userId || selectedChat.partner?._id}`}
                  className="mt-4 inline-block px-4 py-2 text-sm font-medium bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  Xem trang cá nhân
                </a>
              </div>
            </div>
          )}

          {groupedMessages.map((item, idx) => {
            if (item.type === 'date') {
              return (
                <div key={`date-${idx}`} className="flex items-center my-4">
                  <div className="flex-grow border-gray-300"></div>
                  <span className="mx-4 text-xs text-gray-500 px-2 py-0.5 rounded">{item.date}</span>
                  <div className="flex-grow border-gray-300"></div>
                </div>
              );
            }

            const message = item.message;
            const isOwn = isOwnMessage(message);

            return (
              <div key={message._id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                {!isOwn && (
                  <img
                    src={selectedChat.partner?.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedChat.partner?.username || 'User')}&background=random`}
                    alt={selectedChat.partner?.username || 'User'}
                    className="w-8 h-8 rounded-full object-cover mr-2 mt-1"
                  />
                )}
                
                <div className={`relative group px-0 py-0 mt-2 mb-2 rounded-full`}>
                  {/* ✅ SỬA: Render cuộc gọi theo status mới */}
                  {message.messageType === "call" && message.callData ? (
                    <div className={`w-full flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                      <div
                        className={`px-4 py-3 rounded-xl cursor-pointer break-words leading-5 max-w-xs ${
                          isOwn ? "bg-blue-500 text-white" : "bg-[#EFEFEF] text-gray-900 border"
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
                          {/* Call icon */}
                          <div className={`text-xl ${isOwn ? 'text-white' : 'text-gray-600'}`}>
                            📞
                          </div>
                          
                          <div className="flex-1">
                            {/* ✅ SỬA: Call status text theo logic mới */}
                            <div className={`text-sm font-medium ${isOwn ? 'text-white' : 'text-gray-900'}`}>
                              {getCallStatusText(message.callData.status, isOwn)}
                            </div>
                            
                            {/* Call time */}
                            <div className={`text-xs mt-1 ${isOwn ? 'text-blue-100' : 'text-gray-500'}`}>
                              {new Date(message.createdAt).toLocaleString('vi-VN', {
                                hour: '2-digit',
                                minute: '2-digit',
                                day: '2-digit',
                                month: '2-digit'
                              })}
                            </div>
                          </div>
                          
                          {/* Call again button */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              startCall();
                            }}
                            className={`p-1 rounded-full hover:bg-opacity-20 hover:bg-white transition-colors ${
                              isOwn ? 'text-white' : 'text-gray-600'
                            }`}
                            title="Gọi lại"
                          >
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : 
                  
                  /* ✅ EXISTING: Post share rendering */
                  message.messageType === "post_share" && (message.sharedPost || message.sharedPostId || message.content) ? (
                    // ...existing post_share code...
                    (() => {
                      const postId = message.sharedPost && typeof message.sharedPost === "string"
                        ? message.sharedPost
                        : (message.sharedPost && message.sharedPost._id) || message.sharedPostId;
                      const populatedPost = (message.sharedPost && typeof message.sharedPost === "object") ? message.sharedPost : (postMap[postId] || null);
                      const post = populatedPost;
                      const author = post?.user || post?.author || post?.postedBy || post?.owner || (message.sharedPost && message.sharedPost.user) || {};
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
                        if (isVideoUrl(firstMediaUrl)) previewImgSrc = cloudinaryVideoThumbnail(firstMediaUrl) || null;
                        else previewImgSrc = firstMediaUrl;
                      }
                      const caption = post?.caption || "";
                      return (
                        <div className="flex flex-col space-y-2 w-full">
                          <div className={`w-full flex ${isOwn ? "justify-end" : "justify-start"}`}>
                            <div className="bg-[#1f2937] text-white rounded-lg overflow-hidden border shadow-sm">
                              <a href={`/${author?.userId || author?.username || author?._id || ""}`} className="flex items-center space-x-3 px-3 py-2 hover:underline">
                                <img src={author?.avatarUrl || `https://ui-avatars.com/api/?name=${author?.userId || author?.username || 'User'}&background=random`} alt={author?.userId || author?.username || 'user'} className="w-8 h-8 rounded-full object-cover" />
                                <div className="text-sm font-medium">{author?.userId || author?.username || author?.displayName || 'User'}</div>
                              </a>

                              <a href={`/${author?.userId || author?.username || author?._id || ""}/p/${postId || ""}`} className="inline-block">
                                <div className="relative w-56 sm:w-64 flex-shrink-0 overflow-hidden rounded-md bg-black">
                                  {previewImgSrc ? (
                                    <>
                                      <img src={previewImgSrc} alt="post preview" className="w-full h-auto max-h-[70vh] object-contain" loading="lazy" />
                                      {isVideoUrl(firstMediaUrl) && (
                                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                          <div className="w-12 h-12 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
                                            <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                                              <path d="M8 5v14l11-7z" />
                                            </svg>
                                          </div>
                                        </div>
                                      )}
                                    </>
                                  ) : (
                                    <div className="w-full flex items-center justify-center text-sm text-gray-200 py-8">Xem bài viết</div>
                                  )}
                                </div>
                              </a>

                              {caption ? <div className="px-3 py-2 text-sm text-gray-100">{caption.length > 200 ? `${caption.slice(0, 200)}...` : caption}</div> : null}
                            </div>
                          </div>

                          {message.content && (
                            <div className={`w-full flex ${isOwn ? "justify-end" : "justify-start"}`}>
                              <div
                                className={`px-4 py-2 rounded-xl cursor-pointer break-words leading-5 ${isOwn ? "bg-blue-500 text-white" : "bg-[#EFEFEF] text-gray-900 border"}`}
                                style={{ maxWidth: bubbleMaxWidth, minWidth: 96 }}
                                onClick={() => {
                                  try { if (!isOwn && !message.isRead && typeof handleMarkAsRead === "function") handleMarkAsRead(message._id); } catch (err) { console.error(err); }
                                }}
                                onDoubleClick={() => handleReaction(message._id, "❤️")}
                              >
                                <p className="text-sm">{renderTextWithBreaks(message.content)}</p>

                                {message.reactions && message.reactions.length > 0 && (
                                  <div className="flex space-x-1 mt-1">
                                    {message.reactions.map((reaction, idx) => <span key={idx} className="text-xs">{reaction.emoji}</span>)}
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })()
                  ) : 
                  
                  /* ✅ EXISTING: Media rendering */
                  message.messageType === "media" && message.mediaUrl ? (
                    // ...existing media code...
                    <div className="px-0 py-0 rounded-2xl">
                      <div className="relative w-56 sm:w-64 flex-shrink-0 overflow-hidden rounded-lg bg-black">
                        {message.mediaType === "image" ? (
                          <img src={message.mediaUrl} alt="Shared image" className="w-full h-auto max-h-[70vh] object-contain" />
                        ) : message.mediaType === "video" ? (
                          <video src={message.mediaUrl} controls poster={cloudinaryVideoThumbnail(message.mediaUrl) || undefined} className="w-full h-auto max-h-[70vh]" />
                        ) : (
                          <div className="w-full flex items-center justify-center text-sm text-gray-200 py-8">Không hỗ trợ media này</div>
                        )}
                      </div>
                      {message.content && <p className="text-sm mt-2">{message.content}</p>}
                    </div>
                  ) : (
                    
                    /* ✅ EXISTING: Text messages */
                    <div className={`w-full flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                      <div
                        className={`px-4 py-2 rounded-xl cursor-pointer break-words leading-5 ${isOwn ? "bg-blue-500 text-white" : "bg-[#EFEFEF] text-gray-900 border"}`}
                        style={{ maxWidth: bubbleMaxWidth, minWidth: 96 }}
                        onClick={() => {
                          try { if (!isOwn && !message.isRead && typeof handleMarkAsRead === "function") handleMarkAsRead(message._id); } catch (err) { console.error(err); }
                        }}
                        onDoubleClick={() => handleReaction(message._id, "❤️")}
                      >
                        {message.messageType === "text" && <p className="text-sm">{renderTextWithBreaks(message.content)}</p>}

                        {message.messageType === "location" && message.location && (
                          <div>
                            <p className="text-sm">📍 {message.location.name}</p>
                            <p className="text-xs opacity-75">{message.location.coordinates[1]}, {message.location.coordinates[0]}</p>
                          </div>
                        )}

                        {message.reactions && message.reactions.length > 0 && (
                          <div className="flex space-x-1 mt-1">
                            {message.reactions.map((reaction, idx) => <span key={idx} className="text-xs">{reaction.emoji}</span>)}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Tooltip */}
                  <div className="pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-150 absolute -top-7 left-1/2 transform -translate-x-1/2 z-20">
                    <div className="bg-gray-800 text-white text-xs px-2 py-1 rounded shadow-lg whitespace-nowrap">
                      {new Date(message.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                    <div className="w-0 h-0 border-l-6 border-r-6 border-t-6 border-l-transparent border-r-transparent border-t-gray-800 mx-auto"></div>
                  </div>
                </div>

                {isOwn && (
                  <img
                    src={user?.data?.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.data?.userId || 'You')}&background=random`}
                    alt="You"
                    className="w-8 h-8 rounded-full object-cover ml-2 mt-1"
                  />
                )}
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input area */}
      <form onSubmit={handleSendMessage} className="p-4 bg-white">
        {selectedImages.length > 0 && (
          <div className="flex space-x-2 mb-2">
            {selectedImages.map((img, idx) => (
              <div key={idx} className="relative">
                {img.mediaType === "image" ? (
                  <img src={img.url} alt="preview" className="w-16 h-16 object-cover rounded" />
                ) : (
                  <video src={img.url} controls className="w-16 h-16 object-cover rounded" />
                )}
                <button type="button" className="absolute top-0 right-0 bg-black bg-opacity-50 text-white rounded-full px-1" onClick={() => handleRemoveImage(idx)}>×</button>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center w-full">
          <div className="flex items-center bg-white border border-gray-300 rounded-full w-full px-3 py-2">
            <button type="button" className="mr-2 flex-shrink-0 text-2xl focus:outline-none"><span role="img" aria-label="emoji">😊</span></button>
            <textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={handleInputKeyDown}
              onInput={(e) => { e.target.style.height = "auto"; e.target.style.height = e.target.scrollHeight + "px"; }}
              placeholder="Nhắn tin..."
              rows={1}
              className="flex-1 border-none outline-none bg-transparent text-base resize-none overflow-hidden"
              disabled={sendingMessage}
            />
             <div className="flex items-center space-x-2 ml-2">
               {(newMessage.trim().length > 0 || selectedImages.length > 0) ? (
                 <span
                   className="ml-2 text-blue-500 font-semibold cursor-pointer select-none"
                   style={{ padding: "0 16px", lineHeight: "36px" }}
                   onClick={() => !sendingMessage && handleSendMessage({ preventDefault: () => {} })}
                   role="button"
                 >
                   {sendingMessage ? "Đang gửi..." : "Gửi"}
                 </span>
               ) : (
                 <>
                   <button type="button" className="text-xl focus:outline-none" title="Ghi âm">🎤</button>
                   <input type="file" accept="image/*,video/*" multiple style={{ display: "none" }} ref={imageInputRef} onChange={handleImageChange} />
                   <button type="button" className="text-xl focus:outline-none" title="Chọn ảnh/video" onClick={() => imageInputRef.current.click()}>🖼️</button>
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