import { useState } from "react";
import Sidebar from "../components/SideBar";
import SearchPanel from "../components/SearchPanel";
import MessagePanel from "../components/MessagePanel";
import ProfilePanel from "../components/ProfilePanel";

const Home = () => {
  const [activeMenu, setActiveMenu] = useState("home"); // home | explore | reels | profile | search | message
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <Sidebar
        activeMenu={activeMenu}
        setActiveMenu={setActiveMenu}
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
      />

      {/* Sidebar panel phụ */}
      {activeMenu === "search" && (
        <div className="w-100 border-gray-800 bg-white animate-slideIn rounded-tr-4xl rounded-br-4xl">
          <SearchPanel />
        </div>
      )}
      {activeMenu === "message" && (
        <div className="w-80 border-r bg-white animate-slideIn">
          <MessagePanel />
        </div>
      )}

      {/* Nội dung chính */}
      <div className="flex-1 bg-gray-50 overflow-auto">
        {activeMenu === "home" && <div className="p-6">🏠 Home Page</div>}
        {activeMenu === "explore" && <div className="p-6">🔍 Explore Page</div>}
        {activeMenu === "reels" && <div className="p-6">🎬 Reels Page</div>}
        {activeMenu === "profile" && <ProfilePanel />}
      </div>
    </div>
  );
};

export default Home;

