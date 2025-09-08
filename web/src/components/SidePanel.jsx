import { X } from "lucide-react";

import { isPanelMenu } from "@/store/slices/layoutSlice";

import NotificationPanel from "./NotificationPanel";
import SearchPanel from "./SearchPanel";

const SidePanel = ({ activeMenu, onClose, isMobile }) => {
  if (!isPanelMenu(activeMenu)) {
    return null;
  }

  // Mobile: Full screen overlay
  if (isMobile) {
    return (
      <div
        className="fixed top-0 left-0 z-50 h-full w-full bg-black/50"
        onClick={onClose}
      >
        <div
          className="relative h-full w-80 bg-white dark:bg-black"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 rounded-full bg-gray-100 p-2 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700"
          >
            <X size={20} />
          </button>

          {/* Panel content */}
          <div className="h-full overflow-y-auto">
            {activeMenu === "search" && <SearchPanel />}
            {activeMenu === "notifications" && <NotificationPanel />}
          </div>
        </div>
      </div>
    );
  }

  // Desktop: Side panel
  return (
    <div
      className={`w-80 rounded-lg border-r border-gray-200/60 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800`}
    >
      <div className="h-full overflow-y-auto">
        {activeMenu === "search" && <SearchPanel />}
        {activeMenu === "notifications" && <NotificationPanel />}
      </div>
    </div>
  );
};

export default SidePanel;
