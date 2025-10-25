import React from "react";

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
  // Hover-based timestamp popup — no local state needed

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
      <div className="p-4 border-b border-gray-300 flex items-center space-x-3">
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
                  <span className="mx-4 text-xs text-gray-500 px-2 py-0.5 rounded"> {item.date}</span>
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

                {/* message bubble wrapper: use group hover to show popup under bubble */}
                <div className={`relative group max-w-xs lg:max-w-md px-0 py-0 mt-2 mb-2 rounded-full`}>
                  {message.messageType === "media" && message.mediaUrl ? (
                    <div className="max-w-xs lg:max-w-md px-0 py-0 rounded-2xl">
                      {message.mediaType === "image" ? (
                        <img src={message.mediaUrl} alt="Shared image" className="rounded-lg max-w-full h-auto" />
                      ) : message.mediaType === "video" ? (
                        <video src={message.mediaUrl} controls className="rounded-lg max-w-full h-auto" />
                      ) : (
                        <span>Không hỗ trợ media này</span>
                      )}
                      {message.content && <p className="text-sm mt-2">{message.content}</p>}
                    </div>
                  ) : (
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-1.5 rounded-full cursor-pointer ${isOwn ? 'bg-blue-500 text-white' : 'bg-[#EFEFEF] text-gray-900 border'}`}
                      onClick={() => {
                        // only mark read on click for recipients, popup shows on hover
                        try { if (!isOwn && !message.isRead && typeof handleMarkAsRead === "function") handleMarkAsRead(message._id); } catch (err) { console.error(err); }
                      }}
                      onDoubleClick={() => handleReaction(message._id, "❤️")}
                    >
                      {message.messageType === "text" && <p className="text-sm">{message.content}</p>}
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
                  )}

                  {/* popup shown on hover (group-hover) */}
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
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Nhắn tin..."
              className="flex-1 border-none outline-none bg-transparent text-base"
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