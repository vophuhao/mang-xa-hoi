import {
  Compass,
  Home,
  MessageCircle,
  PlusSquare,
  User,
  Video,
} from "lucide-react";

const MobileFooter = ({ activeMenu, onMenuClick }) => {
  const mobileNavItems = [
    { id: "home", icon: <Home size={24} />, label: "Trang chủ" },
    { id: "explore", icon: <Compass size={24} />, label: "Khám phá" },
    { id: "reels", icon: <Video size={24} />, label: "Reels" },
    { id: "post", icon: <PlusSquare size={24} />, label: "Tạo" },
    { id: "message", icon: <MessageCircle size={24} />, label: "Tin nhắn" },
    { id: "profile", icon: <User size={24} />, label: "Cá nhân" },
  ];

  return (
    <div className="border-t border-gray-200 bg-white px-4 py-2 md:hidden dark:border-gray-800 dark:bg-black">
      <div className="flex justify-around">
        {mobileNavItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onMenuClick(item.id)}
            className={`flex flex-col items-center space-y-1 py-2 transition-colors ${
              activeMenu === item.id
                ? "text-gray-900 dark:text-white"
                : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
            }`}
          >
            {item.icon}
          </button>
        ))}
      </div>
    </div>
  );
};

export default MobileFooter;
