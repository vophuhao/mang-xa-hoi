import { useState, useEffect } from "react";

import { useSelector } from "react-redux";

import { 
  getConversations, 
  getConversation, 
  sendMessage,
  markAsRead,
  reactToMessage 
} from "../lib/api";

export default function MessagePanel() {
  const [selectedChat, setSelectedChat] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  
  const { user } = useSelector((state) => state.auth);

  // ✅ Debug user state
  console.log("👤 Current user:", user);

  // Lấy danh sách conversations khi component mount
  useEffect(() => {
    fetchConversations();
  }, []);

  // Lấy messages khi chọn chat
  useEffect(() => {
    if (selectedChat) {
      console.log("🎯 Selected chat:", selectedChat);
      console.log("🎯 Partner ID:", selectedChat.partner._id);
      fetchMessages(selectedChat.partner._id);
    }
  }, [selectedChat]);

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

  const fetchMessages = async (partnerId) => {
    try {
      console.log("🔍 Fetching messages for partner:", partnerId);
      const response = await getConversation(partnerId, 1, 50);
      console.log("📨 Messages response:", response);
      
      if (response && response.success && response.data) {
        console.log("✅ Setting messages:", response.data);
        setMessages(response.data);
      } else {
        console.log("❌ No messages found");
        setMessages([]);
      }
    } catch (error) {
      console.error("💥 Error fetching messages:", error);
      setMessages([]);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!newMessage.trim() || !selectedChat || sendingMessage) return;

    try {
      setSendingMessage(true);
      
      const messageData = {
        recipientId: selectedChat.partner._id,
        content: newMessage.trim(),
        messageType: "text"
      };

      const response = await sendMessage(messageData);
      
      if (response && response.success && response.data) {
        setMessages(prev => [response.data, ...prev]);
        setNewMessage("");
        
        setConversations(prev => 
          prev.map(conv => 
            conv.partner._id === selectedChat.partner._id 
              ? { ...conv, lastMessage: response.data }
              : conv
          )
        );
      }
    } catch (error) {
      alert("Không thể gửi tin nhắn. Vui lòng thử lại!");
    } finally {
      setSendingMessage(false);
    }
  };

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
      console.error("Error marking message as read:", error);
    }
  };

  const handleReaction = async (messageId, emoji) => {
    try {
      await reactToMessage(messageId, emoji);
      
      if (selectedChat) {
        fetchMessages(selectedChat.partner._id);
      }
    } catch (error) {
      console.error("Error adding reaction:", error);
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
        return message.mediaType === "image" ? "📷 Ảnh" : "🎥 Video";
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
    if (!user || !message) return false;
    
    // Check multiple possible user ID formats
    const currentUserId = user.id || user._id;
    const messageSenderId = message.sender?._id || message.sender;
    
    console.log("🔍 Checking message ownership:", {
      currentUserId,
      messageSenderId,
      isOwn: currentUserId === messageSenderId
    });
    
    return currentUserId === messageSenderId;
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

  return (
    <div className="h-screen flex">
      {/* Danh sách chat - Left Panel */}
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
                    {conversation.lastMessage?.sender === user?.id ? "Bạn: " : ""}
                    {getMessagePreview(conversation.lastMessage)}
                  </p>
                  
                  <p className="text-xs text-gray-400">@{conversation.partner?.username || 'unknown'}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Chat Area - Right Panel */}
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
            <div className="flex-1 p-4 space-y-3 overflow-y-auto bg-gray-50">
              {messages.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  Chưa có tin nhắn nào. Hãy bắt đầu cuộc trò chuyện!
                </div>
              ) : (
                messages.slice().reverse().map((message) => {
                  const isOwn = isOwnMessage(message); // ✅ Use enhanced function
                  
                  console.log("🔄 Rendering message:", { // Debug log
                    messageId: message._id,
                    content: message.content,
                    sender: message.sender,
                    isOwn: isOwn
                  });
                  
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
                        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl cursor-pointer ${
                          isOwn 
                            ? 'bg-blue-500 text-white rounded-br-md' // ✅ User: Blue bubble, right side
                            : 'bg-white text-gray-900 border rounded-bl-md' // ✅ Friend: White bubble, left side
                        }`}
                        onClick={() => !isOwn && !message.isRead && handleMarkAsRead(message._id)}
                        onDoubleClick={() => handleReaction(message._id, "❤️")}
                      >
                        {message.messageType === "text" && (
                          <p className="text-sm">{message.content}</p>
                        )}
                        
                        {message.messageType === "media" && message.mediaUrl && (
                          <div>
                            {message.mediaType === "image" ? (
                              <img 
                                src={message.mediaUrl} 
                                alt="Shared media" 
                                className="rounded-lg max-w-full h-auto"
                              />
                            ) : (
                              <video 
                                src={message.mediaUrl} 
                                controls 
                                className="rounded-lg max-w-full h-auto"
                              />
                            )}
                            {message.content && (
                              <p className="text-sm mt-2">{message.content}</p>
                            )}
                          </div>
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
                })
              )}
            </div>
            
            {/* Message Input */}
            <form onSubmit={handleSendMessage} className="p-4 border-t bg-white flex space-x-3">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Nhắn tin..."
                className="flex-1 rounded-full border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={sendingMessage}
              />
              <button 
                type="submit"
                disabled={!newMessage.trim() || sendingMessage}
                className={`px-6 py-2 rounded-full font-medium transition-colors ${
                  newMessage.trim() && !sendingMessage
                    ? 'bg-blue-500 hover:bg-blue-600 text-white' 
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
              >
                {sendingMessage ? "..." : "Gửi"}
              </button>
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
