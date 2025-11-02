import { useCallback, useState } from "react";

import { useNavigate, useSearchParams } from "react-router-dom";

import ChatWindow from "@/components/message/ChatWindow";
import ConversationList from "@/components/message/ConversationList";
import useAuth from "@/hooks/useAuth";
import useMessages from "@/hooks/useMessages";
import useOnlineUsers from "@/hooks/useOnlineUsers";

const Messages = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const userId = user?.data?._id;

  // ✅ THÊM: State cho infinite scroll
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

  // ✅ THÊM: Load more messages function
  const loadMoreMessages = useCallback(async () => {
    if (!selectedChat?.partner?._id || isLoadingMore || !hasMore) return;

    setIsLoadingMore(true);
    try {
      const nextPage = currentPage + 1;

      // ✅ SỬA: Sử dụng fetchMessages từ hook với page tiếp theo
      await fetchMessages(selectedChat.partner._id, nextPage);

      setCurrentPage(nextPage);
    } catch (error) {
      console.error("[MESSAGES] Failed to load more messages:", error);
    } finally {
      setIsLoadingMore(false);
    }
  }, [selectedChat?.partner?._id, currentPage, isLoadingMore, hasMore, fetchMessages]);

  const handleSelectConversation = async (conversation) => {
    // ✅ THÊM: Reset pagination khi chọn chat mới
    setCurrentPage(1);
    await selectConversation(conversation, (url) => navigate(url));
  };

  const handleOpenConversationFromSearch = async (userObj) => {
    // ✅ THÊM: Reset pagination khi mở chat từ search
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
        // ✅ KHÔNG cần pass hook, component tự dùng useOnlineUsers
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
        userId={userId}
        conversationFullyLoaded={!hasMore}
        // ✅ THÊM: Props cho infinite scroll
        hasNextPage={hasMore}
        loadMoreMessages={loadMoreMessages}
        isLoadingMore={isLoadingMore}
        // ✅ KHÔNG cần pass hook, component tự dùng useOnlineUsers
      />
    </div>
  );
};

export default Messages;
