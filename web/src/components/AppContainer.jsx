import { Navigate } from "react-router-dom";

import useAuth from "@/hooks/useAuth";

const AppContainer = () => {
  const { user, isLoading } = useAuth();

  return isLoading ? (
    <div className="flex h-screen w-screen items-center justify-center">
      <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600"></div>
    </div>
  ) : user ? (
    <Navigate
      to="/home"
      replace
      state={{
        redirectUrl: window.location.pathname,
      }}
    />
  ) : (
    <Navigate
      to="/login"
      replace
      state={{
        redirectUrl: window.location.pathname,
      }}
    />
  );
};

export default AppContainer;
