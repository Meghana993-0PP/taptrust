import { useEffect, useRef } from 'react';
import { createSocket, disconnectSocket } from '../services/socket';
import { useAuth } from '../context/AuthContext';

/**
 * Creates and manages a Socket.io connection tied to the auth token.
 * Returns the socket instance.
 */
export function useSocket() {
  const { token, isAuthenticated } = useAuth();
  const socketRef = useRef(null);

  useEffect(() => {
    if (!isAuthenticated || !token) return;
    socketRef.current = createSocket(token);
    return () => {
      disconnectSocket();
      socketRef.current = null;
    };
  }, [token, isAuthenticated]);

  return socketRef.current;
}
