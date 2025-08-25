import {
  Home,
  Search,
  MessageCircle,
  Compass,
  Video,
  User,
  Menu, // icon ba gạch (lucide-react)
  Settings,
  Bookmark,
  Sun,
  AlertCircle,
  LogOut,
  SwitchCamera
} from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { logout } from "../lib/api";
import { toast } from 'react-toastify';
import { useMutation } from "@tanstack/react-query";
import logo_pixyy from "../assets/images/logo_pixyy.png";
export default function Sidebar({
  activeMenu,
  setActiveMenu,
  isCollapsed,
  setIsCollapsed,
}) {
  const [showMore, setShowMore] = useState(false);
  const navigate = useNavigate();
  const navItems = [
    { id: "home", label: "Trang chủ", icon: <Home size={25} /> },
    { id: "search", label: "Tìm kiếm", icon: <Search size={25} /> },
    { id: "message", label: "Tin nhắn", icon: <MessageCircle size={25} /> },
    { id: "explore", label: "Khám phá", icon: <Compass size={25} /> },
    { id: "reels", label: "Reels", icon: <Video size={25} /> },
    { id: "profile", label: "Trang cá nhân", icon: <User size={25} /> },
  ];

  const {
    mutate: handleLogout
    , } = useMutation({
      mutationFn: logout,
      onSuccess: () => {      
        navigate("/login");
      },
      onError: () => {
        toast.error("Đăng xuất thất bại, vui lòng thử lại!");
      }
    });


  const handleClick = (item) => {
    if (item.id === "more") {
      setShowMore(!showMore);
      return;
    }
    if (activeMenu === item.id) return;

    if (item.id === "search" || item.id === "message") {
      setActiveMenu(item.id);
      setIsCollapsed(true);
    } else {
      setActiveMenu(item.id);
      setIsCollapsed(false);
    }
  };

  return (
    <div
      className={`${isCollapsed ? "w-16" : "w-60"}
        border-r border-gray-200 bg-white flex flex-col py-6 
        transition-all duration-500 ease-in-out shadow-sm relative`}
    >
      {/* Logo */}
      <div className="px-6 py-4 pb-8 flex items-center transition-all duration-500 ease-in-out">
        <span
          className={`font-pacifico text-4xl font-extrabold tracking-tight p-[12px] text-primary-default whitespace-nowrap overflow-hidden transition-all duration-500 ease-in-out
            ${isCollapsed ? "text-xl w-0 opacity-0" : "text-2xl w-auto opacity-100"}
          `}
        >
          Pixyy
        </span>
        {isCollapsed && (
          <img
            src={logo_pixyy}
            alt="Pixyy Logo"
            className="absolute h-6 w-auto"
          />
        )}
      </div>

      {/* Nav items (trên cùng) */}
      <div className="flex flex-col space-y-4 px-2">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => handleClick(item)}
            className={`flex items-center px-4 py-3 rounded-xl group
              transition-all duration-300 ease-out transform
              hover:scale-[1.02] active:scale-[0.97]
              ${activeMenu === item.id
                ? "text-primary-default font-bold"
                : "hover:bg-gray-50 text-gray-700"
              }`}
          >
            <span
              className={`w-6 h-6 transition-colors duration-300 ${activeMenu === item.id
                ? "text-primary-default"
                : "text-gray-600 group-hover:text-black"
                }`}
            >
              {item.icon}
            </span>
            <span
              className={`ml-4 whitespace-nowrap overflow-hidden transition-all duration-500 ease-in-out
                ${isCollapsed ? "opacity-0 w-0" : "opacity-100 w-auto"}
                ${activeMenu === item.id
                  ? "text-primary-default font-bold"
                  : "text-gray-700"
                }`}
            >
              {item.label}
            </span>
          </button>
        ))}
      </div>

      {/* Nút Xem thêm (dưới cùng) */}
      <div className="mt-55 relative px-2">
        <button
          onClick={() => handleClick({ id: "more" })}
          className={`flex items-center px-4 py-3 rounded-xl group w-full
            transition-all duration-300 ease-out transform
            hover:scale-[1.02] active:scale-[0.97]
            ${activeMenu === "more"
              ? "text-primary-default font-bold"
              : "hover:bg-gray-50 text-gray-700"
            }`}
        >
          <Menu
            size={25}
            className={`transition-colors duration-300 ${activeMenu === "more"
              ? "text-primary-default"
              : "text-gray-600 group-hover:text-black"
              }`}
          />
          <span
            className={`ml-4 whitespace-nowrap overflow-hidden transition-all duration-500 ease-in-out
              ${isCollapsed ? "opacity-0 w-0" : "opacity-100 w-auto"}
              ${activeMenu === "more"
                ? "text-primary-default font-bold"
                : "text-gray-700"
              }`}
          >
            Xem thêm
          </span>
        </button>

        {/* Dropdown */}
        <div
          className={`absolute bottom-16 left-5 bg-white shadow-2xl rounded-2xl py-2 w-64 z-50
    transform transition-all duration-300 ease-out
    ${showMore ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2 pointer-events-none"}
  `}
        >
          <div className="max-h-80 overflow-y-auto"> {/* 👈 chỉnh chiều cao tối đa */}
            <button className="flex items-center px-4 py-3 hover:bg-gray-100 w-full">
              <Settings size={18} className="mr-3" /> Cài đặt
            </button>
            <button className="flex items-center px-4 py-3 hover:bg-gray-100 w-full">
              <Bookmark size={18} className="mr-3" /> Đã lưu
            </button>
            <button className="flex items-center px-4 py-3 hover:bg-gray-100 w-full">
              <Sun size={18} className="mr-3" /> Chuyển chế độ
            </button>
            <button className="flex items-center px-4 py-3 hover:bg-gray-100 w-full">
              <AlertCircle size={18} className="mr-3" /> Báo cáo sự cố
            </button>
            <hr className="my-1" />
            <button className="flex items-center px-4 py-3 hover:bg-gray-100 w-full">
              <SwitchCamera size={18} className="mr-3" /> Chuyển tài khoản
            </button>
            <button className="flex items-center px-4 py-3 hover:bg-gray-100 w-full" onClick={() => handleLogout()}>
              <LogOut size={18} className="mr-3" /> Đăng xuất
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
