import { useEffect, useState } from "react";

import logoPixyy from "@/assets/images/logo_pixyy.png";
import useTheme from "@/hooks/useTheme";

const SplashScreen = ({ onFinish }) => {
  const [isVisible, setIsVisible] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const { theme } = useTheme();

  // Check theme on mount and when theme changes
  useEffect(() => {
    const checkDarkMode = () => {
      if (theme === "dark") {
        setIsDarkMode(true);
      } else if (theme === "light") {
        setIsDarkMode(false);
      } else {
        // theme === "system"
        setIsDarkMode(
          window.matchMedia("(prefers-color-scheme: dark)").matches
        );
      }
    };

    checkDarkMode();

    // Listen for system theme changes
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = () => {
      if (theme === "system") {
        setIsDarkMode(mediaQuery.matches);
      }
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [theme]);

  useEffect(() => {
    // Hiển thị splash screen trong 1.5 giây
    const timer = setTimeout(() => {
      setIsVisible(false);
      onFinish();
    }, 1500);

    return () => clearTimeout(timer);
  }, [onFinish]);

  if (!isVisible) {
    return null;
  }

  return (
    <div
      className={`fixed inset-0 z-[9999] flex items-center justify-center transition-all duration-500 ${
        isVisible ? "opacity-100" : "opacity-0"
      } ${
        isDarkMode
          ? "bg-gradient-to-br from-gray-900 via-gray-800 to-black"
          : "bg-gradient-to-br from-white via-gray-50 to-blue-50"
      }`}
    >
      <div className="relative text-center">
        {/* Background glow effect for dark mode */}
        {isDarkMode && (
          <div
            className="absolute inset-0 rounded-full bg-blue-500/10 blur-3xl"
            style={{ transform: "scale(2)" }}
          />
        )}

        {/* Logo chính */}
        <div className="relative z-10 mb-2">
          <img
            src={logoPixyy}
            alt="Pixyy Logo"
            className={`mx-auto h-20 w-20 animate-bounce ${
              isDarkMode ? "brightness-110 drop-shadow-2xl filter" : ""
            }`}
            style={{ maxWidth: "120px", maxHeight: "120px" }}
          />
        </div>

        {/* Tên ứng dụng */}
        <div
          className={`font-pacifico relative z-10 mb-4 p-3 text-4xl font-bold ${
            isDarkMode
              ? "bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent"
              : "bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent"
          }`}
          style={{
            fontFamily: "'Pacifico', cursive",
            animationDelay: "0.5s",
            animationFillMode: "both",
          }}
        >
          Pixyy
        </div>

        {/* Loading dots với gradient */}
        <div className="relative z-10 flex justify-center gap-2">
          {[0, 1, 2].map((index) => (
            <div
              key={index}
              className={`h-2 w-2 animate-bounce rounded-full ${
                isDarkMode
                  ? "bg-gradient-to-r from-blue-400 to-purple-400"
                  : "bg-gradient-to-r from-blue-500 to-purple-500"
              }`}
              style={{
                animationDelay: `${index * 0.1}s`,
                animationDuration: "0.8s",
                animationIterationCount: "infinite",
              }}
            />
          ))}
        </div>

        {/* Ripple effects */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div
            className={`absolute h-48 w-48 animate-ping rounded-full border ${
              isDarkMode ? "border-purple-400/10" : "border-purple-500/20"
            }`}
            style={{ animationDuration: "3s", animationDelay: "0.5s" }}
          />
        </div>
      </div>
    </div>
  );
};

export default SplashScreen;
