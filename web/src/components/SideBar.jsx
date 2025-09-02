import { useState } from "react";

import { useMutation } from "@tanstack/react-query";
import {
  AlertCircle,
  Bookmark,
  Compass,
  Home,
  LogOut,
  Menu,
  MessageCircle,
  Moon,
  PlusSquare,
  Search, // icon ba gạch (lucide-react)
  Settings,
  Sun,
  SwitchCamera,
  User,
  Video,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

import logo_pixyy from "../assets/images/logo_pixyy.png";
import useTheme from "../hooks/useTheme";
import { logout } from "../lib/api";

export default function Sidebar({
  activeMenu,
  setActiveMenu,
  isCollapsed,
  setIsCollapsed,
}) {
  const [showMore, setShowMore] = useState(false);
  const navigate = useNavigate();
  const { theme, changeTheme } = useTheme();
  const navItems = [
    { id: "home", label: "Trang chủ", icon: <Home size={23} /> },
    { id: "search", label: "Tìm kiếm", icon: <Search size={23} /> },
    { id: "message", label: "Tin nhắn", icon: <MessageCircle size={23} /> },
    { id: "explore", label: "Khám phá", icon: <Compass size={23} /> },
    { id: "post", label: "Tạo", icon: <PlusSquare size={23} /> },
    { id: "reels", label: "Reels", icon: <Video size={23} /> },
    { id: "profile", label: "Trang cá nhân", icon: <User size={23} /> },
  ];

  const { mutate: handleLogout } = useMutation({
    mutationFn: logout,
    onSuccess: () => {
      navigate("/login");
    },
    onError: () => {
      toast.error("Đăng xuất thất bại, vui lòng thử lại!");
    },
  });

  const handleThemeToggle = () => {
    const nextTheme =
      theme === "light" ? "dark" : theme === "dark" ? "system" : "light";
    changeTheme(nextTheme);
    // toast.success(
    //   nextTheme === "light"
    //     ? "Đã chuyển sang chế độ sáng"
    //     : nextTheme === "dark"
    //       ? "Đã chuyển sang chế độ tối"
    //       : "Đã chuyển sang chế độ hệ thống"
    // );
  };

  const getThemeIcon = () => {
    if (theme === "light") return <Sun size={18} />;
    if (theme === "dark") return <Moon size={18} />;
    return <Settings size={18} />; // system theme icon
  };

  const getThemeText = () => {
    if (theme === "light") return "Chế độ sáng";
    if (theme === "dark") return "Chế độ tối";
    return "Hệ thống";
  };

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
      className={`${isCollapsed ? "w-16" : "w-60"} relative flex flex-col border-r border-gray-200 bg-white py-6 shadow-sm transition-all duration-500 ease-in-out dark:border-gray-800 dark:bg-gray-900`}
    >
      {/* Logo */}
      <div className="flex items-center px-6 py-4 pb-8 transition-all duration-500 ease-in-out">
        <span
          className={`font-pacifico text-primary-default overflow-hidden p-[12px] text-4xl font-extrabold tracking-tight whitespace-nowrap transition-all duration-500 ease-in-out dark:text-white ${isCollapsed ? "w-0 text-xl opacity-0" : "w-auto text-2xl opacity-100"} `}
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
            className={`group flex transform items-center rounded-xl px-4 py-3 transition-all duration-300 ease-out hover:scale-[1.02] active:scale-[0.97] ${
              activeMenu === item.id
                ? "text-primary-default font-bold dark:text-white"
                : "text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800"
            }`}
          >
            <span
              className={`h-6 w-6 transition-colors duration-300 ${
                activeMenu === item.id
                  ? "text-primary-default dark:text-white"
                  : "text-gray-600 group-hover:text-black dark:text-gray-400 dark:group-hover:text-white"
              }`}
            >
              {item.icon}
            </span>
            <span
              className={`ml-4 overflow-hidden whitespace-nowrap transition-all duration-500 ease-in-out ${isCollapsed ? "w-0 opacity-0" : "w-auto opacity-100"} ${
                activeMenu === item.id
                  ? "text-primary-default font-bold dark:text-white"
                  : "text-gray-700 dark:text-gray-300"
              }`}
            >
              {item.label}
            </span>
          </button>
        ))}
      </div>

      {/* Nút Xem thêm (dưới cùng) */}
      <div className="relative mt-auto px-2">
        <button
          onClick={() => handleClick({ id: "more" })}
          className={`group flex w-full transform items-center rounded-xl px-4 py-3 transition-all duration-300 ease-out hover:scale-[1.02] active:scale-[0.97] ${
            activeMenu === "more"
              ? "text-primary-default font-bold dark:text-white"
              : "text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800"
          }`}
        >
          <Menu
            size={25}
            className={`transition-colors duration-300 ${
              activeMenu === "more"
                ? "text-primary-default dark:text-white"
                : "text-gray-600 group-hover:text-black dark:text-gray-400 dark:group-hover:text-white"
            }`}
          />
          <span
            className={`ml-4 overflow-hidden whitespace-nowrap transition-all duration-500 ease-in-out ${isCollapsed ? "w-0 opacity-0" : "w-auto opacity-100"} ${
              activeMenu === "more"
                ? "text-primary-default font-bold dark:text-white"
                : "text-gray-700 dark:text-gray-300"
            }`}
          >
            Xem thêm
          </span>
        </button>

        {/* Dropdown */}
        <div
          className={`absolute bottom-16 left-5 z-50 w-64 transform rounded-2xl bg-white py-2 shadow-2xl transition-all duration-300 ease-out dark:bg-gray-800 ${showMore ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-2 opacity-0"} `}
        >
          <div className="max-h-80 overflow-y-auto">
            {" "}
            {/* 👈 chỉnh chiều cao tối đa */}
            <button className="flex w-full items-center px-4 py-3 hover:bg-gray-100 dark:text-white dark:hover:bg-gray-700">
              <Settings size={18} className="mr-3" /> Cài đặt
            </button>
            <button className="flex w-full items-center px-4 py-3 hover:bg-gray-100 dark:text-white dark:hover:bg-gray-700">
              <Bookmark size={18} className="mr-3" /> Đã lưu
            </button>
            <button
              className="flex w-full items-center px-4 py-3 hover:bg-gray-100 dark:text-white dark:hover:bg-gray-700"
              onClick={handleThemeToggle}
            >
              <span className="mr-3">{getThemeIcon()}</span> {getThemeText()}
            </button>
            <button className="flex w-full items-center px-4 py-3 hover:bg-gray-100 dark:text-white dark:hover:bg-gray-700">
              <AlertCircle size={18} className="mr-3" /> Báo cáo sự cố
            </button>
            <hr className="my-1 dark:border-gray-700" />
            <button className="flex w-full items-center px-4 py-3 hover:bg-gray-100 dark:text-white dark:hover:bg-gray-700">
              <SwitchCamera size={18} className="mr-3" /> Chuyển tài khoản
            </button>
            <button
              className="flex w-full items-center px-4 py-3 hover:bg-gray-100 dark:text-white dark:hover:bg-gray-700"
              onClick={() => handleLogout()}
            >
              <LogOut size={18} className="mr-3" /> Đăng xuất
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
