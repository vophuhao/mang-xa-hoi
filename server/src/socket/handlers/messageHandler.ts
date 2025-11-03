import DirectMessageService from "@/services/directMessage.service";
import NotificationService from "@/services/notification.service";
import { MessageData, ReactMessageData, ReadMessageData } from "@/types/socket";
import { Server, Socket } from "socket.io";
import { getOnlineUsersHandler } from "../index";

export class MessageHandler {
  constructor(private io: Server) {}

  handleSendMessage(socket: Socket) {
    socket.on("send_message", async (data: MessageData) => {
      try {
        console.log(`[MESSAGE] Sending from ${socket.userId} to ${data.recipientId}`);

        const message = await DirectMessageService.sendMessage({
          senderId: socket.userId,
          ...data,
        });

        // ✅ SỬA: Gửi đến tất cả connections của recipient
        const onlineHandler = getOnlineUsersHandler();
        const recipientSockets = onlineHandler.getUserSockets(data.recipientId);
        
        if (recipientSockets.length > 0) {
          console.log(`[MESSAGE] Delivering to ${recipientSockets.length} connections of user ${data.recipientId}`);
          
          recipientSockets.forEach(socketId => {
            this.io.to(socketId).emit("new_message", message);
          });
        } else {
          // Fallback to room-based delivery
          this.io.to(`u:${data.recipientId}`).emit("new_message", message);
        }

        // Create or update message notification in database
        await NotificationService.createMessageNotification({
          recipientId: data.recipientId,
          senderId: socket.userId,
          messageCount: 1,
        });

        // ✅ SỬA: Emit notification to all recipient connections
        if (recipientSockets.length > 0) {
          recipientSockets.forEach(socketId => {
            this.io.to(socketId).emit("message_notification", {
              sender: message.sender,
              preview: message.content?.substring(0, 50) || "Sent a message",
              messageId: message._id,
            });
          });
        } else {
          this.io.to(`u:${data.recipientId}`).emit("message_notification", {
            sender: message.sender,
            preview: message.content?.substring(0, 50) || "Sent a message",
            messageId: message._id,
          });
        }

        // Confirm to sender
        socket.emit("message_sent", { success: true, message });
        
        console.log(`[MESSAGE] Successfully sent message ${message._id}`);
      } catch (error: any) {
        console.error("[MESSAGE] Error sending message:", error);
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
          readBy: socket.userId,
        });

        console.log(`[MESSAGE] Message ${data.messageId} marked as read by ${socket.userId}`);
      } catch (error: any) {
        console.error("[MESSAGE] Error marking message as read:", error);
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
          emoji: data.emoji,
        });

        const roomName = [socket.userId, data.partnerId].sort().join("_");
        this.io.to(roomName).emit("message_reaction", result.data);

        console.log(`[MESSAGE] User ${socket.userId} reacted to message ${data.messageId} with ${data.emoji}`);
      } catch (error: any) {
        console.error("[MESSAGE] Error reacting to message:", error);
        socket.emit("error", { message: error.message });
      }
    });
  }

  // ✅ THÊM: Handle delete message
  handleDeleteMessage(socket: Socket) {
    socket.on("delete_message", async (data: { messageId: string; partnerId: string }) => {
      try {
        console.log(`[MESSAGE] Deleting message ${data.messageId} by user ${socket.userId}`);
        
        const result = await DirectMessageService.deleteMessage(data.messageId, socket.userId);
        
        const roomName = [socket.userId, data.partnerId].sort().join("_");
        this.io.to(roomName).emit("message_deleted", {
          messageId: data.messageId,
          deletedBy: socket.userId,
        });
        
        console.log(`[MESSAGE] Successfully deleted message ${data.messageId}`);
        
        socket.emit("message_delete_result", { 
          success: true,
          message: result.message || "Message deleted successfully",
          messageId: data.messageId
        });
        
      } catch (error: any) {
        console.error("[MESSAGE] Error deleting message:", error);
        socket.emit("message_delete_result", { 
          success: false, 
          error: error.message 
        });
      }
    });
  }
}
