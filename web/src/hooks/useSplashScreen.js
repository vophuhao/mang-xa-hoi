import { useEffect, useState } from "react";

const useSplashScreen = () => {
  const [showSplash, setShowSplash] = useState(true);
  const [isAppReady, setIsAppReady] = useState(false);

  useEffect(() => {
    // Luôn hiển thị splash screen mỗi lần reload trang
    setShowSplash(true);
    setIsAppReady(false);
  }, []);

  const hideSplash = () => {
    setShowSplash(false);
    setIsAppReady(true);
  };

  return {
    showSplash,
    isAppReady,
    hideSplash,
  };
};

export default useSplashScreen;
