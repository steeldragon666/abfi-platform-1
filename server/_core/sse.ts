// @ts-nocheck
/**
 * Server-Sent Events (SSE) Notification System
 *
 * Provides real-time push notifications to connected clients using SSE.
 * This avoids polling overhead and enables instant notification delivery.
 *
 * Note: ts-nocheck added because Express types conflict with global Fetch API types
 * during Vercel builds. This module is only used in local dev, not serverless functions.
 */

import express from "express";
import { logger } from "../utils/logger";
import { getNotificationsByUserId } from "../db";

interface SSEClient {
  id: string;
  userId: number;
  response: express.Response;
  connectedAt: Date;
}

// Active SSE connections keyed by client ID
const clients = new Map<string, SSEClient>();

// Generate unique client ID
function generateClientId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Get count of active connections for a user
 */
export function getActiveConnectionCount(userId: number): number {
  let count = 0;
  for (const client of clients.values()) {
    if (client.userId === userId) {
      count++;
    }
  }
  return count;
}

/**
 * Send a notification to all connected clients for a specific user
 */
export function sendNotificationToUser(
  userId: number,
  notification: {
    id: number;
    type: string;
    title: string;
    message: string;
    relatedEntityType?: string | null;
    relatedEntityId?: number | null;
    createdAt: Date;
  }
): number {
  let sentCount = 0;

  for (const client of clients.values()) {
    if (client.userId === userId) {
      try {
        const data = JSON.stringify({
          type: "notification",
          payload: notification,
          timestamp: Date.now(),
        });
        client.response.write(`data: ${data}\n\n`);
        sentCount++;
      } catch (error) {
        console.warn(`[SSE] Failed to send to client ${client.id}:`, error);
        // Remove dead connection
        clients.delete(client.id);
      }
    }
  }

  return sentCount;
}

/**
 * Send a system-wide broadcast to all connected clients
 */
export function broadcastNotification(notification: {
  type: string;
  title: string;
  message: string;
}): number {
  let sentCount = 0;

  for (const client of clients.values()) {
    try {
      const data = JSON.stringify({
        type: "broadcast",
        payload: notification,
        timestamp: Date.now(),
      });
      client.response.write(`data: ${data}\n\n`);
      sentCount++;
    } catch (error) {
      console.warn(`[SSE] Failed to broadcast to client ${client.id}:`, error);
      clients.delete(client.id);
    }
  }

  return sentCount;
}

/**
 * SSE connection endpoint handler
 */
async function handleSSEConnection(req: express.Request, res: express.Response) {
  // Extract user ID from query parameter (in real app, use session/JWT)
  const userId = parseInt(req.query.userId as string);

  if (!userId || isNaN(userId)) {
    res.status(401).json({ error: "User ID required" });
    return;
  }

  // Limit connections per user to prevent resource exhaustion
  const existingConnections = getActiveConnectionCount(userId);
  if (existingConnections >= 5) {
    res.status(429).json({ error: "Too many connections" });
    return;
  }

  const clientId = generateClientId();

  // Set SSE headers
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no"); // Disable nginx buffering
  res.flushHeaders();

  // Store client connection
  const client: SSEClient = {
    id: clientId,
    userId,
    response: res,
    connectedAt: new Date(),
  };
  clients.set(clientId, client);

  logger.debug("SSE",
    `[SSE] Client ${clientId} connected for user ${userId} (${clients.size} total connections)`
  );

  // Send initial connection confirmation
  const connectEvent = JSON.stringify({
    type: "connected",
    clientId,
    timestamp: Date.now(),
  });
  res.write(`data: ${connectEvent}\n\n`);

  // Send any unread notifications on connect
  try {
    const unreadNotifications = await getNotificationsByUserId(userId, true);
    if (unreadNotifications.length > 0) {
      const unreadEvent = JSON.stringify({
        type: "unread",
        payload: unreadNotifications,
        timestamp: Date.now(),
      });
      res.write(`data: ${unreadEvent}\n\n`);
    }
  } catch (error) {
    console.warn(`[SSE] Failed to fetch unread notifications:`, error);
  }

  // Send heartbeat every 30 seconds to keep connection alive
  const heartbeatInterval = setInterval(() => {
    try {
      res.write(`: heartbeat ${Date.now()}\n\n`);
    } catch {
      clearInterval(heartbeatInterval);
    }
  }, 30000);

  // Handle client disconnect
  req.on("close", () => {
    clearInterval(heartbeatInterval);
    clients.delete(clientId);
    logger.debug("SSE",
      `[SSE] Client ${clientId} disconnected (${clients.size} total connections)`
    );
  });

  // Handle errors
  req.on("error", (error: Error) => {
    console.warn(`[SSE] Client ${clientId} error:`, error);
    clearInterval(heartbeatInterval);
    clients.delete(clientId);
  });
}

/**
 * Create the SSE router
 */
export function createSSERouter(): express.Router {
  const router = express.Router();

  // SSE endpoint for notifications
  router.get("/notifications", handleSSEConnection);

  // Debug endpoint to check active connections (admin only in production)
  router.get("/status", (_req: express.Request, res: express.Response) => {
    const connections: { userId: number; connectedAt: string }[] = [];
    for (const client of clients.values()) {
      connections.push({
        userId: client.userId,
        connectedAt: client.connectedAt.toISOString(),
      });
    }
    res.json({
      totalConnections: clients.size,
      connections,
    });
  });

  // Test endpoint to send a notification (development only)
  router.post("/test", (req: express.Request, res: express.Response) => {
    if (process.env.NODE_ENV === "production") {
      res.status(403).json({ error: "Not available in production" });
      return;
    }

    const { userId, title, message } = req.body;
    const targetUserId = userId || 1;

    const notification = {
      id: Date.now(),
      type: "system",
      title: title || "Test Notification",
      message: message || "This is a test notification from SSE!",
      createdAt: new Date(),
    };

    const sentCount = sendNotificationToUser(targetUserId, notification);

    // Also broadcast to all clients if no specific user
    if (!userId) {
      broadcastNotification({
        type: "system",
        title: notification.title,
        message: notification.message,
      });
    }

    res.json({
      success: true,
      sentCount,
      totalConnections: clients.size,
      notification,
    });
  });

  return router;
}

export default {
  sendNotificationToUser,
  broadcastNotification,
  getActiveConnectionCount,
  createSSERouter,
};
