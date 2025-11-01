import { Server, Socket } from "socket.io";

export class OnlineUsersHandler {
  private io: Server;
  private onlineUsers = new Map<string, string>(); // userId -> socketId

  constructor(io: Server) {
    this.io = io;
  }

  handleUserOnline(socket: Socket) {
    const userId = socket.userId;
    if (userId) {
      this.onlineUsers.set(userId, socket.id);
      console.log(`[ONLINE] User ${userId} is now online. Total: ${this.onlineUsers.size}`);
      
      // Broadcast to all clients that user is online
      socket.broadcast.emit("user_online", userId);
    }
  }

  handleUserOffline(socket: Socket) {
    const userId = socket.userId;
    if (userId && this.onlineUsers.has(userId)) {
      this.onlineUsers.delete(userId);
      console.log(`[ONLINE] User ${userId} is now offline. Total: ${this.onlineUsers.size}`);
      
      // Broadcast to all clients that user is offline
      socket.broadcast.emit("user_offline", userId);
    }
  }

  handleGetOnlineUsers(socket: Socket) {
    socket.on("getOnlineUsers", () => {
      const onlineUserIds = Array.from(this.onlineUsers.keys());
      console.log(`[ONLINE] Sending online users to ${socket.userId}:`, onlineUserIds);
      socket.emit("onlineUsers", onlineUserIds);
    });
  }

  getOnlineUsers(): string[] {
    return Array.from(this.onlineUsers.keys());
  }

  isUserOnline(userId: string): boolean {
    return this.onlineUsers.has(userId);
  }
}