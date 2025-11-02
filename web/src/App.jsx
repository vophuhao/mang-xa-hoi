import { useEffect, useState } from "react";

import { Route, Routes, useNavigate } from "react-router-dom";
import { ToastContainer } from "react-toastify";

import SplashScreen from "@/components/SplashScreen";
import SocketContext from "@/contexts/SocketContext";
import useCallHandler from "@/hooks/useCallHandler";
import "react-toastify/dist/ReactToastify.css";
import useSplashScreen from "@/hooks/useSplashScreen";
import { setNavigate } from "@/lib/navigation";
import ForgotPassword from "@/pages/ForgotPassword";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import ResetPassword from "@/pages/ResetPassword";
import VerifyEmail from "@/pages/VerifyEmail";

import Audio from "./components/Audio";
import HashtagPanel from "./components/HashtagPanel";
import CallPopup from "./components/popup/CallPopup";
import ReelWeb from "./components/Reel";
import CallPage from "./pages/CallPage";
import CollectionAudio from "./pages/ColectionAudio";
import CollectionDetail from "./pages/CollectionDetail";
import DirectInbox from "./pages/DirectInbox";
import EditProfile from "./pages/EditProfile";
import Explore from "./pages/Explore";
import ExplorePeople from "./pages/ExplorePeople";
import Feed from "./pages/Feed";
import Layout from "./pages/Layout";
import Messages from "./pages/Messages";
import PostDetail from "./pages/PostDetail";
import Profile from "./pages/Profile";
import ProtectedRoute from "./routes/ProtectedRoute";

export default function App({ children }) {

   const navigate = useNavigate();
   setNavigate(navigate);

   <Route path=":username/edit" element={<EditProfile />} />

   const { socket, incomingCall, acceptCall, declineCall } = useCallHandler();


   // Splash screen logic
   const { showSplash, isAppReady, hideSplash } = useSplashScreen();
   if (showSplash) return <SplashScreen onFinish={hideSplash} />;
   if (!isAppReady) return null;

   return (
      <>
         <SocketContext.Provider value={socket}>
            <Routes>
               <Route path="/" element={<ProtectedRoute />}>
                  <Route path="/" element={<Layout />}>
                     {/* Route cố định cho cuộc gọi: phải nằm trước route động :username */}
                     <Route path="call-room" element={<CallPage />} />
                     <Route path="call" element={<CallPage />} />
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