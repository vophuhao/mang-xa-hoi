import jwt from "jsonwebtoken";
import { JWT_SECRET } from "@/constants/env";
import { Socket } from "socket.io";
import { ExtendedError } from "socket.io/dist/namespace";

export const socketAuthMiddleware = async (
  socket: Socket, 
  next: (err?: ExtendedError) => void
) => {
  try {
    const token = socket.handshake.auth.token;
    
    if (!token) {
      throw new Error("No token provided");
    }

    const decoded = jwt.verify(token, JWT_SECRET) as any;
    socket.userId = decoded.userId;
    
    console.log(`Socket authenticated for user: ${socket.userId}`);
    next();
  } catch (err) {
    console.log("Socket authentication failed:", err);
    next(new Error("Authentication error"));
  }
};