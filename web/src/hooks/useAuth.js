import { useQuery } from "@tanstack/react-query";
import { useLocation } from "react-router-dom";

import { getUser } from "@/lib/api";

export const AUTH = "auth";

const useAuth = (opts = {}) => {
  const location = useLocation();
  const isLoginPage = location.pathname === '/login' || location.pathname === '/register';

  const { data: user, ...rest } = useQuery({
    queryKey: [AUTH],
    queryFn: getUser,
    staleTime: Infinity,
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchInterval: false,
    enabled: !isLoginPage,
    ...opts,
  });
  
  return {
    user,
    ...rest,
  };
};

export default useAuth;
