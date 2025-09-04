import { useEffect } from "react";

import { useDispatch, useSelector } from "react-redux";
import { Outlet } from "react-router-dom";

import MobileFooter from "@/components/MobileFooter";
import MobileHeader from "@/components/MobileHeader";
import Sidebar from "@/components/SideBar";
import SidePanel from "@/components/SidePanel";
import {
  closePanels,
  isPanelMenu,
  setScreenSize,
  togglePanel,
} from "@/store/slices/layoutSlice";

const Layout = () => {
  const dispatch = useDispatch();
  const { activeMenu, isCollapsed, isMobile } = useSelector(
    (state) => state.layout
  );

  // Responsive breakpoints detection
  useEffect(() => {
    const checkScreenSize = () => {
      const width = window.innerWidth;
      const newIsMobile = width < 768;
      const newIsTablet = width >= 768 && width < 1024;

      dispatch(setScreenSize({ isMobile: newIsMobile, isTablet: newIsTablet }));
    };

    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);
    return () => window.removeEventListener("resize", checkScreenSize);
  }, [dispatch]);

  // Handle closing panels on resize
  useEffect(() => {
    const handleResize = () => {
      dispatch(closePanels());
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [dispatch]);

  const handleMenuClick = (menuId) => {
    dispatch(togglePanel(menuId));
  };

  const handleOutsideClick = () => {
    dispatch(closePanels());
  };

  return (
    <div className="flex h-screen flex-col bg-gray-50 md:flex-row dark:bg-gray-900">
      {/* Mobile Header */}
      <MobileHeader activeMenu={activeMenu} onMenuClick={handleMenuClick} />

      {/* Desktop/Tablet Sidebar */}
      {!isMobile && (
        <Sidebar
          activeMenu={activeMenu}
          isCollapsed={isCollapsed}
          onMenuClick={handleMenuClick}
        />
      )}

      {/* Side Panel (Search/Notifications) */}
      <SidePanel
        activeMenu={activeMenu}
        onClose={handleOutsideClick}
        isMobile={isMobile}
      />

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden">
        <div
          className="scrollbar-hide flex-1 overflow-y-auto"
          onClick={handleOutsideClick}
        >
          <div className={`mx-auto ${isMobile ? "px-4" : "max-w-2xl px-6"}`}>
            <Outlet />
          </div>
        </div>

        {/* Right Sidebar Placeholder - Desktop only */}
        {!isMobile &&
          !isCollapsed &&
          activeMenu === "home" &&
          !isPanelMenu(activeMenu) && (
            <div className="hidden w-80 xl:block">
              {/* Right sidebar content here */}
            </div>
          )}
      </div>

      {/* Mobile Footer */}
      <MobileFooter activeMenu={activeMenu} onMenuClick={handleMenuClick} />
    </div>
  );
};

export default Layout;
