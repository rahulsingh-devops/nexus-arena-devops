import React, { createContext, useContext, useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { io, Socket } from 'socket.io-client';

interface SocketContextType {
  socket: Socket | null;
  connected: boolean;
  emit: (event: string, ...args: unknown[]) => void;
  on: (event: string, handler: (...args: unknown[]) => void) => void;
  off: (event: string, handler: (...args: unknown[]) => void) => void;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  connected: false,
  emit: () => {},
  on: () => {},
  off: () => {},
});

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

export const SocketProvider: React.FC<{ token: string; children: React.ReactNode }> = ({
  token,
  children,
}) => {
  const socketRef = useRef<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [, setVersion] = useState(0); // force re-render when socket is ready

  useEffect(() => {
    const socket = io(BACKEND_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 10000,
    });

    socket.on('connect', () => {
      console.log('[Socket] Connected:', socket.id);
      setConnected(true);
    });

    socket.on('disconnect', (reason) => {
      console.log('[Socket] Disconnected:', reason);
      setConnected(false);
    });

    socket.on('connect_error', (err) => {
      console.error('[Socket] Connection error:', err.message);
      setConnected(false);
    });

    socketRef.current = socket;
    setVersion(v => v + 1); // trigger re-render so children get the socket

    return () => {
      socket.disconnect();
      socketRef.current = null;
      setConnected(false);
    };
  }, [token]);

  const emit = useCallback((event: string, ...args: unknown[]) => {
    socketRef.current?.emit(event, ...args);
  }, []);

  const on = useCallback((event: string, handler: (...args: unknown[]) => void) => {
    socketRef.current?.on(event, handler);
  }, []);

  const off = useCallback((event: string, handler: (...args: unknown[]) => void) => {
    socketRef.current?.off(event, handler);
  }, []);

  const contextValue = useMemo(() => ({
    socket: socketRef.current,
    connected,
    emit,
    on,
    off,
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [connected, emit, on, off]);

  return (
    <SocketContext.Provider value={contextValue}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
export default useSocket;
