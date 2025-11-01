import { useEffect, useRef, useState, useCallback } from "react";

import useAuth from "@/hooks/useAuth";
import useSocket from "@/hooks/useSocket";
import {
  getConversations,
  getConversation,
  sendMessage as apiSendMessage,
  markAsRead as apiMarkAsRead,
  markAllAsRead as apiMarkAllAsRead,
  reactToMessage as apiReactToMessage,
  uploadMedia as apiUploadMedia
} from "@/lib/api";

/**
 * useMessages hook
 * @param {Object} options
 * @param {string} options.initialUserId - optional userId from query to auto-open convo
 */
export default function useMessages({ initialUserId } = {}) {
  const { user } = useAuth();
  const userId = user?.data?._id;
  // get socket helpers from hook (will reuse context socket)
  const { socket, on, off, emit } = useSocket();

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

  const fetchConversations = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getConversations(1, 20);
      if (response && response.success && response.data) {
        setConversations(Array.isArray(response.data) ? response.data : []);
      } else {
        setConversations([]);
        setError("Invalid response from server");
      }
    } catch (err) {
      setConversations([]);
      setError(err.response?.data?.message || "Failed to load conversations");
    } finally {
      setLoading(false);
    }
  }, []);

  // ✅ SỬA: fetchMessages để hỗ trợ load more đúng cách
  const fetchMessages = useCallback(async (partnerId, pageToLoad = 1) => {
    try {
      const response = await getConversation(partnerId, pageToLoad, 10);
      if (response && response.success && response.data) {
        const newMessages = response.data.slice().reverse();
        
        // ✅ SỬA: Logic load more
        if (pageToLoad === 1) {
          setMessages(newMessages);
        } else {
          // ✅ QUAN TRỌNG: Thêm tin nhắn cũ vào ĐẦU danh sách
          setMessages(prev => [...newMessages, ...prev]);
        }

        setHasMore(response.pagination?.hasNext ?? false);
        
        // Mark as read chỉ khi load page đầu tiên
        if (pageToLoad === 1) {
          try { 
            await apiMarkAllAsRead(partnerId); 
          } catch { 
            /* silent */ 
          }
        }
      } else {
        if (pageToLoad === 1) setMessages([]);
        setHasMore(false);
      }
    } catch {
      if (pageToLoad === 1) setMessages([]);
      setHasMore(false);
    }
  }, []);

  const handleLoadMore = useCallback(async () => {
    if (loadingMore || !hasMore || !selectedChat) return;
    setLoadingMore(true);
    const container = messagesContainerRef.current;
    const prevScrollHeight = container ? container.scrollHeight : 0;
    const prevScrollTop = container ? container.scrollTop : 0;
    const nextPage = page + 1;
    await fetchMessages(selectedChat.partner._id, nextPage);
    setPage(nextPage);
    setLoadingMore(false);
    setTimeout(() => {
      if (container) {
        const newScrollHeight = container.scrollHeight;
        container.scrollTop = newScrollHeight - prevScrollHeight + prevScrollTop;
      }
    }, 0);
  }, [fetchMessages, hasMore, loadingMore, page, selectedChat]);

  // socket listeners
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (message) => {
      const senderId = String(message.sender?._id || message.sender);
      const recipientId = String(message.recipient?._id || message.recipient);
      const partnerId = String(selectedChat?.partner?._id);

      // append if belongs to current conversation
      if (selectedChat && (senderId === partnerId || recipientId === partnerId)) {
        setMessages((prev) => {
          if (prev.some((msg) => msg._id === message._id)) return prev;
          return [...prev, message];
        });
        setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 0);
      }

      // update conversations list (lastMessage/unread)
      setConversations(prev => prev.map(conv => {
        const pid = String(conv.partner._id);
        const sId = String(message.sender?._id || message.sender);
        const rId = String(message.recipient?._id || message.recipient);

        if (pid === sId || pid === rId) {
          return {
            ...conv,
            lastMessage: message,
            unreadCount:
              selectedChat && pid === String(selectedChat.partner._id)
                ? 0
                : (conv.unreadCount || 0) + 1
          };
        }
        return conv;
      }));
    };

    const handleMessageSent = ({ success, message }) => {
      if (!success || !message) return;
      const partnerId = String(selectedChat?.partner?._id);
      const sId = String(message.sender?._id || message.sender);
      const rId = String(message.recipient?._id || message.recipient);

      if (selectedChat && (partnerId === sId || partnerId === rId)) {
        setMessages((prev) => {
          if (prev.some((m) => m._id === message._id)) return prev;
          return [...prev, message];
        });
        setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 0);
      }

      setConversations(prev => prev.map(conv => {
        const pid = String(conv.partner._id);
        if (pid === String(message.recipient?._id || message.recipient) || pid === String(message.sender?._id || message.sender)) {
          return { ...conv, lastMessage: message };
        }
        return conv;
      }));
    };

    on("new_message", handleNewMessage);
    on("message_sent", handleMessageSent);

    return () => {
      off("new_message", handleNewMessage);
      off("message_sent", handleMessageSent);
    };
  }, [socket, on, off, selectedChat]);

  // image helpers
  const handleImageChange = useCallback((e) => {
    const files = Array.from(e.target.files);
    const previews = files.map(file => {
      const isVideo = file.type.startsWith("video/");
      return { file, url: URL.createObjectURL(file), mediaType: isVideo ? "video" : "image" };
    });
    setSelectedImages(prev => [...prev, ...previews]);
  }, []);

  const handleRemoveImage = useCallback((idx) => setSelectedImages(prev => prev.filter((_, i) => i !== idx)), []);

  const handleSendMessage = useCallback(async (e) => {
    if (e?.preventDefault) e.preventDefault();
    if (sendingMessage || (!newMessage.trim() && selectedImages.length === 0) || !selectedChat) return;

    setSendingMessage(true);
    let mediaUrls = [];
    let mediaTypes = [];

    if (selectedImages.length > 0) {
      const formData = new FormData();
      selectedImages.forEach(img => {
        formData.append("files", img.file);
        mediaTypes.push(img.mediaType);
      });
      const res = await apiUploadMedia(formData);
      const urls = res?.urls || res?.data?.urls;
      if (Array.isArray(urls)) mediaUrls = urls;
    }

    for (let i = 0; i < mediaUrls.length; i++) {
      const url = mediaUrls[i];
      const type = mediaTypes[i] || "image";
      if (socket || emit) {
        (emit || socket.emit).call(null, "send_message", { recipientId: selectedChat.partner._id, messageType: "media", mediaUrl: url, mediaType: type });
      } else {
        await apiSendMessage({ recipientId: selectedChat.partner._id, messageType: "media", mediaUrl: url, mediaType: type });
      }
    }

    if (newMessage.trim()) {
      if (emit) {
        emit("send_message", { recipientId: selectedChat.partner._id, content: newMessage.trim(), messageType: "text" });
      } else if (socket) {
        socket.emit("send_message", { recipientId: selectedChat.partner._id, content: newMessage.trim(), messageType: "text" });
      } else {
        await apiSendMessage({ recipientId: selectedChat.partner._id, content: newMessage.trim(), messageType: "text" });
      }
    }

    setSelectedImages([]);
    setNewMessage("");
    setSendingMessage(false);
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 0);
  }, [emit, newMessage, selectedChat, selectedImages, sendingMessage, socket]);

  const handleMarkAsRead = useCallback(async (messageId) => {
    try {
      await apiMarkAsRead(messageId);
      setMessages(prev => prev.map(m => m._id === messageId ? { ...m, isRead: true } : m));
    } catch { /* silent */ }
  }, []);

  const handleReaction = useCallback(async (messageId, emoji) => {
    try {
      await apiReactToMessage(messageId, emoji);
      if (selectedChat) fetchMessages(selectedChat.partner._id);
    } catch { /* silent */ }
  }, [fetchMessages, selectedChat]);

  const formatLastMessageTime = useCallback((dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);
    if (diffInHours < 24) return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
  }, []);

  const getMessagePreview = useCallback((message) => {
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
      case "call": // ✅ SỬA: Chỉ 3 status
        if (message.callData) {
          const status = message.callData.status;
          switch (status) {
            case "declined": return "📞 Cuộc gọi bị từ chối";
            case "incoming": return "📞 Cuộc gọi đến";
            case "outgoing": return "📞 Cuộc gọi đi";
            default: return "📞 Cuộc gọi";
          }
        }
        return "📞 Cuộc gọi";
      default: 
        return "Tin nhắn";
    }
  }, []);

  const isOwnMessage = useCallback((message) => {
    if (!userId || !message) return false;
    const messageSenderId = message.sender?._id || message.sender;
    return String(userId) === String(messageSenderId);
  }, [userId]);

  const groupMessagesByDate = useCallback((messagesArr) => {
    const groups = [];
    let lastDate = null;
    messagesArr.forEach((msg) => {
      const msgDate = new Date(msg.createdAt);
      const dateStr = msgDate.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
      if (dateStr !== lastDate) {
        groups.push({ type: 'date', date: dateStr });
        lastDate = dateStr;
      }
      groups.push({ type: 'message', message: msg });
    });
    return groups;
  }, []);

  const selectConversation = useCallback(async (conversation, navigateFn) => {
    setSelectedChat(conversation);
    setPage(1);
    isInitialLoad.current = true;
    try {
      await fetchMessages(conversation.partner._id, 1);
    } catch (err) {
      // silent
    }
    if (typeof navigateFn === "function") {
      navigateFn(`/message?userId=${conversation.partner?.userId || String(conversation.partner._id)}`);
    }
  }, [fetchMessages]);

  const openConversationFromSearch = useCallback(async (userObj, navigateFn) => {
    try {
      const found = conversations.find(conv =>
        String(conv.partner._id) === String(userObj._id) ||
        String(conv.partner.userId) === String(userObj.userId)
      );
      if (found) {
        await selectConversation(found, navigateFn);
        return;
      }
      const tempConv = { _id: `temp-${userObj._id}`, partner: userObj, lastMessage: null, unreadCount: 0 };
      setConversations(prev => [tempConv, ...prev]);
      await selectConversation(tempConv, navigateFn);
    } catch (err) { console.error("Open convo from search failed", err); }
  }, [conversations, selectConversation]);

  // auto-open from initialUserId (if provided)
  useEffect(() => {
    if (!initialUserId || conversations.length === 0) return;
    const found = conversations.find(conv =>
      String(conv.partner._id) === String(initialUserId) ||
      String(conv.partner.userId) === String(initialUserId)
    );
    (async () => {
      if (found) {
        await selectConversation(found);
        return;
      }
      const tempConv = { _id: `temp-${initialUserId}`, partner: { _id: initialUserId }, lastMessage: null, unreadCount: 0 };
      setConversations(prev => [tempConv, ...prev]);
      await selectConversation(tempConv);
    })();
  }, [initialUserId, conversations, selectConversation]);

  // initial load
  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  return {
    // state
    selectedChat,
    conversations,
    messages,
    loading,
    error,
    sendingMessage,
    newMessage,
    selectedImages,
    page,
    hasMore,
    loadingMore,
    // refs
    messagesEndRef,
    messagesContainerRef,
    imageInputRef,
    // actions
    setNewMessage,
    setSelectedImages,
    fetchConversations,
    fetchMessages,
    selectConversation,
    openConversationFromSearch,
    handleImageChange,
    handleRemoveImage,
    handleSendMessage,
    handleLoadMore,
    handleMarkAsRead,
    handleReaction,
    formatLastMessageTime,
    getMessagePreview,
    isOwnMessage,
    groupMessagesByDate
  };
}