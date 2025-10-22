import { useRef, useState, useEffect } from "react";

import { SquarePen } from "lucide-react";

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

import SearchPanel from "./SearchPanel"; // thêm import

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

  // thêm handler để mở conversation khi chọn user từ search
  const openConversationFromSearch = async (user) => {
    try {
      // Tìm conversation đã có
      const found = conversations.find(conv =>
        String(conv.partner._id) === String(user._id) ||
        String(conv.partner.userId) === String(user.userId)
      );

      if (found) {
        setSelectedChat(found);
        setPage(1);
        isInitialLoad.current = true;
        await fetchMessages(found.partner._id, 1);
        return;
      }

      // Nếu chưa có conversation, tạo tạm object partner và mở
      const tempConv = {
        _id: `temp-${user._id}`,
        partner: user,
        lastMessage: null,
        unreadCount: 0
      };
      setConversations(prev => [tempConv, ...prev]);
      setSelectedChat(tempConv);
      setPage(1);
      isInitialLoad.current = true;
      await fetchMessages(user._id, 1);
    } catch (err) {
      // silent
      console.error("Open convo from search failed", err);
    }
  };

  return (
    <div className="flex h-full">
      {/* Danh sách hội thoại */}
      <div className="w-100 border-r border-gray-300 bg-white flex-shrink-0 h-screen flex flex-col">
        {/* Header user info */}
        <div className="flex items-center justify-between p-4  bg-white">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-lg">{user?.data.userId}</span>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 9l-7 7-7-7" /></svg>
          </div>
          <button className="p-2 cursor-pointer rounded">
            <SquarePen className="w-6 h-6 text-gray-700" />
          </button>
        </div>

        {/* Replace old search input with reusable SearchPanel */}
        <div className="px-4 mb-10 bg-white">
          <SearchPanel
            onUserSelect={openConversationFromSearch}
            placeholder="Tìm người để nhắn tin..."
            overlay={true} // <-- overlay dropdown (không đẩy conversations)
          />
        </div>

        {/* Avatar user + tên */}
        <div className="flex flex-col  relative px-4 py-4">
          {/* Bong bóng chat */}
          <div className="z-10 absolute -top-6 bg-white text-gray-700 text-xs px-3 py-3 rounded-2xl shadow-md">
            Ghi chú...
            {/* Đuôi nhọn của bubble */}
            <div className="absolute left-1/2 -bottom-1 w-2 h-2 bg-white rotate-45 transform -translate-x-1/2 shadow-md"></div>
          </div>

          {/* Avatar */}
          <div className="relative">
            <img
              src={user?.data.avatarUrl}
              alt={user?.data.username}
              className="w-16 h-16 rounded-full object-cover border"
            />
          </div>

          {/* Username */}
          <span className="mt-2 font-medium text-xs text-gray-800">
            Ghi chú của bạn
          </span>
        </div>

        {/* Tabs */}
        <div className="flex  bg-white">
          <button className="px-4 py-2 font-semibold ">Tin nhắn</button>
          <button className="flex-3 pl-25 py-2 font-semibold text-gray-400">Tin nhắn đang chờ</button>
        </div>
        {/* Danh sách hội thoại */}
        <div className="flex-1 overflow-y-auto bg-white">
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
            <div>
              {conversations.map((conversation) => (
                <div
                  key={conversation._id}
                  onClick={() => setSelectedChat(conversation)}
                  className={`flex items-center px-4 py-3 cursor-pointer transition-colors
              ${selectedChat?._id === conversation._id
                      ? "bg-blue-50 border-l-4 border-l-blue-500"
                      : "hover:bg-gray-50"
                    }`}
                >
                  {/* Avatar + badge */}
                  <img
                    src={conversation.partner?.avatarUrl ||
                      `https://ui-avatars.com/api/?name=${encodeURIComponent(conversation.partner?.userId || conversation.partner?.username || 'User')}&background=random`}
                    alt={conversation.partner?.userId || conversation.partner?.username || 'User'}
                    className="w-10 h-10 rounded-full object-cover border mr-3"
                    onError={(e) => {
                      e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(conversation.partner?.userId || conversation.partner?.username || 'User')}&background=random`;
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-gray-900 truncate">
                        {conversation.partner?.userId || conversation.partner?.username || 'Unknown User'}
                      </span>
                      {conversation.lastMessage && (
                        <span className="text-xs text-gray-400 ml-2 whitespace-nowrap">
                          {formatLastMessageTime(conversation.lastMessage.createdAt)}
                        </span>
                      )}
                    </div>
                    <span className="text-sm truncate text-gray-500">
                      {(conversation.lastMessage?.sender?._id || conversation.lastMessage?.sender) === userId ? "Bạn: " : ""}
                      {getMessagePreview(conversation.lastMessage)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      {/* Khu vực chat */}
      <div className="flex-1 flex flex-col min-w-0">
        {selectedChat ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-gray-300  flex items-center space-x-3">
              <img
                src={selectedChat.partner?.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedChat.partner?.userId || selectedChat.partner?.username || 'User')}&background=random`}
                alt={selectedChat.partner?.userId || selectedChat.partner?.username || 'User'}
                className="w-10 h-10 rounded-full object-cover"
              />
              <div>
                <h3 className="font-bold text-gray-900">
                  {selectedChat.partner?.userId || selectedChat.partner?.username || 'Unknown User'}
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
              className="flex-1 p-4 space-y-3 overflow-y-auto bg-white "
            >
              <div>
                <div className="flex justify-center mb-4">
                  <div className="flex flex-col items-center p-6   w-72">
                    {/* Avatar */}
                    <img
                      src={selectedChat.partner?.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedChat.partner?.userId || selectedChat.partner?.username || 'User')}&background=random`}
                      alt="avatar"
                      className="w-24 h-24 rounded-full object-cover"
                    />

                    {/* Username */}
                    <h2 className="mt-4 text-lg font-semibold text-gray-900">{selectedChat.partner?.username || selectedChat.partner?.username || 'Unknown User'}</h2>
                    <p className="text-sm text-gray-500">{selectedChat.partner?.username || 'Unknown User'} · Instagram</p>

                    {/* Button */}
                    <button className="mt-4 px-4 py-2 text-sm font-medium bg-gray-100 rounded-lg hover:bg-gray-200 cursor-pointer">
                      Xem trang cá nhân
                    </button>
                  </div>
                </div>
                {groupedMessages.map((item, idx) => {
                  if (item.type === 'date') {
                    return (
                      <div key={`date-${idx}`} className="flex items-center my-4">
                        <div className="flex-grow  border-gray-300"></div>
                        <span className="mx-4 text-xs text-gray-500  px-2 py-0.5 rounded"> {item.date}</span>
                        <div className="flex-grow  border-gray-300"></div>
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
                        className={`max-w-xs lg:max-w-md px-0 py-0 mt-2 mb-2 rounded-full`}
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
                            className={`max-w-xs lg:max-w-md px-4 py-1.5 rounded-full cursor-pointer ${isOwn
                              ? 'bg-blue-500 text-white '
                              : 'bg-[#EFEFEF] text-gray-900 border '
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

                            {/* <div className={`text-xs mt-1 opacity-75 ${isOwn ? 'text-blue-100' : 'text-gray-500'}`}>
                              {formatTime(message.createdAt)}
                              {isOwn && message.isRead && " • Đã xem"}
                            </div> */}

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
                          src={user?.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.userId || user?.username || 'You')}&background=random`}
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

            {/* Message Input */}

            <form onSubmit={handleSendMessage} className="p-4 bg-white">
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
              <div className="flex items-center w-full">
                <div className="flex items-center bg-white border border-gray-300 rounded-full w-full px-3 py-2">
                  {/* Emoji icon bên trái */}
                  <button type="button" className="mr-2 flex-shrink-0 text-2xl focus:outline-none">
                    <span role="img" aria-label="emoji">😊</span>
                  </button>
                  {/* Input */}
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Nhắn tin..."
                    className="flex-1 border-none outline-none bg-transparent text-base"
                    disabled={sendingMessage}
                  />
                  {/* Các icon bên phải hoặc nút gửi */}
                  <div className="flex items-center space-x-2 ml-2">
                    {(newMessage.trim().length > 0 || selectedImages.length > 0) ? (
                      <span
                        className="ml-2 text-blue-500 font-semibold cursor-pointer select-none"
                        style={{ padding: "0 16px", lineHeight: "36px" }}
                        onClick={() => !sendingMessage && handleSendMessage({ preventDefault: () => { } })}
                        tabIndex={0}
                        onKeyDown={e => {
                          if (e.key === "Enter") {
                            !sendingMessage && handleSendMessage({ preventDefault: () => { } });
                          }
                        }}
                        role="button"
                      >
                        {sendingMessage ? "Đang gửi..." : "Gửi"}
                      </span>
                    ) : (
                      <>
                        {/* Microphone */}
                        <button type="button" className="text-xl focus:outline-none" title="Ghi âm">
                          <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 1v14m0 0a5 5 0 0 0 5-5V6a5 5 0 0 0-10 0v4a5 5 0 0 0 5 5zm0 0v4m-4 0h8" /></svg>
                        </button>
                        {/* Ảnh/video */}
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
                          className="text-xl focus:outline-none"
                          title="Chọn ảnh/video"
                          onClick={() => imageInputRef.current.click()}
                        >
                          <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="M21 15l-5-5L5 21" /></svg>
                        </button>
                        {/* Sticker */}
                        <button type="button" className="text-xl focus:outline-none" title="Sticker">
                          <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /><circle cx="8" cy="10" r="1" /><circle cx="16" cy="10" r="1" /><path d="M8 16c1.333-1 2.667-1 4 0" /></svg>
                        </button>
                        {/* Tim */}
                        <button type="button" className="text-xl focus:outline-none" title="Gửi tim">
                          <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 21C12 21 4 13.5 4 8.5C4 5.5 6.5 3 9.5 3C11.04 3 12.5 4 13 5.09C13.5 4 14.96 3 16.5 3C19.5 3 22 5.5 22 8.5C22 13.5 12 21 12 21Z" /></svg>
                        </button>
                      </>
                    )}
                  </div>
                </div>
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
