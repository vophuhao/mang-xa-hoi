import { useEffect } from "react";

import { useDispatch, useSelector } from "react-redux";
import { Outlet, useNavigate } from "react-router-dom";

import Sidebar from "@/components/SideBar";
import {
  closePanels,
  isPanelMenu,
  isPageMenu,
  setScreenSize,
  setIsCollapsed,
  togglePanel,
} from "@/store/slices/layoutSlice";

const Layout = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { activeMenu, isCollapsed, isMobile } = useSelector(
    (state) => state.layout || {}
  );

  // 🔹 Xác định kích thước màn hình và cập nhật Redux
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

  // 🔹 Tự đóng panel khi resize
  useEffect(() => {
    const handleResize = () => dispatch(closePanels());
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [dispatch]);

  // 🔹 Xử lý click menu chính
  const handleMenuClick = (menuId) => {
    if (isPanelMenu(menuId)) {
      dispatch(togglePanel(menuId));
    } else if (isPageMenu(menuId)) {
      switch (menuId) {
        case "home":
          navigate("/");
          break;
        default:
          break;
      }
      dispatch(setIsCollapsed(false));
      dispatch(togglePanel(null)); // đóng panel khi đổi trang
    }
  };

  const handleOutsideClick = () => {
    dispatch(closePanels());
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* 🔹 Sidebar luôn hiển thị, nhưng có thể collapse nếu là mobile */}
      <Sidebar
        activeMenu={activeMenu}
        isCollapsed={isCollapsed || isMobile}
        onMenuClick={handleMenuClick}
      />

      {/* 🔹 SidePanel (search / notification) */}
   

      {/* 🔹 Main Content */}
      <div className="flex-1 overflow-hidden">
        <div
          className="scrollbar-hide h-full overflow-y-auto p-4"
          onClick={handleOutsideClick}
        >
          <div className="mx-auto">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Layout;
