// Sidebar.jsx
import { Home, Search, Compass, Film, Send, Heart, PlusSquare, User, Menu } from "lucide-react";

const Sidebar = () => {
  const menu = [
    { icon: <Home size={24} />, label: "Trang chủ" },
    { icon: <Search size={24} />, label: "Tìm kiếm" },
    { icon: <Compass size={24} />, label: "Khám phá" },
    { icon: <Film size={24} />, label: "Reels" },
    { icon: <Send size={24} />, label: "Tin nhắn" },
    { icon: <Heart size={24} />, label: "Thông báo" },
    { icon: <PlusSquare size={24} />, label: "Tạo" },
    { icon: <User size={24} />, label: "Trang cá nhân" },
  ];

  return (
    <div className="h-screen w-64 border-r px-4 py-6 flex flex-col justify-between">
      {/* Logo */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Instagram</h1>
      </div>

      {/* Menu */}
      <div className="flex-1 space-y-4">
        {menu.map((item, i) => (
          <div
            key={i}
            className="flex items-center space-x-3 p-2 rounded-xl hover:bg-gray-100 cursor-pointer"
          >
            {item.icon}
            <span>{item.label}</span>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="space-y-4">
        <div className="flex items-center space-x-3 p-2 rounded-xl hover:bg-gray-100 cursor-pointer">
          <Menu size={24} />
          <span>Xem thêm</span>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
