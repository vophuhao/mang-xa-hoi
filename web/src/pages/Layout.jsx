import { useEffect } from "react";

import { useDispatch, useSelector } from "react-redux";
import { Outlet, useLocation, useNavigate } from "react-router-dom";

import MobileFooter from "@/components/MobileFooter";
import MobileHeader from "@/components/MobileHeader";
import Sidebar from "@/components/SideBar";
import SidePanel from "@/components/SidePanel";
import useUser from "@/hooks/useUser";
import {
  closePanels,
  isPanelMenu,
  setActiveMenu,
  setScreenSize,
  togglePanel,
} from "@/store/slices/layoutSlice";

// Route mappings (outside component to avoid recreating)
const routeMap = {
  home: "/",
  explore: "/explore",
  reels: "/reels",
  message: "/direct/inbox",
  profile: "/profile",
};

const pathToMenu = {
  "/": "home",
  "/explore": "explore",
  "/reels": "reels",
  "/direct/inbox": "message",
  "/profile": "profile",
};

const Layout = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { activeMenu, isCollapsed, isMobile } = useSelector(
    (state) => state.layout
  );
  const { currentUser } = useUser();

  // Sync activeMenu with current route on mount/route change
  useEffect(() => {
    const currentPath = location.pathname;
    if (currentPath.startsWith("/") && currentUser?.username) {
      if (currentPath === `/${currentUser.username}`) {
        // Only set to profile if not currently showing a panel menu
        if (!isPanelMenu(activeMenu)) {
          dispatch(setActiveMenu("profile"));
        }
        return;
      }
    }
    const currentMenu = pathToMenu[currentPath];
    if (currentMenu && activeMenu !== currentMenu && !isPanelMenu(activeMenu)) {
      dispatch(setActiveMenu(currentMenu));
    }
  }, [location.pathname, activeMenu, currentUser, dispatch]);

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
    // Handle panel menus (search, notifications)
    if (isPanelMenu(menuId)) {
      dispatch(togglePanel(menuId));
    } else {
      // Handle page menus (home, explore, reels, message, profile)
      dispatch(setActiveMenu(menuId));

      // Navigate to the corresponding route
      let route = routeMap[menuId];
      if (menuId === "profile" && currentUser?.username) {
        route = `/${currentUser.username}`;
      }

      if (route) {
        navigate(route);
      }
    }
  };

  const handleOutsideClick = () => {
    dispatch(closePanels());
  };
  console.log("Rendering Layout with activeMenu:", activeMenu);

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
          <div className={`mx-auto ${isMobile ? "px-4" : ""}`}>
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
