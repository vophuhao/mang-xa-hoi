import { useEffect, useRef, useState } from "react";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  Bell,
  Bookmark,
  Compass,
  Home,
  LogOut,
  Menu,
  MessageCircle,
  Moon,
  PlusSquare,
  Search,
  Settings,
  Sun,
  SwitchCamera,
  User,
  Video,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

import logo_pixyy from "@/assets/images/logo_pixyy.png";
import useNotifications from "@/hooks/useNotifications";
import useTheme from "@/hooks/useTheme";
import { USER_QUERY_KEYS } from "@/hooks/useUser";
import { logout } from "@/lib/api";
import AccountListModal from "@/modals/AccountListModal";
import CreatePostModal from "@/modals/CreatePostModal";
import LoginModal from "@/modals/LoginModal";

export default function Sidebar({ activeMenu, isCollapsed, onMenuClick }) {
  const [showMore, setShowMore] = useState(false);
  const [showPostModal, setShowPostModal] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showAccountListModal, setShowAccountListModal] = useState(false);
  const [selectedEmail, setSelectedEmail] = useState("");
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  const { theme, changeTheme } = useTheme();
  const queryClient = useQueryClient();
  const currentUser = queryClient.getQueryData(USER_QUERY_KEYS.currentUser).data;
  const { unreadCount = 0 } = useNotifications();

  const navItems = [
    { id: "home", label: "Trang chủ", icon: <Home size={24} /> },
    { id: "search", label: "Tìm kiếm", icon: <Search size={24} /> },
    { id: "explore", label: "Khám phá", icon: <Compass size={24} /> },
    { id: "reels", label: "Reels", icon: <Video size={24} /> },
    { id: "message", label: "Tin nhắn", icon: <MessageCircle size={24} /> },
    { id: "notifications", label: "Thông báo", icon: <Bell size={24} /> },
    { id: "post", label: "Tạo", icon: <PlusSquare size={24} /> },
    { id: "profile", label: "Trang cá nhân", icon: <User size={24} /> },
  ];

  const { mutate: handleLogout } = useMutation({
    mutationFn: logout,
    onSuccess: () => {
      queryClient.clear();
      navigate("/login");
    },
    onError: () => {
      toast.error("Đăng xuất thất bại, vui lòng thử lại!");
    },
  });

  const handleThemeToggle = () => {
    const nextTheme = theme === "light" ? "dark" : theme === "dark" ? "system" : "light";
    changeTheme(nextTheme);
  };

  const handleDropdownItemClick = (item) => {
    if (item.action) {
      item.action();
    }

    if (item.closeOnClick) {
      setShowMore(false);
    }
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

  // Define dropdown items after all functions are available
  const dropdownItems = [
    {
      id: "settings",
      label: "Cài đặt",
      icon: <Settings size={20} />,
      action: () => console.log("Settings clicked"),
      closeOnClick: true,
    },
    {
      id: "saved",
      label: "Đã lưu",
      icon: <Bookmark size={20} />,
      action: () => navigate("/saved"),
      closeOnClick: true,
    },
    {
      id: "theme",
      label: getThemeText(),
      icon: getThemeIcon(),
      action: handleThemeToggle,
      closeOnClick: false, // Không đóng dropdown khi thay đổi theme
    },
    {
      id: "report",
      label: "Báo cáo sự cố",
      icon: <AlertCircle size={20} />,
      action: () => console.log("Report clicked"),
      closeOnClick: true,
    },
    {
      type: "divider", // Separator
    },
    {
      id: "switch",
      label: "Chuyển tài khoản",
      icon: <SwitchCamera size={20} />,
      action: () => setShowAccountListModal(true),
      closeOnClick: true,
    },
    {
      id: "logout",
      label: "Đăng xuất",
      icon: <LogOut size={20} />,
      action: () => handleLogout(),
      closeOnClick: true,
    },
  ];

  const handleClick = (item) => {
    if (item.id === "more") {
      setShowMore(!showMore);
      return;
    }
    if (item.id === "post") {
      setShowPostModal(true);
      return;
    }

    // Remove the early return for active menu items to allow toggling
    // if (activeMenu === item.id) return;

    // Always use onMenuClick since we're now using Redux
    onMenuClick(item.id);
  };

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowMore(false);
      }
    };

    const handleEscapeKey = (event) => {
      if (event.key === "Escape") {
        setShowMore(false);
      }
    };

    if (showMore) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleEscapeKey);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscapeKey);
    };
  }, [showMore]);

  return (
    <div
      className={`${isCollapsed ? "w-18" : "w-55"} relative flex h-full flex-col border-r border-gray-200 bg-white transition-all duration-300 ease-in-out dark:border-gray-800 dark:bg-black`}
    >
      {/* Logo */}
      <div
        className={`relative flex items-center py-8 ${isCollapsed ? "justify-center px-3" : "px-6"}`}
      >
        <button onClick={() => onMenuClick("home")} className="transition-opacity hover:opacity-80">
          <span
            className={`font-pacifico overflow-hidden pb-3 text-4xl font-normal tracking-tight whitespace-nowrap text-black dark:text-white ${isCollapsed ? "w-0 opacity-0" : "w-auto opacity-100"} `}
          >
            Pixyy
          </span>
        </button>
        {isCollapsed && (
          <button
            onClick={() => onMenuClick("home")}
            className="absolute inset-0 flex items-center justify-center transition-opacity hover:opacity-80"
          >
            <img src={logo_pixyy} alt="Pixyy Logo" className="h-7 w-auto" />
          </button>
        )}
      </div>

      {/* Nav items */}
      <div className="flex flex-1 flex-col space-y-2 px-3">
        {navItems.map((item) => {
          // Nếu là profile và có currentUser.avatarUrl thì dùng <img>, ngược lại dùng icon mặc định
          const icon =
            item.id === "profile" && currentUser?.avatarUrl ? (
              <img
                src={currentUser.avatarUrl}
                alt={currentUser.username}
                className="h-6 w-6 rounded-full object-cover"
              />
            ) : (
              item.icon
            );

          return (
            <button
              key={item.id}
              onClick={() => handleClick(item)}
              className={`group relative flex items-center rounded-lg px-3 py-3 transition-all duration-200 ease-in-out ${
                activeMenu === item.id
                  ? "bg-gray-100 dark:bg-gray-800"
                  : "hover:bg-gray-50 dark:hover:bg-gray-800"
              }`}
            >
              <span className="flex-shrink-0 text-black transition-colors duration-200 dark:text-white">
                {icon}
              </span>

              {/* Notification badge */}
              {item.id === "notifications" && unreadCount > 0 && (
                <span className="absolute top-2 left-7 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}

              <span
                className={`ml-4 overflow-hidden text-base font-normal whitespace-nowrap transition-all duration-300 ease-in-out ${
                  isCollapsed ? "w-0 opacity-0" : "w-auto opacity-100"
                } ${
                  activeMenu === item.id
                    ? "font-semibold text-black dark:text-white"
                    : "text-black dark:text-white"
                }`}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Nút Xem thêm (dưới cùng) */}
      <div className="relative px-3 pb-6" ref={dropdownRef}>
        <button
          onClick={() => handleClick({ id: "more" })}
          className={`group flex w-full items-center rounded-lg px-3 py-3 transition-all duration-200 ease-in-out ${
            activeMenu === "more"
              ? "bg-gray-100 dark:bg-gray-800"
              : "hover:bg-gray-50 dark:hover:bg-gray-800"
          }`}
        >
          <Menu
            size={24}
            className={`flex-shrink-0 transition-colors duration-200 ${
              activeMenu === "more" ? "text-black dark:text-white" : "text-black dark:text-white"
            }`}
          />
          <span
            className={`ml-4 overflow-hidden text-base font-normal whitespace-nowrap transition-all duration-300 ease-in-out ${isCollapsed ? "w-0 opacity-0" : "w-auto opacity-100"} ${
              activeMenu === "more"
                ? "font-semibold text-black dark:text-white"
                : "text-black dark:text-white"
            }`}
          >
            Xem thêm
          </span>
        </button>

        {/* Dropdown */}
        <div
          className={`absolute bottom-16 left-5 z-50 w-64 transform rounded-xl bg-white py-2 shadow-2xl transition-all duration-300 ease-out dark:bg-gray-800 ${showMore ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-2 opacity-0"} `}
        >
          <div className="max-h-80 overflow-y-auto">
            {dropdownItems.map((item, index) => {
              if (item.type === "divider") {
                return <hr key={index} className="my-1 dark:border-gray-700" />;
              }

              return (
                <button
                  key={item.id}
                  className="flex w-full items-center px-4 py-3 text-sm hover:bg-gray-100 dark:text-white dark:hover:bg-gray-700"
                  onClick={() => handleDropdownItemClick(item)}
                >
                  <span className="mr-3">{item.icon}</span> {item.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <CreatePostModal isOpen={showPostModal} onClose={() => setShowPostModal(false)} />
      <AccountListModal
        isOpen={showAccountListModal}
        onClose={() => setShowAccountListModal(false)}
        onSelectAccount={(email) => {
          setSelectedEmail(email);
          setShowLoginModal(true);
        }}
      />
      <LoginModal
        isOpen={showLoginModal}
        onClose={() => {
          setShowLoginModal(false);
          setSelectedEmail("");
        }}
        initialEmail={selectedEmail}
      />
    </div>
  );
}
