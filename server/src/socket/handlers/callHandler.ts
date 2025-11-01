import { Server, Socket } from "socket.io";

export default function registerCallHandler(io: Server, socket: Socket) {
  socket.on("call_request", (payload: any) => {
    try {
      const { toUserId, roomId } = payload || {};
      console.log("[call] call_request from", socket.data?.userId, "to", toUserId, "roomId:", roomId);
      if (!toUserId) return;
      
      // ✅ XÓA: Không cần timeout logic nữa
      io.to(`u:${toUserId}`).emit("call_request", payload);
    } catch (e) {
      console.error("[call] call_request error", e);
    }
  });

  socket.on("call_response", (payload: any) => {
    try {
      const { toUserId, roomId, accepted, isUserResponse } = payload || {};
      const responderId = socket.data?.userId;
      
      console.log("[call] call_response from", responderId, "to", toUserId, "accepted:", accepted, "isUserResponse:", isUserResponse);
      
      if (!toUserId) return;
      
      const responsePayload = {
        roomId,
        accepted,
        fromUserId: responderId,
        toUserId,
        isUserResponse: isUserResponse || false,
      };
      
      if (isUserResponse) {
        io.to(`u:${responderId}`).emit("call_response_broadcast", {
          roomId,
          accepted,
          fromUserId: responderId,
          isUserResponse: true,
        });
      }
      
      io.to(`u:${toUserId}`).emit("call_response", responsePayload);
      
    } catch (e) {
      console.error("[call] call_response error", e);
    }
  });

  socket.on("call_cancel", (payload: any) => {
    try {
      const { toUserId, roomId } = payload || {};
      console.log("[call] call_cancel from", socket.data?.userId, "to", toUserId, "roomId:", roomId);
      
      if (!toUserId) return;
      io.to(`u:${toUserId}`).emit("call_cancel", payload);
    } catch (e) {
      console.error("[call] call_cancel error", e);
    }
  });

  socket.on("call_ended", (payload: any) => {
    try {
      const { roomId, reason } = payload || {};
      console.log("[call] call_ended from", socket.data?.userId, "roomId:", roomId, "reason:", reason);
      
      socket.broadcast.emit("call_ended", payload);
    } catch (e) {
      console.error("[call] call_ended error", e);
    }
  });
}
