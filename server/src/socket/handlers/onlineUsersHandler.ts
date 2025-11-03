import { Server, Socket } from "socket.io";
import UserModel from "@/models/user.model";

export class OnlineUsersHandler {
  private io: Server;
  private userConnections = new Map<string, Set<string>>(); 
  private socketToUser = new Map<string, string>(); 

  constructor(io: Server) {
    this.io = io;
  }

  handleUserOnline(socket: Socket) {
    const userId = socket.userId;
    if (!userId) return;

    this.socketToUser.set(socket.id, userId);

    if (!this.userConnections.has(userId)) {
      this.userConnections.set(userId, new Set());
    }
    this.userConnections.get(userId)!.add(socket.id);

    const connectionCount = this.userConnections.get(userId)!.size;
    
    console.log(`[ONLINE] User ${userId} connected (socket: ${socket.id}). Connections: ${connectionCount}`);
    
    if (connectionCount === 1) {
      this.clearLastOnline(userId);
      console.log(`[ONLINE] User ${userId} is now online (first connection). Total users: ${this.userConnections.size}`);
      socket.broadcast.emit("user_online", userId);
    } else {
      console.log(`[ONLINE] User ${userId} has additional connection. Total connections: ${connectionCount}`);
    }
  }

  handleUserOffline(socket: Socket) {
    const userId = this.socketToUser.get(socket.id);
    if (!userId) return;

    this.socketToUser.delete(socket.id);

    const userSockets = this.userConnections.get(userId);
    if (!userSockets) return;

    userSockets.delete(socket.id);
    const remainingConnections = userSockets.size;

    console.log(`[OFFLINE] User ${userId} disconnected (socket: ${socket.id}). Remaining connections: ${remainingConnections}`);

    if (remainingConnections === 0) {
      this.userConnections.delete(userId);
      this.setLastOnline(userId);
      console.log(`[OFFLINE] User ${userId} is now offline (no active connections). Total users: ${this.userConnections.size}`);
      socket.broadcast.emit("user_offline", userId);
    } else {
      console.log(`[OFFLINE] User ${userId} still has ${remainingConnections} active connections`);
    }
  }

  private async setLastOnline(userId: string) {
    try {
      await UserModel.findByIdAndUpdate(userId, {
        lastOnline: new Date()
      });
      console.log(`[LAST_ONLINE] Set lastOnline for user ${userId}`);
    } catch (error) {
      console.error(`[LAST_ONLINE] Failed to set lastOnline for user ${userId}:`, error);
    }
  }

  private async clearLastOnline(userId: string) {
    try {
      await UserModel.findByIdAndUpdate(userId, {
        lastOnline: null
      });
      console.log(`[LAST_ONLINE] Cleared lastOnline for user ${userId}`);
    } catch (error) {
      console.error(`[LAST_ONLINE] Failed to clear lastOnline for user ${userId}:`, error);
    }
  }

  handleGetOnlineUsers(socket: Socket) {
    socket.on("getOnlineUsers", () => {
      const onlineUserIds = Array.from(this.userConnections.keys());
      console.log(`[ONLINE] Sending online users to ${socket.userId}:`, onlineUserIds.length, "users");
      socket.emit("onlineUsers", onlineUserIds);
    });

    socket.on("checkUserOnline", ({ userId }, callback) => {
      const isOnline = this.userConnections.has(userId);
      const connectionCount = this.userConnections.get(userId)?.size || 0;
      
      console.log(`[ONLINE] Checking user ${userId}: online=${isOnline}, connections=${connectionCount}`);
      
      if (callback && typeof callback === 'function') {
        callback({ 
          userId, 
          isOnline, 
          connectionCount 
        });
      }
    });
  }

  handleHeartbeat(socket: Socket) {
    socket.on("heartbeat", ({ userId, timestamp }) => {
      if (userId === socket.userId) {
        console.log(`[HEARTBEAT] Received from user ${userId} (socket: ${socket.id})`);
        // Update last heartbeat time if needed
        socket.emit("heartbeatAck", { 
          serverTime: Date.now(),
          socketId: socket.id 
        });
      }
    });
  }

  handleTabClosing(socket: Socket) {
    socket.on("tabClosing", ({ userId, tabId }) => {
      console.log(`[TAB] Tab ${tabId} of user ${userId} is closing (socket: ${socket.id})`);
    });
  }

  getConnectionInfo() {
    const info = {
      totalUsers: this.userConnections.size,
      totalConnections: Array.from(this.userConnections.values())
        .reduce((sum, connections) => sum + connections.size, 0),
      userDetails: Array.from(this.userConnections.entries()).map(([userId, sockets]) => ({
        userId,
        connectionCount: sockets.size,
        socketIds: Array.from(sockets)
      }))
    };
    
    console.log('[CONNECTION_INFO]', info);
    return info;
  }

  getOnlineUsers(): string[] {
    return Array.from(this.userConnections.keys());
  }

  isUserOnline(userId: string): boolean {
    return this.userConnections.has(userId);
  }

  getUserConnectionCount(userId: string): number {
    return this.userConnections.get(userId)?.size || 0;
  }

  getUserSockets(userId: string): string[] {
    return Array.from(this.userConnections.get(userId) || []);
  }

  forceDisconnectUser(userId: string) {
    const userSockets = this.userConnections.get(userId);
    if (userSockets) {
      userSockets.forEach(socketId => {
        const socket = this.io.sockets.sockets.get(socketId);
        if (socket) {
          console.log(`[FORCE_DISCONNECT] Disconnecting socket ${socketId} for user ${userId}`);
          socket.disconnect(true);
        }
      });
    }
  }
}