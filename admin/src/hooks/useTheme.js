import { useEffect, useState } from "react";

const useTheme = () => {
  const [theme, setTheme] = useState(
    () => localStorage.getItem("theme") || "system",
  );

  const applyTheme = (theme) => {
    const isDark =
      theme === "dark" ||
      (theme === "system" &&
        window.matchMedia("(prefers-color-scheme: dark)").matches);
    document.documentElement.classList.toggle("dark", isDark);
  };

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const changeTheme = (newTheme) => {
    setTheme(newTheme);
    newTheme === "system"
      ? localStorage.removeItem("theme")
      : localStorage.setItem("theme", newTheme);
  };

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = () => theme === "system" && applyTheme("system");
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [theme]);

  return { theme, changeTheme };
};

export default useTheme;
