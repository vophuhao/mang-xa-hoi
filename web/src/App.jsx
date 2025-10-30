import { Routes, Route, useNavigate } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import SplashScreen from "@/components/SplashScreen";
import SocketContext from "@/contexts/SocketContext";
import useCallHandler from "@/hooks/useCallHandler";
import useSplashScreen from "@/hooks/useSplashScreen";
import { setNavigate } from "@/lib/navigation";

// Components and Pages
import Audio from "./components/Audio";
import HashtagPanel from "./components/HashtagPanel";
import CallPopup from "./components/popup/CallPopup";
import ReelWeb from "./components/Reel";
import CallPage from "./pages/CallPage";
import CollectionAudio from "./pages/ColectionAudio";
import CollectionDetail from "./pages/CollectionDetail";
import DirectInbox from "./pages/DirectInbox";
import Explore from "./pages/Explore";
import ExplorePeople from "./pages/ExplorePeople";
import Feed from "./pages/Feed";
import ForgotPassword from "./pages/ForgotPassword";
import Layout from "./pages/Layout";
import Login from "./pages/Login";
import Messages from "./pages/Messages";
import PostDetail from "./pages/PostDetail";
import Profile from "./pages/Profile";
import Register from "./pages/Register";
import ResetPassword from "./pages/ResetPassword";
import VerifyEmail from "./pages/VerifyEmail";
import ProtectedRoute from "./routes/ProtectedRoute";

export default function App() {
  const navigate = useNavigate();
  setNavigate(navigate);
  
  const { socket, incomingCall, acceptCall, declineCall } = useCallHandler();

  // Splash screen logic
  const { showSplash, isAppReady, hideSplash } = useSplashScreen();
  if (showSplash) return <SplashScreen onFinish={hideSplash} />;
  if (!isAppReady) return null;

  return (
    <>
      <SocketContext.Provider value={socket}>
        <Routes>
          {/* Routes có ProtectedRoute nhưng KHÔNG có Layout */}
          <Route path="/call" element={<ProtectedRoute />}>
            <Route index element={<CallPage />} />
          </Route>
          <Route path="/call-room" element={<ProtectedRoute />}>
            <Route index element={<CallPage />} />
          </Route>

          {/* Routes có cả ProtectedRoute VÀ Layout */}
          <Route path="/" element={<ProtectedRoute />}>
            <Route path="/" element={<Layout />}>
              <Route index element={<Feed />} />
              <Route path="explore" element={<Explore />} />
              <Route path="explore/people" element={<ExplorePeople />} />
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

          {/* Routes công khai không cần ProtectedRoute */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/email/verify/:code" element={<VerifyEmail />} />
          <Route path="/password/forgot" element={<ForgotPassword />} />
          <Route path="/password/reset" element={<ResetPassword />} />
        </Routes>

        {/* Call notification popup */}
        <CallPopup 
          call={incomingCall} 
          onAccept={acceptCall} 
          onDecline={declineCall} 
        />
        <ToastContainer position="top-right" autoClose={2000} />
      </SocketContext.Provider>
    </>
  );
}