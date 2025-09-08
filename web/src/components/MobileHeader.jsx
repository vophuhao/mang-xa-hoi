import { Bell, Search } from "lucide-react";

const MobileHeader = ({ activeMenu, onMenuClick }) => (
  <div className="flex items-center justify-between bg-white px-4 py-3 text-gray-900 md:hidden dark:bg-black dark:text-white">
    <div className="flex items-center space-x-3">
      <span className="font-pacifico pb-2 text-3xl font-normal">Pixyy</span>
    </div>

    <div className="flex items-center space-x-4">
      {/* Search Button */}
      <button
        onClick={() => onMenuClick("search")}
        className={`rounded-full p-2 transition-colors ${
          activeMenu === "search"
            ? "bg-gray-200 text-gray-900 dark:bg-gray-800 dark:text-white"
            : "text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
        }`}
      >
        <Search size={24} />
      </button>

      {/* Notifications Button */}
      <button
        onClick={() => onMenuClick("notifications")}
        className={`relative rounded-full p-2 transition-colors ${
          activeMenu === "notifications"
            ? "bg-gray-200 text-gray-900 dark:bg-gray-800 dark:text-white"
            : "text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
        }`}
      >
        <Bell size={24} />
        {/* Notification dot */}
        <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-red-500" />
      </button>
    </div>
  </div>
);

export default MobileHeader;
