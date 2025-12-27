/**
 * Server-Sent Events (SSE) Notifications Hook
 *
 * Provides real-time notification updates via SSE connection.
 * Automatically reconnects on disconnect and handles connection state.
 *
 * @example
 * ```tsx
 * const { isConnected, unreadCount, notifications } = useSSENotifications({
 *   userId: currentUser.id,
 *   onNotification: (notification) => {
 *     toast(notification.title, { description: notification.message });
 *   },
 * });
 * ```
 */

import { useCallback, useEffect, useRef, useState } from "react";

export interface SSENotification {
  id: number;
  type: string;
  title: string;
  message: string;
  relatedEntityType?: string | null;
  relatedEntityId?: number | null;
  createdAt: string;
  read?: boolean;
}

interface SSEMessage {
  type: "connected" | "notification" | "broadcast" | "unread";
  clientId?: string;
  payload?: SSENotification | SSENotification[];
  timestamp: number;
}

interface UseSSENotificationsOptions {
  /** User ID for the SSE connection */
  userId: number | null;
  /** Callback when a new notification is received */
  onNotification?: (notification: SSENotification) => void;
  /** Callback when a broadcast message is received */
  onBroadcast?: (notification: { type: string; title: string; message: string }) => void;
  /** Callback when unread notifications are loaded */
  onUnreadLoaded?: (notifications: SSENotification[]) => void;
  /** Callback when connection state changes */
  onConnectionChange?: (isConnected: boolean) => void;
  /** Whether to enable the SSE connection (default: true) */
  enabled?: boolean;
  /** Reconnect delay in milliseconds (default: 3000) */
  reconnectDelay?: number;
  /** Maximum reconnect attempts (default: 5) */
  maxReconnectAttempts?: number;
}

interface UseSSENotificationsResult {
  /** Whether the SSE connection is active */
  isConnected: boolean;
  /** Number of unread notifications */
  unreadCount: number;
  /** Recent notifications received via SSE */
  notifications: SSENotification[];
  /** Manually reconnect to SSE */
  reconnect: () => void;
  /** Disconnect from SSE */
  disconnect: () => void;
  /** Clear notification from local state */
  markAsRead: (notificationId: number) => void;
  /** Connection error if any */
  error: string | null;
}

export function useSSENotifications({
  userId,
  onNotification,
  onBroadcast,
  onUnreadLoaded,
  onConnectionChange,
  enabled = true,
  reconnectDelay = 3000,
  maxReconnectAttempts = 5,
}: UseSSENotificationsOptions): UseSSENotificationsResult {
  const [isConnected, setIsConnected] = useState(false);
  const [notifications, setNotifications] = useState<SSENotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    setIsConnected(false);
  }, []);

  const connect = useCallback(() => {
    if (!userId || !enabled) {
      disconnect();
      return;
    }

    // Close existing connection
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    setError(null);

    try {
      const eventSource = new EventSource(`/api/sse/notifications?userId=${userId}`);
      eventSourceRef.current = eventSource;

      eventSource.onopen = () => {
        console.log("[SSE] Connection opened");
        setIsConnected(true);
        setError(null);
        reconnectAttemptsRef.current = 0;
        onConnectionChange?.(true);
      };

      eventSource.onmessage = (event) => {
        try {
          const message: SSEMessage = JSON.parse(event.data);

          switch (message.type) {
            case "connected":
              console.log("[SSE] Connected with client ID:", message.clientId);
              break;

            case "notification":
              if (message.payload && !Array.isArray(message.payload)) {
                const notification = message.payload;
                setNotifications((prev) => [notification, ...prev].slice(0, 50));
                setUnreadCount((prev) => prev + 1);
                onNotification?.(notification);
              }
              break;

            case "broadcast":
              if (message.payload && !Array.isArray(message.payload)) {
                onBroadcast?.(message.payload as { type: string; title: string; message: string });
              }
              break;

            case "unread":
              if (message.payload && Array.isArray(message.payload)) {
                setNotifications(message.payload);
                setUnreadCount(message.payload.filter((n) => !n.read).length);
                onUnreadLoaded?.(message.payload);
              }
              break;
          }
        } catch (parseError) {
          console.warn("[SSE] Failed to parse message:", parseError);
        }
      };

      eventSource.onerror = () => {
        console.warn("[SSE] Connection error");
        setIsConnected(false);
        onConnectionChange?.(false);

        // Attempt reconnection
        if (reconnectAttemptsRef.current < maxReconnectAttempts) {
          reconnectAttemptsRef.current++;
          const delay = reconnectDelay * Math.pow(1.5, reconnectAttemptsRef.current - 1);
          console.log(
            `[SSE] Reconnecting in ${delay}ms (attempt ${reconnectAttemptsRef.current}/${maxReconnectAttempts})`
          );

          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, delay);
        } else {
          setError("Unable to establish real-time connection. Notifications may be delayed.");
        }
      };
    } catch (createError) {
      console.error("[SSE] Failed to create EventSource:", createError);
      setError("Failed to connect to notification service");
    }
  }, [
    userId,
    enabled,
    reconnectDelay,
    maxReconnectAttempts,
    disconnect,
    onNotification,
    onBroadcast,
    onUnreadLoaded,
    onConnectionChange,
  ]);

  const reconnect = useCallback(() => {
    reconnectAttemptsRef.current = 0;
    connect();
  }, [connect]);

  const markAsRead = useCallback((notificationId: number) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
  }, []);

  // Connect on mount, disconnect on unmount
  useEffect(() => {
    if (userId && enabled) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [userId, enabled, connect, disconnect]);

  // Update connection state callback
  useEffect(() => {
    onConnectionChange?.(isConnected);
  }, [isConnected, onConnectionChange]);

  return {
    isConnected,
    unreadCount,
    notifications,
    reconnect,
    disconnect,
    markAsRead,
    error,
  };
}

export default useSSENotifications;
