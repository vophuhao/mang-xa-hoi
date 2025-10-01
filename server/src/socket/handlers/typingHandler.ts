import { Socket } from "socket.io";
import { TypingData } from "@/types/socket";

export class TypingHandler {
  handleTyping(socket: Socket) {
    socket.on("typing", (data: TypingData) => {
      const roomName = [socket.userId, data.partnerId].sort().join("_");
      socket.to(roomName).emit("user_typing", {
        userId: socket.userId,
        isTyping: true
      });
    });

    socket.on("stop_typing", (data: TypingData) => {
      const roomName = [socket.userId, data.partnerId].sort().join("_");
      socket.to(roomName).emit("user_typing", {
        userId: socket.userId,
        isTyping: false
      });
    });
  }
}