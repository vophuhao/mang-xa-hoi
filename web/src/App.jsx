import { useEffect, useState } from "react";

import { Route, Routes, useNavigate } from "react-router-dom";
import { ToastContainer } from "react-toastify";

import SplashScreen from "@/components/SplashScreen";
import SocketContext from "@/contexts/SocketContext";
import useAuth from "@/hooks/useAuth";
import useSocket from "@/hooks/useSocket";
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
 
   const { user } = useAuth();
   const userId = user?.data?._id;
   const token = user?.token || user?.data?.token;

   const { socket, on, off, emit } = useSocket({ token, userId });

   const navigate = useNavigate();
   setNavigate(navigate);

		<Route path=":username/edit" element={<EditProfile />} />
   const [incomingCall, setIncomingCall] = useState(null);

   useEffect(() => {
      if (!socket) return;

      const handleIncoming = (payload) => {
         // payload: { fromUserId, fromUserName?, callType, callId }
         console.log("[socket] incoming call:", payload);
         setIncomingCall(payload);
      };

      const handleCallCancelled = ({ callId }) => {
         if (incomingCall?.callId === callId) setIncomingCall(null);
      };

      // Listen for server forwarded call request
      on("call_request", handleIncoming);
      on("call_cancel", handleCallCancelled);

      return () => {
         off("call_request", handleIncoming);
         off("call_cancel", handleCallCancelled);
      };
   }, [socket, on, off, incomingCall]);

   const acceptCall = () => {
      if (!incomingCall) return;
      // notify server we accept
      emit("call_response", { callId: incomingCall.callId, accepted: true, toUserId: incomingCall.fromUserId });
      // open callee UI
      const url = `/call?callId=${encodeURIComponent(incomingCall.callId)}&type=${encodeURIComponent(incomingCall.callType)}&role=callee&from=${encodeURIComponent(incomingCall.fromUserId)}`;
      window.open(url, "_blank", "noopener,noreferrer");
      setIncomingCall(null);
   };

   const declineCall = () => {
      if (!incomingCall) return;
      emit("call_response", { callId: incomingCall.callId, accepted: false, toUserId: incomingCall.fromUserId });
      setIncomingCall(null);
   };

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

            <CallPopup call={incomingCall} onAccept={acceptCall} onDecline={declineCall} />
            <ToastContainer position="top-right" autoClose={2000} />
         </SocketContext.Provider>
      </>
   );
}