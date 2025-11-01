import { useEffect, useState, useCallback } from "react";

import { updateCallStatus } from "@/lib/api";

import useAuth from "./useAuth";
import useSocket from "./useSocket";

export default function useCallHandler() {
  const { user } = useAuth();
  const userId = user?.data?._id;
  const { socket, on, off, emit } = useSocket({ 
    token: user?.token || user?.data?.token, 
    userId 
  });

  const [incomingCall, setIncomingCall] = useState(null);

  useEffect(() => {
    if (!socket) return;

    const handleIncoming = async (payload) => {
      try {
        console.log("[socket] incoming call:", payload);
        setIncomingCall(payload);
      } catch (error) {
        console.error("[socket] Error handling incoming call:", error);
      }
    };

    const handleCallCancelled = ({ roomId }) => {
      try {
        console.log("[socket] Call cancelled for room:", roomId);
        if (incomingCall?.roomId === roomId) {
          setIncomingCall(null);
        }
      } catch (error) {
        console.error("[socket] Error handling call cancelled:", error);
      }
    };

    const handleCallResponseFromOtherTab = ({ roomId, accepted, fromUserId }) => {
      try {
        console.log(`[socket] Response from other tab - room: ${roomId}, accepted: ${accepted}, from: ${fromUserId}`);
        if (incomingCall?.roomId === roomId) {
          setIncomingCall(null);
        }
      } catch (error) {
        console.error("[socket] Error handling response from other tab:", error);
      }
    };

    const handleCallEnded = ({ roomId, reason }) => {
      try {
        console.log(`[socket] Call ended - room: ${roomId}, reason: ${reason}`);
        if (incomingCall?.roomId === roomId) {
          setIncomingCall(null);
        }
      } catch (error) {
        console.error("[socket] Error handling call ended:", error);
      }
    };

    const handleCallResponse = async ({ roomId, accepted, fromUserId, isUserResponse, toUserId }) => {
      try {
        console.log(`[socket] Call response - room: ${roomId}, accepted: ${accepted}, from: ${fromUserId}, to: ${toUserId}, isUserResponse: ${isUserResponse}, myUserId: ${userId}`);
        
        // CHỈ update khi từ chối
        if (roomId && isUserResponse && !accepted) {
          try {
            await updateCallStatus(roomId, {
              status: "declined",
              endedAt: new Date().toISOString(),
            });
            console.log(`[CALL] Updated call status to: declined`);
          } catch (error) {
            console.error("[CALL] Failed to update call status:", error);
          }
        }
        
        if (incomingCall?.roomId === roomId) {
          console.log("[socket] Clearing incoming call popup");
          setIncomingCall(null);
        }
      } catch (error) {
        console.error("[socket] Error handling call response:", error);
      }
    };

    // Listen for call notifications
    try {
      on("call_request", handleIncoming);
      on("call_cancel", handleCallCancelled);
      on("call_response_broadcast", handleCallResponseFromOtherTab);
      on("call_ended", handleCallEnded);
      on("call_response", handleCallResponse);
    } catch (error) {
      console.error("[socket] Error setting up listeners:", error);
    }

    return () => {
      try {
        off("call_request", handleIncoming);
        off("call_cancel", handleCallCancelled);
        off("call_response_broadcast", handleCallResponseFromOtherTab);
        off("call_ended", handleCallEnded);
        off("call_response", handleCallResponse);
      } catch (error) {
        console.error("[socket] Error cleaning up listeners:", error);
      }
    };
  }, [socket, on, off, incomingCall, userId]);

  // Accept call function
  const acceptCall = useCallback(() => {
    try {
      if (!incomingCall) return;
      
      console.log("[CALL] Accepting call:", incomingCall.roomId, "from:", incomingCall.fromUserId);
      
      emit("call_response", { 
        roomId: incomingCall.roomId, 
        accepted: true, 
        toUserId: incomingCall.fromUserId,
        fromUserId: userId,
        isUserResponse: true
      });
      
      const url = `/call?roomId=${encodeURIComponent(incomingCall.roomId)}&role=callee&from=${encodeURIComponent(incomingCall.fromUserId)}`;
      window.open(url, "_blank", "noopener,noreferrer");
      setIncomingCall(null);
    } catch (error) {
      console.error("[CALL] Error accepting call:", error);
      setIncomingCall(null);
    }
  }, [incomingCall, emit, userId]);

  // Decline call function  
  const declineCall = useCallback(() => {
    try {
      if (!incomingCall) return;
      
      console.log("[CALL] Declining call:", incomingCall.roomId, "from:", incomingCall.fromUserId);
      
      emit("call_response", { 
        roomId: incomingCall.roomId, 
        accepted: false,
        toUserId: incomingCall.fromUserId,
        fromUserId: userId,
        isUserResponse: true
      });
      setIncomingCall(null);
    } catch (error) {
      console.error("[CALL] Error declining call:", error);
      setIncomingCall(null);
    }
  }, [incomingCall, emit, userId]);

  return {
    socket,
    incomingCall,
    acceptCall,
    declineCall
  };
}