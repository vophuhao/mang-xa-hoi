import SearchPanel from "../SearchPanel";

export default function ConversationList({
  user,
  conversations = [],
  selectedChatId,
  onSelectConversation,
  fetchConversations,
  openConversationFromSearch,
}) {
  return (
    <div className="w-100 border-r border-gray-300 bg-white flex-shrink-0 h-screen flex flex-col">
      {/* Header user info */}
      <div className="flex items-center justify-between p-4 bg-white">
        <div className="flex items-center space-x-2">
          <span className="font-bold text-lg">{user?.data.userId}</span>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 9l-7 7-7-7" /></svg>
        </div>
        <button className="p-2 cursor-pointer rounded">
          {/* icon */}
        </button>
      </div>

      {/* Search */}
      <div className="px-4 mb-10 bg-white">
        <SearchPanel
          onUserSelect={openConversationFromSearch}
          placeholder="Tìm người để nhắn tin..."
          overlay={true}
        />
      </div>

      {/* Avatar / note area */}
      <div className="flex flex-col relative px-4 py-4">
        <div className="relative">
          <img
            src={user?.data.avatarUrl}
            alt={user?.data.username}
            className="w-16 h-16 rounded-full object-cover border"
          />
        </div>
        <span className="mt-2 font-medium text-xs text-gray-800">
          Ghi chú của bạn
        </span>
      </div>

      {/* Tabs */}
      <div className="flex bg-white">
        <button className="px-4 py-2 font-semibold">Tin nhắn</button>
        <button className="flex-3 pl-25 py-2 font-semibold text-gray-400">Tin nhắn đang chờ</button>
      </div>

      {/* Conversation list */}
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
                onClick={() => onSelectConversation(conversation)}
                className={`flex items-center px-4 py-3 cursor-pointer transition-colors
                  ${selectedChatId === conversation._id
                    ? "bg-blue-50 border-l-4 border-l-blue-500"
                    : "hover:bg-gray-50"
                  }`}
              >
                <img
                  src={conversation.partner?.avatarUrl ||
                    `https://ui-avatars.com/api/?name=${encodeURIComponent(conversation.partner?.userId || conversation.partner?.username || 'User')}&background=random`}
                  alt={conversation.partner?.userId || conversation.partner?.username || 'User'}
                  className="w-10 h-10 rounded-full object-cover border mr-3"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-gray-900 truncate">
                      {conversation.partner?.userId || conversation.partner?.username || 'Unknown User'}
                    </span>
                    {conversation.lastMessage && (
                      <span className="text-xs text-gray-400 ml-2 whitespace-nowrap">
                        {new Date(conversation.lastMessage.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    )}
                  </div>
                  <span className="text-sm truncate text-gray-500">
                    {(conversation.lastMessage?.sender?._id || conversation.lastMessage?.sender) === user?.data?._id ? "Bạn: " : ""}
                    {conversation.lastMessage ? (conversation.lastMessage.content || (conversation.lastMessage.messageType === "media" ? "📷 Media" : "Tin nhắn")) : "Không có tin nhắn"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}