import { useRef, useState, useEffect } from "react";

import { useNavigate, useSearchParams } from "react-router-dom";

import ChatWindow from "@/components/message/ChatWindow";
import ConversationList from "@/components/message/ConversationList";
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
} from "@/lib/api";


const Messages = () => {
  const { user } = useAuth();
  const userId = user?.data?._id;
  // use hook and get helper functions
  const { socket, on, off, emit } = useSocket({ token: user?.token || user?.data?.token, userId });
  const navigate = useNavigate(); // navigate to update query param when selecting convo
  const [searchParams] = useSearchParams();

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

  // Fetch conversations
  useEffect(() => {
    fetchConversations();
    // eslint-disable-next-line
  }, []);

  // Fetch messages when selectedChat changes
  useEffect(() => {
    if (selectedChat) {
      setPage(1);
      isInitialLoad.current = true;
      fetchMessages(selectedChat.partner._id, 1);
    }
    // eslint-disable-next-line
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
    // eslint-disable-next-line
  }, [hasMore, loadingMore, selectedChat, page]);

  // Socket: receive new message
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (message) => {
      console.log("[socket] received new_message:", message);
      const senderId = String(message.sender?._id || message.sender);
      const recipientId = String(message.recipient?._id || message.recipient);
      const partnerId = String(selectedChat?.partner?._id);

      if (
        selectedChat &&
        (senderId === partnerId || recipientId === partnerId)
      ) {
        setMessages((prev) => {
          if (prev.some((msg) => msg._id === message._id)) return prev;
          return [...prev, message];
        });
        setTimeout(() => {
          if (messagesEndRef.current) messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
        }, 0);
      }

      setConversations(prev => prev.map(conv => {
        const partnerId = String(conv.partner._id);
        const sId = String(message.sender?._id || message.sender);
        const rId = String(message.recipient?._id || message.recipient);

        if (partnerId === sId || partnerId === rId) {
          return {
            ...conv,
            lastMessage: message,
            unreadCount:
              selectedChat && partnerId === String(selectedChat.partner._id)
                ? 0
                : (conv.unreadCount || 0) + 1
          };
        }
        return conv;
      }));
    };

    // register via hook.on which ensures socket exists
    on("new_message", handleNewMessage);
    return () => off("new_message", handleNewMessage);
    // eslint-disable-next-line
  }, [socket, selectedChat]);

  // Socket: receive confirmation for sent message (append for sender)
  useEffect(() => {
    if (!socket) return;

    const handleMessageSent = ({ success, message }) => {
      if (!success || !message) return;
      // If selected chat is the partner, append the message
      const partnerId = String(selectedChat?.partner?._id);
      const sId = String(message.sender?._id || message.sender);
      const rId = String(message.recipient?._id || message.recipient);

      // update messages if message belongs to current conversation
      if (selectedChat && (partnerId === sId || partnerId === rId)) {
        setMessages((prev) => {
          if (prev.some((m) => m._id === message._id)) return prev;
          return [...prev, message];
        });
        setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 0);
      }

      // update conversations list (lastMessage)
      setConversations(prev => prev.map(conv => {
        const pid = String(conv.partner._id);
        if (pid === String(message.recipient?._id || message.recipient) || pid === String(message.sender?._id || message.sender)) {
          return { ...conv, lastMessage: message };
        }
        return conv;
      }));
    };

    on("message_sent", handleMessageSent);
    return () => off("message_sent", handleMessageSent);
  }, [socket, selectedChat]);

  // No per-conversation socket join/leave here — socket is global (App provides it).
  // Server should forward messages to recipient by room `u:{recipientId}`.
  useEffect(() => {
    // No per-conversation socket join/leave here — socket is global (App provides it).
    // Server should forward messages to recipient by room `u:{recipientId}`.
  }, [socket, selectedChat, userId]);

  // API actions
  const fetchConversations = async () => {
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
  };

  const fetchMessages = async (partnerId, pageToLoad = 1) => {
    try {
      const response = await getConversation(partnerId, pageToLoad, 10);
      if (response && response.success && response.data) {
        const newMessages = response.data.slice().reverse();
        if (pageToLoad === 1) setMessages(newMessages);
        else setMessages(prev => [...newMessages, ...prev]);

        setHasMore(response.pagination?.hasNext ?? false);
        try { await markAllAsRead(partnerId); } catch { /* silent */ }
      } else {
        if (pageToLoad === 1) setMessages([]);
        setHasMore(false);
      }
    } catch {
      if (pageToLoad === 1) setMessages([]);
      setHasMore(false);
    }
  };

  // Images
  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    const previews = files.map(file => {
      const isVideo = file.type.startsWith("video/");
      return { file, url: URL.createObjectURL(file), mediaType: isVideo ? "video" : "image" };
    });
    setSelectedImages(prev => [...prev, ...previews]);
  };
  const handleRemoveImage = (idx) => setSelectedImages(prev => prev.filter((_, i) => i !== idx));

  // Send message
  const handleSendMessage = async (e) => {
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
      const res = await uploadMedia(formData);
      const urls = res?.urls || res?.data?.urls;
      if (Array.isArray(urls)) mediaUrls = urls;
    }

    for (let i = 0; i < mediaUrls.length; i++) {
      const url = mediaUrls[i];
      const type = mediaTypes[i] || "image";
      if (socket) {
        console.log("[socket] emit send_message ->", { to: selectedChat.partner._id, mediaUrl: url, mediaType: type });
        socket.emit("send_message", { recipientId: selectedChat.partner._id, messageType: "media", mediaUrl: url, mediaType: type });
      } else {
        await sendMessage({ recipientId: selectedChat.partner._id, messageType: "media", mediaUrl: url, mediaType: type });
      }
    }

    if (newMessage.trim()) {
      if (emit) {
        console.log("[socket] emit send_message ->", { to: selectedChat.partner._id, content: newMessage.trim(), messageType: "text" });
        emit("send_message", { recipientId: selectedChat.partner._id, content: newMessage.trim(), messageType: "text" });
      } else if (socket) {
        socket.emit("send_message", { recipientId: selectedChat.partner._id, content: newMessage.trim(), messageType: "text" });
      } else {
        await sendMessage({ recipientId: selectedChat.partner._id, content: newMessage.trim(), messageType: "text" });
      }
    }

    setSelectedImages([]);
    setNewMessage("");
    setSendingMessage(false);
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 0);
  };

  const handleMarkAsRead = async (messageId) => {
    try {
      await markAsRead(messageId);
      setMessages(prev => prev.map(m => m._id === messageId ? { ...m, isRead: true } : m));
    } catch { /* silent */ }
  };

  const handleReaction = async (messageId, emoji) => {
    try {
      await reactToMessage(messageId, emoji);
      if (selectedChat) fetchMessages(selectedChat.partner._id);
    } catch { /* silent */ }
  };

  const formatLastMessageTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);
    if (diffInHours < 24) return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
  };

  const getMessagePreview = (message) => {
    if (!message) return "Không có tin nhắn";
    switch (message.messageType) {
      case "text": return message.content || "Tin nhắn văn bản";
      case "media": return message.mediaType === "image" ? "📷 Ảnh" : message.mediaType === "video" ? "🎥 Video" : "Shared media";
      case "location": return "📍 Vị trí";
      case "post_share": return "📄 Chia sẻ bài viết";
      case "story_share": return "📖 Chia sẻ story";
      default: return "Tin nhắn";
    }
  };

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
  };

  const groupedMessages = groupMessagesByDate(messages);

  // Select conversation and update URL
  const handleSelectConversation = async (conversation) => {
    setSelectedChat(conversation);
    setPage(1);
    isInitialLoad.current = true;
    try {
      await fetchMessages(conversation.partner._id, 1);
    } catch (err) {
      // silent
    }
    navigate(`/message?userId=${conversation.partner?.userId || String(conversation.partner._id)}`);
  };

  // If page opened with ?userId=..., auto-open that conversation after conversations loaded
  useEffect(() => {
    const paramUserId = searchParams.get("userId");
    if (!paramUserId || !conversations || conversations.length === 0) return;

    // If already selected, do nothing
    if (selectedChat && String(selectedChat.partner?._id) === String(paramUserId)) return;

    const found = conversations.find(conv =>
      String(conv.partner._id) === String(paramUserId) ||
      String(conv.partner.userId) === String(paramUserId)
    );

    (async () => {
      if (found) {
        setSelectedChat(found);
        setPage(1);
        isInitialLoad.current = true;
        await fetchMessages(found.partner._id, 1);
        return;
      }

      // If not found in conversations, try to open a temp conversation (will attempt to fetch messages)
      const tempConv = { _id: `temp-${paramUserId}`, partner: { _id: paramUserId }, lastMessage: null, unreadCount: 0 };
      setConversations(prev => [tempConv, ...prev]);
      setSelectedChat(tempConv);
      setPage(1);
      isInitialLoad.current = true;
      await fetchMessages(paramUserId, 1);
    })();
    // eslint-disable-next-line
  }, [conversations, searchParams]);

  // open conversation from search (used by ConversationList)
  const openConversationFromSearch = async (userObj) => {
    try {
      const found = conversations.find(conv =>
        String(conv.partner._id) === String(userObj._id) ||
        String(conv.partner.userId) === String(userObj.userId)
      );
      if (found) {
        setSelectedChat(found);
        setPage(1);
        isInitialLoad.current = true;
        await fetchMessages(found.partner._id, 1);
        navigate(`/message?userId=${found.partner?.userId || String(found.partner._id)}`);
        return;
      }
      const tempConv = { _id: `temp-${userObj._id}`, partner: userObj, lastMessage: null, unreadCount: 0 };
      setConversations(prev => [tempConv, ...prev]);
      setSelectedChat(tempConv);
      setPage(1);
      isInitialLoad.current = true;
      await fetchMessages(userObj._id, 1);
      navigate(`/message?userId=${userObj.userId || String(userObj._id)}`);
    } catch (err) { console.error("Open convo from search failed", err); }
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
          <button onClick={fetchConversations} className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">Thử lại</button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full">
      <ConversationList
        user={user}
        conversations={conversations}
        selectedChatId={selectedChat?._id}
        onSelectConversation={handleSelectConversation}
        fetchConversations={fetchConversations}
        openConversationFromSearch={openConversationFromSearch}
      />

      <ChatWindow
        selectedChat={selectedChat}
        groupedMessages={groupedMessages}
        messagesContainerRef={messagesContainerRef}
        messagesEndRef={messagesEndRef}
        isOwnMessage={isOwnMessage}
        handleMarkAsRead={handleMarkAsRead}
        handleReaction={handleReaction}
        selectedImages={selectedImages}
        handleRemoveImage={handleRemoveImage}
        imageInputRef={imageInputRef}
        handleImageChange={handleImageChange}
        newMessage={newMessage}
        setNewMessage={setNewMessage}
        sendingMessage={sendingMessage}
        handleSendMessage={handleSendMessage}
        user={user}
        conversationFullyLoaded={!hasMore}
      />
    </div>
  );
};

export default Messages;