import { useState } from "react";

import MessagePanel from "../components/MessagePanel";
import ProfilePanel from "../components/ProfilePanel";
import SearchPanel from "../components/SearchPanel";
import Sidebar from "../components/SideBar";

const Home = () => {
  const [activeMenu, setActiveMenu] = useState("home"); // home | explore | reels | profile | search | message
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className="flex h-screen dark:bg-gray-900">
      {/* Sidebar */}
      <Sidebar
        activeMenu={activeMenu}
        setActiveMenu={setActiveMenu}
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
      />

      {/* Sidebar panel phụ */}
      {activeMenu === "search" && (
        <div className="animate-slideIn w-100 rounded-tr-4xl rounded-br-4xl border-gray-800 bg-white dark:border-gray-700 dark:bg-gray-800">
          <SearchPanel />
        </div>
      )}
      {activeMenu === "message" && (
        <div className="animate-slideIn w-80 border-r bg-white dark:border-gray-700 dark:bg-gray-800">
          <MessagePanel />
        </div>
      )}

      {/* Nội dung chính */}
      <div className="flex-1 overflow-auto bg-gray-50 dark:bg-gray-900">
        {activeMenu === "home" && (
          <div className="p-6 text-gray-900 dark:text-white">🏠 Home Page</div>
        )}
        {activeMenu === "explore" && (
          <div className="p-6 text-gray-900 dark:text-white">
            🔍 Explore Page
          </div>
        )}
        {activeMenu === "reels" && (
          <div className="p-6 text-gray-900 dark:text-white">🎬 Reels Page</div>
        )}
        {activeMenu === "profile" && <ProfilePanel />}
      </div>
    </div>
  );
};

export default Home;
