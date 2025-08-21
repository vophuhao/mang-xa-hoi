import { useState } from "react";
import Sidebar from "../components/SideBar";
import SearchPanel from "../components/SearchPanel";
import MessagePanel from "../components/MessagePanel";

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
        <div className="w-80 border-r bg-white animate-slideIn">
          <SearchPanel />
        </div>
      )}
      {activeMenu === "message" && (
        <div className="w-80 border-r bg-white animate-slideIn">
          <MessagePanel />
        </div>
      )}

      {/* Nội dung chính */}
      <div className="flex-1 bg-gray-50 p-6 overflow-auto">
        {activeMenu === "home" && <div>🏠 Home Page</div>}
        {activeMenu === "explore" && <div>🔍 Explore Page</div>}
        {activeMenu === "reels" && <div>🎬 Reels Page</div>}
        {activeMenu === "profile" && <div>👤 Profile Page</div>}
      </div>
    </div>
  );
};

export default Home;

