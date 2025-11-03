import { useCallback, useState } from "react";

import { useNavigate, useSearchParams } from "react-router-dom";

import ChatWindow from "@/components/message/ChatWindow";
import ConversationList from "@/components/message/ConversationList";
import useAuth from "@/hooks/useAuth";
import useMessages from "@/hooks/useMessages";
import useOnlineUsers from "@/hooks/useOnlineUsers";
// ✅ THÊM: Import API functions
import { deleteMessage as apiDeleteMessage, deleteConversation as apiDeleteConversation } from "@/lib/api";

const Messages = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const userId = user?.data?._id;

  const [currentPage, setCurrentPage] = useState(1);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const {
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
    messagesEndRef,
    messagesContainerRef,
    imageInputRef,
    setNewMessage,
    setSelectedImages,
    setMessages, // ✅ THÊM: Cần thêm setter này từ useMessages
    setConversations, // ✅ THÊM: Cần thêm setter này từ useMessages
    setSelectedChat, // ✅ THÊM: Cần thêm setter này từ useMessages
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
    groupMessagesByDate,
  } = useMessages({ initialUserId: searchParams.get("userId") });

  const onlineUsersHook = useOnlineUsers();
  const groupedMessages = groupMessagesByDate(messages);

  // ✅ THÊM: Handle delete message
  const handleDeleteMessage = useCallback(async (messageId) => {
    try {
      console.log('[MESSAGES] Deleting message:', messageId);
      
      await apiDeleteMessage(messageId);
      
      // Remove message from local state
      setMessages(prev => prev.filter(msg => msg._id !== messageId));
      
      // Update conversation's last message if needed
      setConversations(prev => prev.map(conv => {
        if (conv.lastMessage && conv.lastMessage._id === messageId) {
          // Find the previous message
          const remainingMessages = messages.filter(msg => msg._id !== messageId);
          const newLastMessage = remainingMessages[remainingMessages.length - 1] || null;
          return { ...conv, lastMessage: newLastMessage };
        }
        return conv;
      }));
      
      console.log('[MESSAGES] Message deleted successfully');
      return { success: true };
    } catch (error) {
      console.error('[MESSAGES] Failed to delete message:', error);
      return { success: false, error: error.message };
    }
  }, [messages, setMessages, setConversations]);

  // ✅ THÊM: Handle delete conversation
  const handleDeleteConversation = useCallback(async (partnerId) => {
    try {
      console.log('[MESSAGES] Deleting conversation with:', partnerId);
      
      await apiDeleteConversation(partnerId);
      
      // Remove conversation from local state
      setConversations(prev => prev.filter(conv => 
        String(conv.partner._id) !== String(partnerId)
      ));
      
      // Clear selected chat if it's the deleted conversation
      if (selectedChat && String(selectedChat.partner._id) === String(partnerId)) {
        setSelectedChat(null);
        setMessages([]);
        // Navigate back to messages without query params
        navigate('/message');
      }
      
      console.log('[MESSAGES] Conversation deleted successfully');
      return { success: true };
    } catch (error) {
      console.error('[MESSAGES] Failed to delete conversation:', error);
      return { success: false, error: error.message };
    }
  }, [selectedChat, setConversations, setSelectedChat, setMessages, navigate]);

  const loadMoreMessages = useCallback(async () => {
    if (!selectedChat?.partner?._id || isLoadingMore || !hasMore) return;

    setIsLoadingMore(true);
    try {
      const nextPage = currentPage + 1;

      await fetchMessages(selectedChat.partner._id, nextPage);

      setCurrentPage(nextPage);
    } catch (error) {
      console.error("[MESSAGES] Failed to load more messages:", error);
    } finally {
      setIsLoadingMore(false);
    }
  }, [selectedChat?.partner?._id, currentPage, isLoadingMore, hasMore, fetchMessages]);

  const handleSelectConversation = async (conversation) => {
    setCurrentPage(1);
    await selectConversation(conversation, (url) => navigate(url));
  };

  const handleOpenConversationFromSearch = async (userObj) => {
    setCurrentPage(1);
    await openConversationFromSearch(userObj, (url) => navigate(url));
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center bg-white dark:bg-gray-900">
        <div className="text-center">
          <div className="mx-auto mb-2 h-8 w-8 animate-spin rounded-full border-b-2 border-blue-500 dark:border-blue-400"></div>
          <div className="text-gray-500 dark:text-gray-400">Đang tải tin nhắn...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full items-center justify-center bg-white dark:bg-gray-900">
        <div className="text-center">
          <div className="mb-2 text-red-500 dark:text-red-400">❌ {error}</div>
          <button
            onClick={fetchConversations}
            className="rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700"
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full bg-white dark:bg-gray-900">
      <ConversationList
        user={user}
        userId={userId}
        conversations={conversations}
        selectedChatId={selectedChat?._id}
        onSelectConversation={handleSelectConversation}
        fetchConversations={fetchConversations}
        openConversationFromSearch={handleOpenConversationFromSearch}
        handleDeleteConversation={handleDeleteConversation} // ✅ THÊM
      />

      <ChatWindow
        selectedChat={selectedChat}
        groupedMessages={groupedMessages}
        messagesContainerRef={messagesContainerRef}
        messagesEndRef={messagesEndRef}
        isOwnMessage={isOwnMessage}
        handleMarkAsRead={handleMarkAsRead}
        handleReaction={handleReaction}
        handleDeleteMessage={handleDeleteMessage} // ✅ THÊM
        selectedImages={selectedImages}
        handleRemoveImage={handleRemoveImage}
        imageInputRef={imageInputRef}
        handleImageChange={handleImageChange}
        newMessage={newMessage}
        setNewMessage={setNewMessage}
        sendingMessage={sendingMessage}
        handleSendMessage={handleSendMessage}
        user={user}
        userId={userId}
        conversationFullyLoaded={!hasMore}
        hasNextPage={hasMore}
        loadMoreMessages={loadMoreMessages}
        isLoadingMore={isLoadingMore}
      />
    </div>
  );
};

export default Messages;
