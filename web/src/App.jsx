import { Provider } from "react-redux";
import { Route, Routes, useNavigate } from "react-router-dom";
import { ToastContainer } from "react-toastify";

import "react-toastify/dist/ReactToastify.css";

import SplashScreen from "@/components/SplashScreen";
import useSplashScreen from "@/hooks/useSplashScreen";
import { setNavigate } from "@/lib/navigation";
import ForgotPassword from "@/pages/ForgotPassword";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import ResetPassword from "@/pages/ResetPassword";
import VerifyEmail from "@/pages/VerifyEmail";
import store from "@/store";

import Explore from "./components/Explore";
import Feed from "./components/Feed";
import ProfilePanel from "./components/ProfilePanel";
import Layout from "./pages/Layout";

function App() {
  // set the navigate function on our API client for use in the axios error interceptor
  // this allows us to redirect to the login page when an auth error occurs
  const navigate = useNavigate();
  setNavigate(navigate);

  // Splash screen logic
  const { showSplash, isAppReady, hideSplash } = useSplashScreen();
  if (showSplash) {
    return <SplashScreen onFinish={hideSplash} />;
  }

  if (!isAppReady) {
    return null;
  }

  return (
    <Provider store={store}>
      <Routes>
        {/* Khi mở "/" thì redirect sang /login */}
        <Route path="/" element={<Login />} />

        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/email/verify/:code" element={<VerifyEmail />} />
        <Route path="/password/forgot" element={<ForgotPassword />} />
        <Route path="/password/reset" element={<ResetPassword />} />

        {/* Các route chính sau khi login */}
        <Route path="/home" element={<Layout />}>
          <Route index element={<Feed />} />
          <Route path="explore" element={<Explore />} />
          <Route path="users/userid/:userId" element={<ProfilePanel />} />
        </Route>
      </Routes>


      <ToastContainer position="top-right" autoClose={2000} />
    </Provider>
  );
}

export default App;
