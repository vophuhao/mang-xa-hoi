import {
  Home,
  Search,
  MessageCircle,
  Compass,
  Video,
  User,
} from "lucide-react";

export default function Sidebar({
  activeMenu,
  setActiveMenu,
  isCollapsed,
  setIsCollapsed,
}) {
  const navItems = [
    { id: "home", label: "Trang chủ", icon: <Home size={25} /> },
    { id: "search", label: "Tìm kiếm", icon: <Search size={25} /> },
    { id: "message", label: "Tin nhắn", icon: <MessageCircle size={25} /> },
    { id: "explore", label: "Khám phá", icon: <Compass size={25} /> },
    { id: "reels", label: "Reels", icon: <Video size={25} /> },
    { id: "profile", label: "Trang cá nhân", icon: <User size={25} /> },
  ];

  const handleClick = (item) => {
    if (item.id === "search" || item.id === "message") {
      setActiveMenu(activeMenu === item.id ? "home" : item.id);
      setIsCollapsed(true); // thu nhỏ sidebar khi mở panel
    } else {
      setActiveMenu(item.id);
      setIsCollapsed(false); // mở rộng lại sidebar khi vào content
    }
  };

  return (
    <div
      className={`${
        isCollapsed ? "w-16" : "w-60"
      } border-r border-gray-200 bg-white flex flex-col space-y-2 py-6 
      transition-all duration-500 ease-in-out shadow-sm`}
    >
      {/* Logo */}
      <div
        className={`px-4 pb-6 transition-all duration-500 ease-in-out ${
          isCollapsed ? "opacity-80" : "opacity-100"
        }`}
      >
        {isCollapsed ? (
          <span className="text-xl font-extrabold tracking-tight text-primary-default">
            IG
          </span>
        ) : (
          <span className="text-2xl font-extrabold tracking-tight text-primary-default">
            Instagram
          </span>
        )}
      </div>

      {/* Nav items */}
      <div className="flex flex-col space-y-1 px-2"> {/* px-2 tạo khoảng cách với border */}
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => handleClick(item)}
            className={`flex items-center px-4 py-3 rounded-xl group
              transition-all duration-300 ease-out transform
              hover:scale-[1.02] active:scale-[0.97]
              ${
                activeMenu === item.id
                  ? "text-primary-default font-bold" // khi active thì chỉ đổi màu + in đậm
                  : "hover:bg-gray-50 text-gray-700" // khi hover thì mới có background nhạt
              }`}
          >
            {/* Icon */}
            <span
              className={`w-6 h-6 transition-colors duration-300 ${
                activeMenu === item.id
                  ? "text-primary-default"
                  : "text-gray-600 group-hover:text-black"
              }`}
            >
              {item.icon}
            </span>

            {/* Label */}
            {!isCollapsed && (
              <span
                className={`ml-4 transition-colors duration-300 ${
                  activeMenu === item.id
                    ? "text-primary-default font-bold"
                    : "text-gray-700"
                }`}
              >
                {item.label}
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
