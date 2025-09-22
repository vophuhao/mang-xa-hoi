import { Navigate, Outlet } from "react-router-dom";

import { useCurrentUser } from "@/hooks/useUser";

function ProtectedRoute() {
  const { data: user, isLoading } = useCurrentUser();

  if (isLoading) return <div>Loading...</div>;
  if (!user?.data) return <Navigate to="/login" replace />;

  return <Outlet />;
}

export default ProtectedRoute;
