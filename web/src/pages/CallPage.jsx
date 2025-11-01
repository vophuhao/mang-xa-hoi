import React, { useEffect, useRef, useState, useCallback } from "react";

import { ZegoUIKitPrebuilt } from '@zegocloud/zego-uikit-prebuilt';
import { useSearchParams, useNavigate } from "react-router-dom";

import useAuth from "@/hooks/useAuth";
import useSocket from "@/hooks/useSocket";

function randomID(len) {
  let result = '';
  if (result) return result;
  var chars = '12345qwertyuiopasdfgh67890jklmnbvcxzMNBVCZXASDQWERTYHGFUIOLKJP',
    maxPos = chars.length,
    i;
  len = len || 5;
  for (i = 0; i < len; i++) {
    result += chars.charAt(Math.floor(Math.random() * maxPos));
  }
  return result;
}

export default function CallPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { emit } = useSocket();
  
  const roomId = searchParams.get("roomId") || randomID(5);
  const role = searchParams.get("role");
  const otherUserId = searchParams.get("to") || searchParams.get("from");
  
  const containerRef = useRef(null);
  const [callEnded, setCallEnded] = useState(false);
  const [zegoInitialized, setZegoInitialized] = useState(false);
  const zegoInstanceRef = useRef(null);
  const componentMountedRef = useRef(true);
  const destroyedRef = useRef(false);

  const closeCall = useCallback((reason = "ended") => {
    console.log(`[CALL] closeCall called with reason: ${reason}`);
    
    setTimeout(() => {
      if (window.opener) {
        window.close();
      } else {
        navigate('/message');
      }
    }, 1000);
  }, [navigate]);

  // ✅ THÊM: destroyZegoSafely function
  const destroyZegoSafely = useCallback(() => {
    if (zegoInstanceRef.current && !destroyedRef.current) {
      try {
        console.log("[ZEGO] Destroying instance...");
        destroyedRef.current = true;
        zegoInstanceRef.current.destroy();
        zegoInstanceRef.current = null;
        console.log("[ZEGO] Instance destroyed successfully");
      } catch (error) {
        console.error("[ZEGO] Error destroying instance:", error);
        zegoInstanceRef.current = null;
      }
    }
  }, []);

  // ✅ Init ZEGO
  useEffect(() => {
    if (!user?.data?._id || !containerRef.current || zegoInitialized || destroyedRef.current) {
      return;
    }

    const initZego = async () => {
      try {
        console.log("[ZEGO] Initializing...");
        
        const appID = 1631468128;
        const serverSecret = "65e0fdf03e18a42c0947cbc1b7da6fb2";
        
        const kitToken = ZegoUIKitPrebuilt.generateKitTokenForTest(
          appID, 
          serverSecret, 
          roomId,
          user.data._id.toString(),
          user.data.fullName || user.data.username || `User_${user.data._id}`
        );

        const zp = ZegoUIKitPrebuilt.create(kitToken);
        zegoInstanceRef.current = zp;
        
        await new Promise(resolve => setTimeout(resolve, 100));
        
        if (!componentMountedRef.current || destroyedRef.current) return;

        zp.joinRoom({
          container: containerRef.current,
          scenario: {
            mode: ZegoUIKitPrebuilt.OneONoneCall,
          },
          showPreJoinView: false,
          showLeavingView: false,
          turnOnCameraWhenJoining: true,
          turnOnMicrophoneWhenJoining: true,
          showMyCameraToggleButton: true,
          showMyMicrophoneToggleButton: true,
          showAudioVideoSettingsButton: true,
          showScreenSharingButton: false,
          showLayoutButton: false,
          showTextChat: false,
          showUserList: false,
          maxUsers: 2,
          onJoinRoom: () => {
            if (!componentMountedRef.current || destroyedRef.current) return;
            console.log("[ZEGO] Joined room:", roomId);
          },
          onLeaveRoom: () => {
            if (!componentMountedRef.current || destroyedRef.current) return;
            console.log("[ZEGO] Left room:", roomId);
            closeCall("ended");
          },
          onUserJoin: (users) => {
            console.log("[ZEGO] Users joined:", users);
          },
          onUserLeave: (users) => {
            console.log("[ZEGO] Users left:", users);
            if (users && users.length === 1 && !destroyedRef.current) {
              console.log("[ZEGO] Other user left, ending call");
              closeCall("ended");
            }
          },
        });

        setZegoInitialized(true);
        console.log("[ZEGO] Initialization complete");

      } catch (error) {
        console.error("[ZEGO] Failed to initialize call:", error);
        if (componentMountedRef.current && !destroyedRef.current) {
          closeCall("cancelled");
        }
      }
    };

    initZego();

    return () => {
      componentMountedRef.current = false;
      console.log("[ZEGO] Component unmounting...");
    };
  }, [user?.data?._id, roomId, zegoInitialized, closeCall]);

  // ✅ Cleanup effect
  useEffect(() => {
    return () => {
      destroyZegoSafely();
    };
  }, [destroyZegoSafely]);

  // ✅ Listen for socket events
  useEffect(() => {
    if (!emit?.socket) return;

    const handleCallEnded = ({ roomId: endedRoomId, reason }) => {
      if (endedRoomId === roomId && !callEnded && !destroyedRef.current) {
        console.log(`[SOCKET] Call ended by other user: ${reason}`);
        closeCall(reason);
      }
    };

    emit.socket.on("call_ended", handleCallEnded);

    return () => {
      emit.socket.off("call_ended", handleCallEnded);
    };
  }, [emit, roomId, callEnded, closeCall]);

  return (
    <div className="fixed inset-0 bg-black">
      <div 
        ref={containerRef} 
        className="w-full h-full"
        style={{ width: '100vw', height: '100vh' }}
      />
      
      {!zegoInitialized && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-75 z-50">
          <div className="text-white text-center">
            <div className="text-xl mb-2">Đang khởi tạo cuộc gọi...</div>
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto"></div>
          </div>
        </div>
      )}
    </div>
  );
}
