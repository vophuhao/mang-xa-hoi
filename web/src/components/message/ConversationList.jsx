import useOnlineUsers from "@/hooks/useOnlineUsers";

import OnlineStatusIndicator from "../common/OnlineStatusIndicator";
import SearchPanel from "../SearchPanel";

export default function ConversationList({
  user,
  conversations = [],
  selectedChatId,
  onSelectConversation,
  fetchConversations,
  openConversationFromSearch,
}) {
  // ✅ THÊM: Hook để check online status
  const { isUserOnline } = useOnlineUsers();

  return (
    <div className="flex h-screen w-full flex-shrink-0 flex-col border-r border-gray-300 bg-white md:w-96 lg:w-100 dark:border-gray-700 dark:bg-gray-900">
      {/* Header user info */}
      <div className="flex items-center justify-between border-b border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
        <div className="flex items-center space-x-2">
          <span className="text-lg font-bold text-gray-900 dark:text-white">
            {user?.data.userId}
          </span>
          <svg
            className="h-4 w-4 text-gray-700 dark:text-gray-300"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M19 9l-7 7-7-7" />
          </svg>
        </div>
        <button className="cursor-pointer rounded p-2 hover:bg-gray-100 dark:hover:bg-gray-800">
          {/* icon */}
        </button>
      </div>

      {/* Search */}
      <div className="mb-4 bg-white px-4 md:mb-10 dark:bg-gray-900">
        <SearchPanel
          onUserSelect={openConversationFromSearch}
          placeholder="Tìm người để nhắn tin..."
          overlay={true}
        />
      </div>

      {/* Avatar / note area */}
      <div className="relative hidden flex-col px-4 py-4 md:flex">
        <div className="relative">
          <img
            src={user?.data.avatarUrl}
            alt={user?.data.username}
            className="h-16 w-16 rounded-full border border-gray-200 object-cover dark:border-gray-700"
          />
        </div>
        <span className="mt-2 text-xs font-medium text-gray-800 dark:text-gray-300">
          Ghi chú của bạn
        </span>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
        <button className="px-4 py-2 text-sm font-semibold text-gray-900 md:text-base dark:text-white">
          Tin nhắn
        </button>
        <button className="flex-3 py-2 pl-4 text-sm font-semibold text-gray-400 md:pl-25 md:text-base dark:text-gray-500">
          Tin nhắn đang chờ
        </button>
      </div>

      {/* Conversation list */}
      <div className="flex-1 overflow-y-auto bg-white dark:bg-gray-900">
        {conversations.length === 0 ? (
          <div className="p-4 text-center text-gray-500 dark:text-gray-400">
            <div>Chưa có cuộc hội thoại nào</div>
            <button
              onClick={fetchConversations}
              className="mt-2 rounded bg-blue-500 px-3 py-1 text-sm text-white hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700"
            >
              Tải lại
            </button>
          </div>
        ) : (
          <div>
            {conversations.map((conversation) => {
              // ✅ THÊM: Check online status
              const isPartnerOnline = isUserOnline(conversation.partner?._id);

              return (
                <div
                  key={conversation._id}
                  onClick={() => onSelectConversation(conversation)}
                  className={`flex cursor-pointer items-center px-3 py-3 transition-colors md:px-4 ${
                    selectedChatId === conversation._id
                      ? "border-l-4 border-l-blue-500 bg-blue-50 dark:border-l-blue-400 dark:bg-blue-900/20"
                      : "hover:bg-gray-50 dark:hover:bg-gray-800"
                  }`}
                >
                  {/* ✅ SỬA: Avatar với online indicator */}
                  <div className="relative mr-3">
                    <img
                      src={
                        conversation.partner?.avatarUrl ||
                        `https://ui-avatars.com/api/?name=${encodeURIComponent(conversation.partner?.userId || conversation.partner?.username || "User")}&background=random`
                      }
                      alt={conversation.partner?.userId || conversation.partner?.username || "User"}
                      className="h-10 w-10 rounded-full border border-gray-200 object-cover md:h-12 md:w-12 dark:border-gray-700"
                    />
                    {/* ✅ THÊM: Online Status Indicator */}
                    <OnlineStatusIndicator
                      isOnline={isPartnerOnline}
                      size="sm"
                      className="right-0 bottom-0"
                    />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="truncate text-sm font-medium text-gray-900 md:text-base dark:text-white">
                          {conversation.partner?.userId ||
                            conversation.partner?.username ||
                            "Unknown User"}
                        </span>
                        {/* ✅ THÊM: Online text indicator */}
                        {isPartnerOnline && (
                          <span className="hidden text-xs font-medium text-green-600 md:inline dark:text-green-400">
                            • Online
                          </span>
                        )}
                      </div>
                      {conversation.lastMessage && (
                        <span className="ml-2 text-xs whitespace-nowrap text-gray-400 dark:text-gray-500">
                          {new Date(conversation.lastMessage.createdAt).toLocaleTimeString(
                            "vi-VN",
                            { hour: "2-digit", minute: "2-digit" }
                          )}
                        </span>
                      )}
                    </div>
                    <span className="truncate text-xs text-gray-500 md:text-sm dark:text-gray-400">
                      {(conversation.lastMessage?.sender?._id ||
                        conversation.lastMessage?.sender) === user?.data?._id
                        ? "Bạn: "
                        : ""}
                      {conversation.lastMessage
                        ? conversation.lastMessage.messageType === "post_share"
                          ? "Đã chia sẻ bài viết"
                          : conversation.lastMessage.content ||
                            (conversation.lastMessage.messageType === "media"
                              ? "📷 Media"
                              : "Tin nhắn")
                        : "Không có tin nhắn"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
