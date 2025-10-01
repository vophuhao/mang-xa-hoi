import { Socket, Server } from "socket.io";
import DirectMessageService from "@/services/directMessage.service";
import { MessageData, ReadMessageData, ReactMessageData } from "@/types/socket";

export class MessageHandler {
  constructor(private io: Server) {}

  handleSendMessage(socket: Socket) {
    socket.on("send_message", async (data: MessageData) => {
      try {
        console.log(`Sending message from ${socket.userId}:`, data);
        
        const message = await DirectMessageService.sendMessage({
          senderId: socket.userId,
          ...data
        });

        const roomName = [socket.userId, data.recipientId].sort().join("_");
        
        // Emit to conversation room
        this.io.to(roomName).emit("new_message", message);
        console.log(`Message sent to room: ${roomName}`);
        
        // Emit notification to recipient
        this.io.to(`user_${data.recipientId}`).emit("message_notification", {
          sender: message.sender,
          preview: message.content?.substring(0, 50) || "Sent a message",
          messageId: message._id
        });

        // Confirm to sender
        socket.emit("message_sent", { success: true, message });
        
      } catch (error: any) {
        console.error("Error sending message:", error);
        socket.emit("message_error", { message: error.message });
      }
    });
  }

  handleMarkAsRead(socket: Socket) {
    socket.on("mark_as_read", async (data: ReadMessageData) => {
      try {
        await DirectMessageService.markAsRead(data.messageId, socket.userId);
        
        const roomName = [socket.userId, data.partnerId].sort().join("_");
        socket.to(roomName).emit("message_read", {
          messageId: data.messageId,
          readBy: socket.userId
        });
        
        console.log(`Message ${data.messageId} marked as read by ${socket.userId}`);
      } catch (error: any) {
        console.error("Error marking message as read:", error);
        socket.emit("error", { message: error.message });
      }
    });
  }

  handleReactToMessage(socket: Socket) {
    socket.on("react_message", async (data: ReactMessageData) => {
      try {
        const result = await DirectMessageService.reactToMessage({
          messageId: data.messageId,
          userId: socket.userId,
          emoji: data.emoji
        });

        const roomName = [socket.userId, data.partnerId].sort().join("_");
        this.io.to(roomName).emit("message_reaction", result.data);
        
        console.log(`User ${socket.userId} reacted to message ${data.messageId} with ${data.emoji}`);
      } catch (error: any) {
        console.error("Error reacting to message:", error);
        socket.emit("error", { message: error.message });
      }
    });
  }
}