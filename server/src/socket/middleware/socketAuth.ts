import jwt from "jsonwebtoken";
import { JWT_SECRET } from "@/constants/env";
import { Socket } from "socket.io";
import { ExtendedError } from "socket.io/dist/namespace";
import cookie from "cookie"; // Thêm dòng này

export const socketAuthMiddleware = async (
  socket: Socket, 
  next: (err?: ExtendedError) => void
) => {
  try {
    // Lấy cookie từ header
    const cookies = socket.handshake.headers.cookie;
    if (!cookies) throw new Error("No cookie found");

    // Parse cookie
    const parsed = cookie.parse(cookies);
    const token = parsed["accessToken"]; // Đổi tên nếu cookie của bạn tên khác

    if (!token) {
      throw new Error("No token provided in cookie");
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