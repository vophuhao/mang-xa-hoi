import { APP_ORIGIN } from "@/constants/env";
import { Server as HttpServer } from "http";
import { Server } from "socket.io";
import { MessageHandler } from "./handlers/messageHandler";
import { NotificationHandler } from "./handlers/notificationHandler";
import { TypingHandler } from "./handlers/typingHandler";
import { OnlineUsersHandler } from "./handlers/onlineUsersHandler";
import { socketAuthMiddleware } from "./middleware/socketAuth";
import registerCallHandler from "./handlers/callHandler";

let notificationHandler: NotificationHandler;
let onlineUsersHandler: OnlineUsersHandler;

export function initializeSocket(httpServer: HttpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: APP_ORIGIN,
      credentials: true,
      methods: ["GET", "POST"],
    },
    pingTimeout: 60000, // 60 seconds
    pingInterval: 25000, // 25 seconds
  });

  // Apply authentication middleware
  io.use(socketAuthMiddleware);

  // Initialize handlers
  const messageHandler = new MessageHandler(io);
  const typingHandler = new TypingHandler();
  notificationHandler = new NotificationHandler(io);
  onlineUsersHandler = new OnlineUsersHandler(io);

  io.on("connection", (socket) => {
    console.log(`[CONNECTION] User ${socket.userId} connected (socket: ${socket.id})`);

    // Join user to their personal room
    socket.join(`u:${socket.userId}`);
    console.log(`[ROOM] User ${socket.userId} joined personal room`);

    onlineUsersHandler.handleUserOnline(socket);
    onlineUsersHandler.handleGetOnlineUsers(socket);
    onlineUsersHandler.handleHeartbeat(socket);
    onlineUsersHandler.handleTabClosing(socket);

    // Conversation room management
    socket.on("join_conversation", (partnerId: string) => {
      const roomName = [socket.userId, partnerId].sort().join("_");
      socket.join(roomName);
      console.log(`[ROOM] User ${socket.userId} joined conversation: ${roomName}`);
    });

    socket.on("leave_conversation", (partnerId: string) => {
      const roomName = [socket.userId, partnerId].sort().join("_");
      socket.leave(roomName);
      console.log(`[ROOM] User ${socket.userId} left conversation: ${roomName}`);
    });

    // Register message handlers
    messageHandler.handleSendMessage(socket);
    messageHandler.handleMarkAsRead(socket);
    messageHandler.handleReactToMessage(socket);
    messageHandler.handleDeleteMessage(socket);

    // Register typing handlers
    typingHandler.handleTyping(socket);

    // ✅ THÊM: Debug endpoint để xem connection info
    socket.on("getConnectionInfo", () => {
      const info = onlineUsersHandler.getConnectionInfo();
      socket.emit("connectionInfo", info);
    });

    socket.on("error", (error) => {
      console.error(`[ERROR] Socket error for user ${socket.userId}:`, error);
    });

    socket.on("disconnect", (reason) => {
      console.log(`[DISCONNECT] User ${socket.userId} disconnected (socket: ${socket.id}) - Reason: ${reason}`);
      
      onlineUsersHandler.handleUserOffline(socket);
      
      setTimeout(() => {
        onlineUsersHandler.getConnectionInfo();
      }, 1000);
    });

    // Register call handlers
    try {
      registerCallHandler(io, socket);
    } catch (e) {
      console.error("[ERROR] Failed to register call handler", e);
    }
  });

  setInterval(() => {
    const info = onlineUsersHandler.getConnectionInfo();
    if (info.totalConnections > 0) {
      console.log(`[STATS] Online users: ${info.totalUsers}, Total connections: ${info.totalConnections}`);
    }
  }, 60000); // Log every minute

  return io;
}

// Export notification handler for use in services
export function getNotificationHandler(): NotificationHandler {
  if (!notificationHandler) {
    throw new Error("Socket.IO not initialized");
  }
  return notificationHandler;
}

// Export online users handler
export function getOnlineUsersHandler(): OnlineUsersHandler {
  if (!onlineUsersHandler) {
    throw new Error("Socket.IO not initialized");
  }
  return onlineUsersHandler;
}

// ✅ THÊM: Helper functions for other services to use
export function isUserOnline(userId: string): boolean {
  return onlineUsersHandler?.isUserOnline(userId) || false;
}

export function getUserConnectionCount(userId: string): number {
  return onlineUsersHandler?.getUserConnectionCount(userId) || 0;
}

export function getOnlineUsers(): string[] {
  return onlineUsersHandler?.getOnlineUsers() || [];
}
