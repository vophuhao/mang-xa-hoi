import { Server } from "socket.io";
import { Server as HttpServer } from "http";
import { socketAuthMiddleware } from "./middleware/socketAuth";
import { MessageHandler } from "./handlers/messageHandler";
import { TypingHandler } from "./handlers/typingHandler";
import { APP_ORIGIN } from "@/constants/env";

export function initializeSocket(httpServer: HttpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: APP_ORIGIN, // Có thể thay bằng APP_ORIGIN trong production
      credentials: true,
      methods: ["GET", "POST"]
    }
  });

  // Apply authentication middleware
  io.use(socketAuthMiddleware);

  // Initialize handlers
  const messageHandler = new MessageHandler(io);
  const typingHandler = new TypingHandler();

  io.on("connection", (socket) => {
    console.log(`User ${socket.userId} connected to socket`);

    // Join user to their personal room
    socket.join(`user_${socket.userId}`);
    console.log(`User ${socket.userId} joined personal room`);

    // Conversation room management
    socket.on("join_conversation", (partnerId: string) => {
      const roomName = [socket.userId, partnerId].sort().join("_");
      socket.join(roomName);
      console.log(`User ${socket.userId} joined conversation room: ${roomName}`);
    });

    socket.on("leave_conversation", (partnerId: string) => {
      const roomName = [socket.userId, partnerId].sort().join("_");
      socket.leave(roomName);
      console.log(`User ${socket.userId} left conversation room: ${roomName}`);
    });

    // Register message handlers
    messageHandler.handleSendMessage(socket);
    messageHandler.handleMarkAsRead(socket);
    messageHandler.handleReactToMessage(socket);

    // Register typing handlers
    typingHandler.handleTyping(socket);

    // Handle disconnect
    socket.on("disconnect", () => {
      console.log(`User ${socket.userId} disconnected from socket`);
    });
  });

  return io;
}