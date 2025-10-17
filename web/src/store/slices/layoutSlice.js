import { createSlice } from "@reduxjs/toolkit";


// Define which menus are panels (can be easily extended)
const PANEL_MENUS = ["search", "notifications"];

// Define which menus are regular pages
const PAGE_MENUS = ["home", "explore", "reels", "post", "message", "profile"];

// Helper functions
const isPanelMenu = (menuId) => PANEL_MENUS.includes(menuId);
const isPageMenu = (menuId) => PAGE_MENUS.includes(menuId);

// Load saved state from localStorage
const loadFromLocalStorage = () => {
  try {
    const savedActiveMenu = localStorage.getItem("activeMenu");
    const savedPreviousMenu = localStorage.getItem("previousMenu");
    const savedIsCollapsed = localStorage.getItem("sidebarCollapsed");

    const activeMenu = savedActiveMenu || "home";
    const previousMenu = savedPreviousMenu || "home";

    return {
      activeMenu: isPanelMenu(activeMenu) ? previousMenu : activeMenu, // Don't restore to panel on reload
      previousMenu,
      isCollapsed: savedIsCollapsed === "true",
    };
  } catch (error) {
    console.error("Error loading from localStorage:", error);
    return {
      activeMenu: "home",
      previousMenu: "home",
      isCollapsed: false,
    };
  }
};

const initialState = {
  ...loadFromLocalStorage(),
  isMobile: false,
  isTablet: false,
};
const layoutSlice = createSlice({
  name: "layout",
  initialState,
  reducers: {
    setActiveMenu: (state, action) => {
      const menuId = action.payload;

      // Save current menu as previous if it's not a panel
      if (!isPanelMenu(state.activeMenu)) {
        state.previousMenu = state.activeMenu;
        localStorage.setItem("previousMenu", state.activeMenu);
      }

      state.activeMenu = menuId;

      // Handle sidebar collapse for panels
      if (isPanelMenu(menuId) && !state.isMobile) {
        state.isCollapsed = true;
        localStorage.setItem("sidebarCollapsed", "true");
      } else if (isPageMenu(menuId) && !state.isMobile) {
        state.isCollapsed = state.isTablet;
        localStorage.setItem("sidebarCollapsed", state.isCollapsed.toString());
      }
      localStorage.setItem("activeMenu", menuId);
    },

    togglePanel: (state, action) => {
      const menuId = action.payload;

      // Bảo vệ: nếu payload null/undefined thì chỉ đóng panel nếu đang mở, còn không thì bỏ qua
      if (menuId == null) {
        if (isPanelMenu(state.activeMenu)) {
          state.activeMenu = state.previousMenu;
          if (!state.isMobile) {
            state.isCollapsed = state.isTablet;
            localStorage.setItem("sidebarCollapsed", state.isCollapsed.toString());
          }
          localStorage.setItem("activeMenu", state.previousMenu);
        }
        return;
      }

      // If same panel is active, close it and return to previous menu
      if (state.activeMenu === menuId && isPanelMenu(menuId)) {
        state.activeMenu = state.previousMenu;
        if (!state.isMobile) {
          state.isCollapsed = state.isTablet;
          localStorage.setItem("sidebarCollapsed", state.isCollapsed.toString());
        }
        localStorage.setItem("activeMenu", state.previousMenu);
      } else {
        if (!isPanelMenu(state.activeMenu)) {
          state.previousMenu = state.activeMenu;
          localStorage.setItem("previousMenu", state.activeMenu);
        }
        state.activeMenu = menuId;

        if (!state.isMobile) {
          if (isPanelMenu(menuId)) {
            state.isCollapsed = true;
            localStorage.setItem("sidebarCollapsed", "true");
          } else if (isPageMenu(menuId)) {
            state.isCollapsed = state.isTablet;
            localStorage.setItem("sidebarCollapsed", state.isCollapsed.toString());
          }
        }
        localStorage.setItem("activeMenu", menuId);
      }
    },

    closePanels: (state) => {
      if (isPanelMenu(state.activeMenu)) {
        state.activeMenu = state.previousMenu;

        // Reset sidebar collapse state
        if (!state.isMobile) {
          state.isCollapsed = state.isTablet;
          localStorage.setItem(
            "sidebarCollapsed",
            state.isCollapsed.toString()
          );
        }

        localStorage.setItem("activeMenu", state.previousMenu);
      }
    },

    setIsCollapsed: (state, action) => {
      state.isCollapsed = action.payload;
      localStorage.setItem("sidebarCollapsed", action.payload.toString());
    },

    toggleSidebar: (state) => {
      state.isCollapsed = !state.isCollapsed;
      localStorage.setItem("sidebarCollapsed", state.isCollapsed.toString());
    },

    setScreenSize: (state, action) => {
      const { isMobile, isTablet } = action.payload;
      state.isMobile = isMobile;
      state.isTablet = isTablet;

      // Auto-collapse logic
      if (isTablet) {
        state.isCollapsed = true;
      } else if (!isMobile) {
        state.isCollapsed = false;
      }

      localStorage.setItem("sidebarCollapsed", state.isCollapsed.toString());
    },

    resetToHome: (state) => {
      state.activeMenu = "home";
      state.previousMenu = "home";
      localStorage.setItem("activeMenu", "home");
    },
  },
});

export const {
  setActiveMenu,
  togglePanel,
  closePanels,
  setIsCollapsed,
  toggleSidebar,
  setScreenSize,
  resetToHome,
} = layoutSlice.actions;

// Selectors
export const selectIsPanelActive = (state) =>
  isPanelMenu(state.layout.activeMenu);
export const selectIsPageActive = (state) =>
  isPageMenu(state.layout.activeMenu);

// Export helper functions for components to use
export { isPageMenu, isPanelMenu, PAGE_MENUS, PANEL_MENUS };

export default layoutSlice.reducer;
