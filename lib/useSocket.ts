'use client';

import { useEffect, useState } from 'react';
import io, { Socket } from 'socket.io-client';

type SocketPayload = Record<string, unknown>;

let socketInstance: Socket | null = null;
const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL?.trim();

export function useSocket(userId: string | null) {
  const [isConnected, setIsConnected] = useState(Boolean(socketInstance?.connected));

  useEffect(() => {
    if (!userId || !SOCKET_URL) {
      setIsConnected(false);
      return;
    }

    if (!socketInstance) {
      socketInstance = io(SOCKET_URL, {
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: 5,
      });

      socketInstance.on('connect_error', () => {
        setIsConnected(false);
      });
    }

    const activeSocket = socketInstance;
    const handleConnect = () => setIsConnected(true);
    const handleDisconnect = () => setIsConnected(false);
    const handleConnectAndJoin = () => activeSocket.emit('join-user-room', userId);

    activeSocket.on('connect', handleConnect);
    activeSocket.on('disconnect', handleDisconnect);
    activeSocket.on('connect', handleConnectAndJoin);

    if (activeSocket.connected) {
      setIsConnected(true);
      activeSocket.emit('join-user-room', userId);
    } else {
      setIsConnected(false);
    }

    return () => {
      activeSocket.off('connect', handleConnect);
      activeSocket.off('disconnect', handleDisconnect);
      activeSocket.off('connect', handleConnectAndJoin);
    };
  }, [userId]);

  return { socket: socketInstance, isConnected };
}

export function joinChat(chatId: string, userId: string) {
  if (socketInstance) {
    socketInstance.emit('join-chat', chatId, userId);
  }
}

export function leaveChat(chatId: string, userId: string) {
  if (socketInstance) {
    socketInstance.emit('leave-chat', chatId, userId);
  }
}

export function sendMessage(chatId: string, messageData: SocketPayload) {
  if (socketInstance) {
    socketInstance.emit('message-sent', { ...messageData, chatId });
  }
}

export function onNewNotification(callback: (notification: SocketPayload) => void) {
  if (socketInstance) {
    socketInstance.on('new-notification', callback);
  }
}

export function onNewMessage(callback: (message: SocketPayload) => void) {
  if (socketInstance) {
    socketInstance.on('new-message', callback);
  }
}

export function onUserTyping(callback: (data: SocketPayload) => void) {
  if (socketInstance) {
    socketInstance.on('user-typing', callback);
  }
}

export function onUserStoppedTyping(callback: (data: SocketPayload) => void) {
  if (socketInstance) {
    socketInstance.on('user-stopped-typing', callback);
  }
}

export function broadcastTyping(chatId: string, userId: string) {
  if (socketInstance) {
    socketInstance.emit('user-typing', { chatId, userId });
  }
}

export function broadcastStoppedTyping(chatId: string, userId: string) {
  if (socketInstance) {
    socketInstance.emit('user-stopped-typing', { chatId, userId });
  }
}
