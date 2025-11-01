import { useNavigate, useSearchParams } from "react-router-dom";

import ChatWindow from "@/components/message/ChatWindow";
import ConversationList from "@/components/message/ConversationList";
import useAuth from "@/hooks/useAuth";
import useMessages from "@/hooks/useMessages";

const Messages = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const userId = user?.data?._id;

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
    groupMessagesByDate
  } = useMessages({ initialUserId: searchParams.get("userId") });

  // fetchConversations already called inside hook on mount

  // hook handles selectedChat -> fetch messages

  // scrolling handled in hook

  // scroll listener can be attached by consumer if needed (or keep messagesContainerRef)

  // everything else handled by useMessages hook

  const groupedMessages = groupMessagesByDate(messages);

  // Select conversation and update URL
  const handleSelectConversation = async (conversation) => {
    await selectConversation(conversation, (url) => navigate(url));
  };

  // auto-open handled by useMessages via initialUserId

  // open conversation from search (used by ConversationList)
  const handleOpenConversationFromSearch = async (userObj) => {
    await openConversationFromSearch(userObj, (url) => navigate(url));
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
        userId={userId}
        conversations={conversations}
        selectedChatId={selectedChat?._id}
        onSelectConversation={handleSelectConversation}
        fetchConversations={fetchConversations}
        openConversationFromSearch={handleOpenConversationFromSearch}
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
      />
    </div>
  );
};

export default Messages;