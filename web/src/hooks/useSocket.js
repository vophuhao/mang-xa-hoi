import { useEffect, useRef, useCallback, useState, useContext } from "react";

import { io } from "socket.io-client";

import SocketContext from "@/contexts/SocketContext";

const DEFAULT_URL = import.meta.env.VITE_WS_URL || import.meta.env.VITE_API_URL || "http://localhost:5555";

export default function useSocket({ token, userId } = {}) {
  const socketRef = useRef(null);
  const [socket, setSocket] = useState(null);
  const ownerRef = useRef(false);
  const ctxSocket = useContext(SocketContext);

  const connect = useCallback(() => {
    if (socketRef.current && socketRef.current.connected) {
      setSocket(socketRef.current);
      return socketRef.current;
    }

    const s = io(DEFAULT_URL, {
      auth: { token },
      transports: ["websocket"],
      reconnectionAttempts: 5,
      withCredentials: true,
    });

    socketRef.current = s;
    ownerRef.current = true;
    setSocket(s);

    s.on("connect", () => {
      console.log("[useSocket] connected id=", s.id, "userId=", userId);
      if (userId) s.emit("register", { userId });
    });

    s.on("disconnect", (reason) => {
      console.log("[useSocket] disconnected:", reason);
    });

    s.on("connect_error", (err) => {
      console.warn("[useSocket] connect_error:", err);
    });

    return s;
  }, [token, userId]);

  useEffect(() => {
    if (ctxSocket) return;
    if (!token && !userId) return;
    const s = connect();
    return () => {
      if (ownerRef.current) {
        try { s?.disconnect(); } catch (e) { console.warn("[useSocket] disconnect error", e); }
        socketRef.current = null;
        ownerRef.current = false;
        setSocket(null);
      }
    };
  }, [connect, token, userId, ctxSocket]);

  const emit = useCallback((event, ...args) => {
    if (ctxSocket) return ctxSocket.emit(event, ...args);
    if (!socketRef.current) connect();
    if (!socketRef.current) return;
    socketRef.current.emit(event, ...args);
  }, [connect, ctxSocket]);

  const on = useCallback((event, handler) => {
    if (ctxSocket) return ctxSocket.on(event, handler);
    if (!socketRef.current) connect();
    const tryRegister = () => {
      if (!socketRef.current) {
        setTimeout(tryRegister, 50);
        return;
      }
      socketRef.current.on(event, handler);
    };
    tryRegister();
  }, [connect, ctxSocket]);

  const off = useCallback((event, handler) => {
    if (ctxSocket) return ctxSocket.off(event, handler);
    if (!socketRef.current) return;
    socketRef.current.off(event, handler);
  }, [ctxSocket]);

  const disconnect = useCallback(() => {
    if (ctxSocket) return;
    if (!ownerRef.current) return;
    try { socketRef.current?.disconnect(); } catch (e) { console.warn("[useSocket] disconnect error", e); }
    socketRef.current = null;
    ownerRef.current = false;
    setSocket(null);
  }, [ctxSocket]);

  if (ctxSocket) {
    return {
      socket: ctxSocket,
      connect: () => ctxSocket,
      disconnect: () => {},
      emit: (event, ...args) => ctxSocket.emit(event, ...args),
      on: (event, handler) => ctxSocket.on(event, handler),
      off: (event, handler) => ctxSocket.off(event, handler),
      isConnected: () => !!ctxSocket?.connected,
    };
  }

  return {
    socket,
    connect,
    disconnect,
    emit,
    on,
    off,
    isConnected: () => !!socketRef.current?.connected,
  };
}