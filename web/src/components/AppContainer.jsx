import {  Center, Spinner } from "@chakra-ui/react";
import { Navigate } from "react-router-dom";
import useAuth from "../hooks/useAuth";

const AppContainer = () => {
  const { user, isLoading } = useAuth();

  return isLoading ? (
    <Center w="100vw" h="90vh" flexDir="column">
      <Spinner mb={4} />
    </Center>
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
