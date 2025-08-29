import useTheme from "../../hooks/useTheme";

const ThemeToggle = () => {
  const { theme, changeTheme } = useTheme();

  const handleToggle = () => {
    if (theme === "light") {
      changeTheme("dark");
      // } else if (theme === "dark") {
      //   changeTheme("system");
    } else {
      changeTheme("light");
    }
  };

  return (
    <button
      onClick={handleToggle}
      className="group absolute top-6 right-6 z-20 rounded-full border border-white/20 bg-white/10 p-3 backdrop-blur-md transition-all duration-300 hover:bg-white/20"
      aria-label={`Current theme: ${theme}. Click to cycle through themes`}
      title={`Current: ${theme} → Click to cycle`}
    >
      <div className="relative h-6 w-6">
        {/* Sun icon for light mode */}
        <svg
          className={`absolute inset-0 h-6 w-6 text-yellow-400 transition-all duration-300 ${
            theme === "light" ? "rotate-0 opacity-100" : "rotate-180 opacity-0"
          }`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path
            fillRule="evenodd"
            d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z"
            clipRule="evenodd"
          />
        </svg>

        {/* Moon icon for dark mode */}
        <svg
          className={`absolute inset-0 h-6 w-6 text-blue-300 transition-all duration-300 ${
            theme === "dark" ? "rotate-0 opacity-100" : "-rotate-180 opacity-0"
          }`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
        </svg>

        {/* Monitor icon for system mode */}
        <svg
          className={`absolute inset-0 h-6 w-6 text-purple-400 transition-all duration-300 ${
            theme === "system"
              ? "scale-100 rotate-0 opacity-100"
              : "scale-75 rotate-45 opacity-0"
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <rect
            x="2"
            y="3"
            width="20"
            height="14"
            rx="2"
            ry="2"
            strokeWidth="2"
          />
          <line x1="8" y1="21" x2="16" y2="21" strokeWidth="2" />
          <line x1="12" y1="17" x2="12" y2="21" strokeWidth="2" />
        </svg>
      </div>

      {/* Small indicator dot for current theme */}
      <div className="absolute -right-1 -bottom-1 h-3 w-3 rounded-full border-2 border-white/30 transition-colors duration-300">
        <div
          className={`h-full w-full rounded-full transition-colors duration-300 ${
            theme === "light"
              ? "bg-yellow-400"
              : theme === "dark"
                ? "bg-blue-300"
                : "bg-purple-400"
          }`}
        />
      </div>
    </button>
  );
};

// const ThemeToggle = ({ isDarkMode, onToggle }) => {
//   return (
//     <button
//       onClick={onToggle}
//       className="group absolute top-6 left-6 z-20 rounded-full border border-white/20 bg-white/10 p-3 backdrop-blur-md transition-all duration-300 hover:bg-white/20"
//       aria-label="Toggle theme"
//     >
//       <div className="relative h-6 w-6">
//         <svg
//           className={`absolute inset-0 h-6 w-6 text-yellow-400 transition-all duration-300 ${isDarkMode ? "rotate-180 opacity-0" : "rotate-0 opacity-100"}`}
//           fill="currentColor"
//           viewBox="0 0 20 20"
//         >
//           <path
//             fillRule="evenodd"
//             d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z"
//             clipRule="evenodd"
//           />
//         </svg>
//         <svg
//           className={`absolute inset-0 h-6 w-6 text-blue-300 transition-all duration-300 ${isDarkMode ? "rotate-0 opacity-100" : "-rotate-180 opacity-0"}`}
//           fill="currentColor"
//           viewBox="0 0 20 20"
//         >
//           <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
//         </svg>
//       </div>
//     </button>
//   );
// };

export default ThemeToggle;
