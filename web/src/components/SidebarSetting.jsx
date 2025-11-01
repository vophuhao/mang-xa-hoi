import React from "react";

import {
  User,
  Bell,
  Shield,
  Star,
  Ban,
  EyeOff,
  MessageCircle,
  AtSign,
  MessageSquare,
  Repeat2,
  UserX,
  Type,
} from "lucide-react";

const settingsSidebar = [
  {
    group: "Cách bạn sử dụng Instagram",
    items: [
      { label: "Chỉnh sửa trang cá nhân", key: "edit", icon: <User size={20} /> },
      { label: "Thông báo", key: "notifications", icon: <Bell size={20} /> },
    ],
  },
  {
    group: "Ai có thể xem nội dung của bạn",
    items: [
      { label: "Quyền riêng tư tài khoản", key: "privacy", icon: <Shield size={20} /> },
      { label: "Bạn thân", key: "closefriends", icon: <Star size={20} /> },
      { label: "Đã chặn", key: "blocked", icon: <Ban size={20} /> },
      { label: "Ẩn tin", key: "hidestory", icon: <EyeOff size={20} /> },
    ],
  },
  {
    group: "Cách người khác tương tác với bạn",
    items: [
      { label: "Tin nhắn và trả lời tin", key: "messages", icon: <MessageCircle size={20} /> },
      { label: "Thẻ và nhắc đến", key: "tags", icon: <AtSign size={20} /> },
      { label: "Bình luận", key: "comments", icon: <MessageSquare size={20} /> },
      { label: "Chia sẻ và sử dụng lại", key: "sharing", icon: <Repeat2 size={20} /> },
      { label: "Tài khoản bị hạn chế", key: "restricted", icon: <UserX size={20} /> },
      { label: "Từ ẩn", key: "hiddenwords", icon: <Type size={20} /> },
    ],
  },
];

export default function SidebarSetting({ activeSetting, setActiveSetting }) {
  return (
    <aside className="w-72 bg-white dark:bg-black border-r dark:border-gray-800 p-6 h-screen overflow-y-auto sticky top-0">
      <h2 className="text-xl font-bold mb-6 text-black dark:text-white">Cài đặt</h2>
      {settingsSidebar.map((group) => (
        <div key={group.group} className="mb-6">
          <div className="text-gray-500 dark:text-gray-400 text-sm font-semibold mb-2">{group.group}</div>
          {group.items.map((tab) => (
            <button
              key={tab.key}
              className={`flex items-center w-full text-left px-4 py-2 rounded mb-1 font-medium ${
                activeSetting === tab.key
                  ? "bg-gray-200 dark:bg-gray-800 text-black dark:text-white"
                  : "hover:bg-gray-100 dark:hover:bg-gray-900 text-gray-700 dark:text-gray-300"
              }`}
              onClick={() => setActiveSetting(tab.key)}
            >
              <span className="mr-3 text-lg">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
      ))}
    </aside>
  );
}