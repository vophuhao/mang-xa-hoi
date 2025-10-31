import { useState, useEffect, useCallback, useRef } from 'react';

import useAuth from './useAuth';
import useSocket from './useSocket';

export default function useOnlineUsers() {
  const { user } = useAuth();
  const userId = user?.data?._id;
  const token = user?.token || user?.data?.token;
  
  const { socket, on, off, emit } = useSocket({ token, userId });
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  
  // ✅ FIX: Add ref to track if initial request was made
  const initialRequestMade = useRef(false);

  const requestOnlineUsers = useCallback(() => {
    if (socket) {
      console.log('[ONLINE] Requesting online users list...');
      emit('getOnlineUsers');
    }
  }, [socket, emit]);

  useEffect(() => {
    if (!socket || !userId) return;

    console.log('[ONLINE] Setting up online users listeners');

    const handleOnlineUsers = (users) => {
      console.log('[ONLINE] Received online users from server:', users);
      setOnlineUsers(new Set(users));
    };

    const handleUserOnline = (onlineUserId) => {
      console.log('[ONLINE] User came online:', onlineUserId);
      setOnlineUsers(prev => new Set([...prev, onlineUserId]));
    };

    const handleUserOffline = (offlineUserId) => {
      console.log('[ONLINE] User went offline:', offlineUserId);
      setOnlineUsers(prev => {
        const newSet = new Set(prev);
        newSet.delete(offlineUserId);
        return newSet;
      });
    };

    // Register listeners
    on('onlineUsers', handleOnlineUsers);
    on('user_online', handleUserOnline);
    on('user_offline', handleUserOffline);

    // ✅ FIX: Only request once when socket is ready
    if (!initialRequestMade.current) {
      requestOnlineUsers();
      initialRequestMade.current = true;
    }

    return () => {
      off('onlineUsers', handleOnlineUsers);
      off('user_online', handleUserOnline);
      off('user_offline', handleUserOffline);
    };
  }, [socket, on, off, userId]); // ✅ REMOVE requestOnlineUsers from dependencies

  const isUserOnline = useCallback((checkUserId) => {
    const isOnline = onlineUsers.has(checkUserId);
    console.log(`[ONLINE CHECK] User ${checkUserId} is ${isOnline ? 'online' : 'offline'}`);
    return isOnline;
  }, [onlineUsers]);

  // Debug log
  useEffect(() => {
    console.log('[ONLINE STATE] Current online users:', Array.from(onlineUsers));
  }, [onlineUsers]);

  return {
    onlineUsers: Array.from(onlineUsers),
    isUserOnline,
    requestOnlineUsers, // Keep this for manual refresh if needed
  };
}