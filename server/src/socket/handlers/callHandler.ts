// Tạo handler socket cho call: call_request, call_response, call_cancel
import { Server, Socket } from "socket.io";

export default function registerCallHandler(io: Server, socket: Socket) {
  // Caller -> server -> forward to callee(s) in their personal room
  socket.on("call_request", (payload: any) => {
    try {
      const { toUserId } = payload || {};
      console.log("[call] call_request from", socket.data?.userId, "to", toUserId, payload);
      if (!toUserId) return;
      io.to(`u:${toUserId}`).emit("call_request", payload);
    } catch (e) {
      console.error("[call] call_request error", e);
    }
  });

  // Callee response -> forward back to caller (fromUserId must be provided)
  socket.on("call_response", (payload: any) => {
    try {
      const { toUserId } = payload || {};
      console.log("[call] call_response from", socket.data?.userId, "to", toUserId, payload);
      if (!toUserId) return;
      io.to(`u:${toUserId}`).emit("call_response", payload);
    } catch (e) {
      console.error("[call] call_response error", e);
    }
  });

  // Caller cancel -> notify callee(s)
  socket.on("call_cancel", (payload: any) => {
    try {
      const { toUserId } = payload || {};
      console.log("[call] call_cancel from", socket.data?.userId, "to", toUserId, payload);
      if (!toUserId) return;
      io.to(`u:${toUserId}`).emit("call_cancel", payload);
    } catch (e) {
      console.error("[call] call_cancel error", e);
    }
  });
}
