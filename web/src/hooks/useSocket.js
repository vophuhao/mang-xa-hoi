import { useEffect, useRef } from "react";

import { io } from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:5555";

export default function useSocket() {
  const socketRef = useRef(null);

  useEffect(() => {
    // Kết nối socket, không cần truyền token nếu backend xác thực bằng cookie
    const socket = io(SOCKET_URL, {
      withCredentials: true // Để cookie httpOnly được gửi kèm
    });
    socketRef.current = socket;

    return () => {
      socket.disconnect();
    };
  }, []);

  return socketRef.current;
}