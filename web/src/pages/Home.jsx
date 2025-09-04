import { useState } from "react";

import Feed from "@/components/Feed";
import MessagePanel from "@/components/MessagePanel";
import ProfilePanel from "@/components/ProfilePanel";
import RightSidebar from "@/components/RightSidebar";
import SearchPanel from "@/components/SearchPanel";
import Sidebar from "@/components/SideBar";

const Home = () => {
  const [activeMenu, setActiveMenu] = useState("home"); // home | explore | reels | profile | search | message
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* Left Sidebar */}
      <Sidebar
        activeMenu={activeMenu}
        setActiveMenu={setActiveMenu}
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
      />

      {/* Search/Message Panels */}
      {activeMenu === "search" && (
        <div className="animate-slideIn w-96 rounded-tr-4xl rounded-br-4xl border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800">
          <SearchPanel />
        </div>
      )}
      {activeMenu === "message" && (
        <div className="animate-slideIn w-80 border-r bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800">
          <MessagePanel />
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex flex-1">
        {/* Center Content */}
        <div className="scrollbar-hide mx-auto max-w-2xl flex-1 overflow-y-auto">
          {activeMenu === "home" && (
            <div className="scrollbar-hide pt-6">
              <Feed />
            </div>
          )}
          {activeMenu === "explore" && (
            <div className="p-6">
              <div className="py-20 text-center">
                <h2 className="mb-4 text-2xl font-bold text-gray-800 dark:text-white">
                  🔍 Khám phá
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  Tính năng khám phá đang được phát triển...
                </p>
              </div>
            </div>
          )}
          {activeMenu === "reels" && (
            <div className="p-6">
              <div className="py-20 text-center">
                <h2 className="mb-4 text-2xl font-bold text-gray-800 dark:text-white">
                  🎬 Reels
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  Tính năng Reels đang được phát triển...
                </p>
              </div>
            </div>
          )}
          {activeMenu === "profile" && <ProfilePanel />}
          {activeMenu === "post" && (
            <div className="p-6">
              <div className="py-20 text-center">
                <h2 className="mb-4 text-2xl font-bold text-gray-800 dark:text-white">
                  📝 Tạo bài viết mới
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  Tính năng tạo bài viết đang được phát triển...
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Right Sidebar - Only show on home page and when not collapsed */}
        {activeMenu === "home" &&
          !isCollapsed &&
          activeMenu !== "search" &&
          activeMenu !== "message" && (
            <div className="hidden w-80 xl:block">
              <RightSidebar />
            </div>
          )}
      </div>
    </div>
  );
};

export default Home;
