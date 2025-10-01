import { useRef, useState, useEffect } from "react";

import useAuth from "@/hooks/useAuth";
import useSocket from "@/hooks/useSocket";

import {
  getConversations,
  getConversation,
  sendMessage,
  markAsRead,
  markAllAsRead,
  reactToMessage,
  uploadMedia
} from "../lib/api";

export default function MessagePanel() {
  const { user } = useAuth();
  const userId = user?.data?._id;
  const socket = useSocket();

  const [selectedChat, setSelectedChat] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [selectedImages, setSelectedImages] = useState([]);

  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef();
  const isInitialLoad = useRef(true);
  const imageInputRef = useRef(null);

  const hasText = newMessage.trim().length > 0;

  // Lấy danh sách conversations khi component mount
  useEffect(() => {
    fetchConversations();
  }, []);

  // Lấy messages khi chọn chat
  useEffect(() => {
    if (selectedChat) {
      setPage(1);
      isInitialLoad.current = true;
      fetchMessages(selectedChat.partner._id, 1);
    }
  }, [selectedChat]);

  useEffect(() => {
    if (isInitialLoad.current && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
      isInitialLoad.current = false;
    }
  }, [messages]);

  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      if (container.scrollTop === 0 && hasMore && !loadingMore) {
        handleLoadMore();
      }
    };

    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, [hasMore, loadingMore, selectedChat, page]);

  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (message) => {
      const senderId = String(message.sender?._id || message.sender);
      const recipientId = String(message.recipient?._id || message.recipient);
      const partnerId = String(selectedChat?.partner?._id);

      if (
        selectedChat &&
        (senderId === partnerId || recipientId === partnerId)
      ) {
        setMessages((prev) => {
          // Nếu tin nhắn đã có thì không thêm nữa
          if (prev.some((msg) => msg._id === message._id)) return prev;
          return [...prev, message];
        });
        setTimeout(() => {
          if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
          }
        }, 0);
      }

      setConversations(prev => prev.map(conv => {
        const partnerId = String(conv.partner._id);
        const senderId = String(message.sender?._id || message.sender);
        const recipientId = String(message.recipient?._id || message.recipient);

        // Nếu hội thoại này là với partner đang chat
        if (partnerId === senderId || partnerId === recipientId) {
          return {
            ...conv,
            lastMessage: message,
            unreadCount:
              selectedChat && partnerId === String(selectedChat.partner._id)
                ? 0 // Nếu đang mở chat này thì reset unread
                : (conv.unreadCount || 0) + 1
          };
        }
        return conv;
      }));
    };

    socket.on("new_message", handleNewMessage);

    return () => {
      socket.off("new_message", handleNewMessage);
    };
    // eslint-disable-next-line
  }, [socket, selectedChat]);

  useEffect(() => {
    if (!socket || !selectedChat || !userId) return;
    socket.emit("join_conversation", selectedChat.partner._id);
    return () => {
      socket.emit("leave_conversation", selectedChat.partner._id);
    };
  }, [socket, selectedChat, userId]);

  const fetchConversations = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await getConversations(1, 20);

      if (response && response.success && response.data) {
        const conversationsData = response.data;
        if (Array.isArray(conversationsData)) {
          setConversations(conversationsData);
        } else {
          setConversations([]);
        }
      } else {
        setConversations([]);
        setError("Invalid response from server");
      }
    } catch (error) {
      setConversations([]);
      setError(error.response?.data?.message || "Failed to load conversations");
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (partnerId, pageToLoad = 1) => {
    try {
      const response = await getConversation(partnerId, pageToLoad, 10);
      if (response && response.success && response.data) {
        const newMessages = response.data.slice().reverse(); // đảo lại cho đúng thứ tự cũ -> mới
        if (pageToLoad === 1) {
          setMessages(newMessages);
        } else {
          setMessages(prev => [...newMessages, ...prev]);
        }
        setHasMore(response.pagination.hasNext);

        // Gọi markAllAsRead sau khi lấy tin nhắn thành công
        try {
          await markAllAsRead(partnerId);
        } catch (err) {
          // Silent error
        }
        
      } else {
        if (pageToLoad === 1) setMessages([]);
        setHasMore(false);
      }
    } catch (error) {
      if (pageToLoad === 1) setMessages([]);
      setHasMore(false);
    }
  };

  // Chọn ảnh/video từ thiết bị
  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    const previews = files.map(file => {
      const isVideo = file.type.startsWith("video/");
      return {
        file,
        url: URL.createObjectURL(file),
        mediaType: isVideo ? "video" : "image"
      };
    });
    setSelectedImages(prev => [...prev, ...previews]);
  };

  // Xoá ảnh/video đã chọn
  const handleRemoveImage = (idx) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== idx));
  };

  // Gửi tin nhắn (media trước, text sau)
  const handleSendMessage = async (e) => {
    e.preventDefault();
    console.log("Gửi tin nhắn");
    if (sendingMessage || (!newMessage.trim() && selectedImages.length === 0) || !selectedChat) return;

    setSendingMessage(true);

    let mediaUrls = [];
    let mediaTypes = [];
    // Upload media lên Cloudinary
    if (selectedImages.length > 0) {
      const formData = new FormData();
      selectedImages.forEach(img => {
        formData.append("files", img.file);
        mediaTypes.push(img.mediaType);
      });
      const res = await uploadMedia(formData);
      const urls = res?.urls || res?.data?.urls;
      if (urls && Array.isArray(urls)) {
        mediaUrls = urls;
      }
    }

    // Gửi từng media trước
    for (let i = 0; i < mediaUrls.length; i++) {
      const url = mediaUrls[i];
      const type = mediaTypes[i] || "image";
      if (socket) {
        socket.emit("send_message", {
          recipientId: selectedChat.partner._id,
          messageType: "media",
          mediaUrl: url,
          mediaType: type
        });
      } else {
        await sendMessage({
          recipientId: selectedChat.partner._id,
          messageType: "media",
          mediaUrl: url,
          mediaType: type
        });
      }
    }

    // Sau đó gửi text (nếu có)
    if (newMessage.trim()) {
      if (socket) {
        socket.emit("send_message", {
          recipientId: selectedChat.partner._id,
          content: newMessage.trim(),
          messageType: "text"
        });
      } else {
        await sendMessage({
          recipientId: selectedChat.partner._id,
          content: newMessage.trim(),
          messageType: "text"
        });
      }
    }

    setSelectedImages([]);
    setNewMessage("");
    setSendingMessage(false);
    // Không cần fetchMessages nữa, vì sẽ nhận realtime qua socket
    setTimeout(() => {
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
      }
    }, 0);
  };

  // Giữ lại markAsRead cho từng message
  const handleMarkAsRead = async (messageId) => {
    try {
      await markAsRead(messageId);
      
      setMessages(prev => 
        prev.map(msg => 
          msg._id === messageId 
            ? { ...msg, isRead: true }
            : msg
        )
      );
    } catch (error) {
      // Silent error
    }
  };

  const handleReaction = async (messageId, emoji) => {
    try {
      await reactToMessage(messageId, emoji);
      
      if (selectedChat) {
        fetchMessages(selectedChat.partner._id);
      }
    } catch (error) {
      // Silent error
    }
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('vi-VN', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const formatLastMessageTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString('vi-VN', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } else {
      return date.toLocaleDateString('vi-VN', { 
        day: '2-digit', 
        month: '2-digit' 
      });
    }
  };

  const getMessagePreview = (message) => {
    if (!message) return "Không có tin nhắn";
    
    switch (message.messageType) {
      case "text":
        return message.content || "Tin nhắn văn bản";
      case "media":
        return message.mediaType === "image" ? "📷 Ảnh" : message.mediaType === "video" ? "🎥 Video" : "Shared media";
      case "location":
        return "📍 Vị trí";
      case "post_share":
        return "📄 Chia sẻ bài viết";
      case "story_share":
        return "📖 Chia sẻ story";
      default:
        return "Tin nhắn";
    }
  };

  // ✅ Enhanced function to check if message is from current user
  const isOwnMessage = (message) => {
    if (!userId || !message) return false;
    const messageSenderId = message.sender?._id || message.sender;
    return String(userId) === String(messageSenderId);
  };

  const groupMessagesByDate = (messages) => {
    const groups = [];
    let lastDate = null;

    messages.forEach((msg) => {
      const msgDate = new Date(msg.createdAt);
      const dateStr = msgDate.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });

      if (dateStr !== lastDate) {
        groups.push({ type: 'date', date: dateStr });
        lastDate = dateStr;
      }
      groups.push({ type: 'message', message: msg });
    });

    return groups;
  };

  const handleLoadMore = async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);

    // 1. Ghi lại chiều cao và vị trí scroll trước khi load thêm
    const container = messagesContainerRef.current;
    const prevScrollHeight = container ? container.scrollHeight : 0;
    const prevScrollTop = container ? container.scrollTop : 0;

    const nextPage = page + 1;
    await fetchMessages(selectedChat.partner._id, nextPage);
    setPage(nextPage);
    setLoadingMore(false);

    // 2. Sau khi messages cập nhật, điều chỉnh scrollTop để giữ vị trí cũ
    setTimeout(() => {
      if (container) {
        const newScrollHeight = container.scrollHeight;
        container.scrollTop = newScrollHeight - prevScrollHeight + prevScrollTop;
      }
    }, 0);
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
          <div className="text-gray-500">Đang tải tin nhắn...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 mb-2">❌ {error}</div>
          <button 
            onClick={fetchConversations}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  const groupedMessages = groupMessagesByDate(messages);

  return (
    <div className="flex h-full">
      {/* Danh sách hội thoại */}
      <div className="w-80 border-r bg-white flex-shrink-0">
        <div className="p-4 font-bold border-b bg-gray-50">
          <h2 className="text-lg">Tin nhắn</h2>
        </div>
        
        <div className="overflow-y-auto" style={{ height: 'calc(100vh - 73px)' }}>
          {conversations.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              <div>Chưa có cuộc hội thoại nào</div>
              <button 
                onClick={fetchConversations}
                className="mt-2 px-3 py-1 bg-blue-500 text-white rounded text-sm"
              >
                Tải lại
              </button>
            </div>
          ) : (
            conversations.map((conversation) => (
              <div
                key={conversation._id}
                onClick={() => setSelectedChat(conversation)}
                className={`flex items-center p-4 space-x-3 cursor-pointer hover:bg-gray-50 border-b transition-colors
                  ${selectedChat?._id === conversation._id ? "bg-blue-50 border-l-4 border-l-blue-500" : ""}`}
              >
                <div className="relative">
                  <img
                    src={conversation.partner?.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(conversation.partner?.fullName || conversation.partner?.username || 'User')}&background=random`}
                    alt={conversation.partner?.fullName || conversation.partner?.username || 'User'}
                    className="w-12 h-12 rounded-full object-cover"
                    onError={(e) => {
                      e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(conversation.partner?.fullName || conversation.partner?.username || 'User')}&background=random`;
                    }}
                  />
                  {conversation.unreadCount > 0 && (
                    <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {conversation.unreadCount > 9 ? "9+" : conversation.unreadCount}
                    </div>
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-gray-900 truncate">
                      {conversation.partner?.fullName || conversation.partner?.username || 'Unknown User'}
                      {conversation.partner?.isVerified && (
                        <span className="ml-1 text-blue-500">✓</span>
                      )}
                    </p>
                    {conversation.lastMessage && (
                      <span className="text-xs text-gray-400">
                        {formatLastMessageTime(conversation.lastMessage.createdAt)}
                      </span>
                    )}
                  </div>
                  
                  <p className={`text-sm truncate ${conversation.unreadCount > 0 ? 'text-gray-900 font-medium' : 'text-gray-500'}`}>
                    {(conversation.lastMessage?.sender?._id || conversation.lastMessage?.sender) === userId ? "Bạn: " : ""}
                    {getMessagePreview(conversation.lastMessage)}
                  </p>
                  
                  <p className="text-xs text-gray-400">@{conversation.partner?.username || 'unknown'}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
      {/* Khu vực chat */}
      <div className="flex-1 flex flex-col bg-white min-w-0">
        {selectedChat ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b bg-gray-50 flex items-center space-x-3">
              <img
                src={selectedChat.partner?.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedChat.partner?.fullName || selectedChat.partner?.username || 'User')}&background=random`}
                alt={selectedChat.partner?.fullName || selectedChat.partner?.username || 'User'}
                className="w-10 h-10 rounded-full object-cover"
              />
              <div>
                <h3 className="font-bold text-gray-900">
                  {selectedChat.partner?.fullName || selectedChat.partner?.username || 'Unknown User'}
                  {selectedChat.partner?.isVerified && (
                    <span className="ml-1 text-blue-500">✓</span>
                  )}
                </h3>
                <p className="text-sm text-gray-500">@{selectedChat.partner?.username || 'unknown'}</p>
              </div>
            </div>
            
            {/* Messages Area */}
            <div
              ref={messagesContainerRef}
              className="flex-1 p-4 space-y-3 overflow-y-auto bg-gray-50"
            >
              {messages.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  Chưa có tin nhắn nào. Hãy bắt đầu cuộc trò chuyện!
                </div>
              ) : (
                <>
                  {groupedMessages.map((item, idx) => {
                    if (item.type === 'date') {
                      return (
                        <div key={`date-${idx}`} className="flex items-center my-4">
                          <div className="flex-grow border-t border-gray-300"></div>
                          <span className="mx-4 text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">{item.date}</span>
                          <div className="flex-grow border-t border-gray-300"></div>
                        </div>
                      );
                    }
                    // Tin nhắn
                    const message = item.message;
                    const isOwn = isOwnMessage(message);
                    return (
                      <div key={message._id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                        {/* ✅ Show avatar for friend's messages */}
                        {!isOwn && (
                          <img
                            src={selectedChat.partner?.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedChat.partner?.username || 'User')}&background=random`}
                            alt={selectedChat.partner?.username || 'User'}
                            className="w-8 h-8 rounded-full object-cover mr-2 mt-1"
                          />
                        )}
                        
                        <div 
                          className={`max-w-xs lg:max-w-md px-0 py-0 rounded-2xl`}
                        >
                          {message.messageType === "media" && message.mediaUrl ? (
                            <div className="max-w-xs lg:max-w-md px-0 py-0 rounded-2xl">
                              {message.mediaType === "image" ? (
                                <img
                                  src={message.mediaUrl}
                                  alt="Shared image"
                                  className="rounded-lg max-w-full h-auto"
                                />
                              ) : message.mediaType === "video" ? (
                                <video
                                  src={message.mediaUrl}
                                  controls
                                  className="rounded-lg max-w-full h-auto"
                                />
                              ) : (
                                <span>Không hỗ trợ media này</span>
                              )}
                              {message.content && (
                                <p className="text-sm mt-2">{message.content}</p>
                              )}
                            </div>
                          ) : (
                            <div
                              className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl cursor-pointer ${
                                isOwn
                                  ? 'bg-blue-500 text-white rounded-br-md'
                                  : 'bg-white text-gray-900 border rounded-bl-md'
                              }`}
                              onClick={() => !isOwn && !message.isRead && handleMarkAsRead(message._id)}
                              onDoubleClick={() => handleReaction(message._id, "❤️")}
                            >
                              {message.messageType === "text" && (
                                <p className="text-sm">{message.content}</p>
                              )}
                              
                              {message.messageType === "location" && message.location && (
                                <div>
                                  <p className="text-sm">📍 {message.location.name}</p>
                                  <p className="text-xs opacity-75">
                                    {message.location.coordinates[1]}, {message.location.coordinates[0]}
                                  </p>
                                </div>
                              )}
                              
                              <div className={`text-xs mt-1 opacity-75 ${isOwn ? 'text-blue-100' : 'text-gray-500'}`}>
                                {formatTime(message.createdAt)}
                                {isOwn && message.isRead && " • Đã xem"}
                              </div>

                              {/* Reactions */}
                              {message.reactions && message.reactions.length > 0 && (
                                <div className="flex space-x-1 mt-1">
                                  {message.reactions.map((reaction, idx) => (
                                    <span key={idx} className="text-xs">
                                      {reaction.emoji}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                        
                        {/* ✅ Show avatar for user's messages */}
                        {isOwn && (
                          <img
                            src={user?.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.fullName || user?.username || 'You')}&background=random`}
                            alt="You"
                            className="w-8 h-8 rounded-full object-cover ml-2 mt-1"
                          />
                        )}
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </>
              )}
            </div>
            
            {/* Message Input */}
            <form onSubmit={handleSendMessage} className="p-4 border-t bg-white flex flex-col space-y-2">
              {/* Ảnh/video xem trước */}
              {selectedImages.length > 0 && (
                <div className="flex space-x-2 mb-2">
                  {selectedImages.map((img, idx) => (
                    <div key={idx} className="relative">
                      {img.mediaType === "image" ? (
                        <img src={img.url} alt="preview" className="w-16 h-16 object-cover rounded" />
                      ) : (
                        <video src={img.url} controls className="w-16 h-16 object-cover rounded" />
                      )}
                      <button
                        type="button"
                        className="absolute top-0 right-0 bg-black bg-opacity-50 text-white rounded-full px-1"
                        onClick={() => handleRemoveImage(idx)}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex items-center space-x-2">
                {/* Emoji */}
                <button type="button" className="text-2xl px-2">😊</button>
                {/* Ô nhập tin nhắn */}
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Nhắn tin..."
                  className="flex-1 rounded-full border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={sendingMessage}
                />
                {/* Nút chọn ảnh/video */}
                {!hasText && (
                  <>
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
                      className="text-xl px-2"
                      title="Chọn ảnh/video"
                      onClick={() => imageInputRef.current.click()}
                    >
                      🖼️
                    </button>
                  </>
                )}
                {/* Nút gửi */}
                {(hasText || selectedImages.length > 0) && (
                  <button
                    type="submit"
                    disabled={sendingMessage}
                    className="px-6 py-2 rounded-full font-medium bg-blue-500 hover:bg-blue-600 text-white transition-colors flex items-center justify-center"
                  >
                    {sendingMessage ? (
                      <span className="flex items-center">
                        <svg className="animate-spin h-5 w-5 mr-2 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
                        </svg>
                        Đang gửi...
                      </span>
                    ) : (
                      "Gửi"
                    )}
                  </button>
                )}
              </div>
            </form>
          </>
        ) : (
          <div className="flex items-center justify-center flex-1 text-gray-500 bg-gray-50">
            <div className="text-center">
              <div className="text-6xl mb-4">💬</div>
              <h3 className="text-lg font-medium mb-2">Chọn một đoạn chat để bắt đầu</h3>
              <p className="text-sm">Tin nhắn của bạn sẽ hiển thị ở đây</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
