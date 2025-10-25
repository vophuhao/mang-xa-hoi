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

import Audio from "./components/Audio";
import HashtagPanel from "./components/HashtagPanel";
import ReelWeb from "./components/Reel";
import CollectionAudio from "./pages/ColectionAudio";
import CollectionDetail from "./pages/CollectionDetail";
import DirectInbox from "./pages/DirectInbox";
import Explore from "./pages/Explore";
import Feed from "./pages/Feed";
import Layout from "./pages/Layout";
import Messages from "./pages/Messages";
import PostDetail from "./pages/PostDetail";
import Profile from "./pages/Profile";
import ProtectedRoute from "./routes/ProtectedRoute";

function App() {
  // set the navigate function on our API client for use in the axios error interceptor
  // this allows us to redirect to the login page when an auth error occurs
  const navigate = useNavigate();
  setNavigate(navigate);

  // Splash screen logic
  const { showSplash, isAppReady, hideSplash } = useSplashScreen();
  if (showSplash) return <SplashScreen onFinish={hideSplash} />;
  if (!isAppReady) return null;

  return (
    <>
      <Routes>
        <Route path="/" element={<ProtectedRoute />}>
          <Route path="/" element={<Layout />}>
            <Route index element={<Feed />} />
            <Route path="explore" element={<Explore />} />
            <Route path="reels" element={<ReelWeb />} />
            <Route path="reels/:id" element={<ReelWeb />} />
            <Route path="direct/inbox" element={<DirectInbox />} />
            <Route path="collections/:id" element={<CollectionDetail />} />
            <Route path=":username" element={<Profile />} />
            <Route path=":username/p/:postId" element={<PostDetail />} />
            <Route path=":username/saved" element={<Profile />} />
            <Route path=":username/saved/audio" element={<CollectionAudio />} />
            <Route path=":username/saved/collections/:id" element={<CollectionDetail />} />
            <Route path=":username/tagged" element={<Profile />} />
            <Route path="audio/:id" element={<Audio />} />
            <Route path="hashtags/:name" element={<HashtagPanel />} />
            <Route path="message" element={<Messages />} />
          </Route>
        </Route>

        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/email/verify/:code" element={<VerifyEmail />} />
        <Route path="/password/forgot" element={<ForgotPassword />} />
        <Route path="/password/reset" element={<ResetPassword />} />
      </Routes>

      <ToastContainer position="top-right" autoClose={2000} />
    </>
  );
}

export default App;
