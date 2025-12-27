/**
 * Notification Provider Component
 *
 * Provides real-time notifications via SSE and integrates with the toast system.
 * Shows toast notifications when new notifications arrive.
 */

import { useEffect, useCallback } from "react";
import { toast } from "sonner";
import { Bell, AlertTriangle, CheckCircle, Info } from "lucide-react";
import { useSSENotifications, type SSENotification } from "@/hooks/useSSENotifications";
import { useAuth } from "@/_core/hooks/useAuth";

// Map notification types to toast variants and icons
const notificationConfig: Record<
  string,
  {
    icon: typeof Bell;
    variant: "default" | "success" | "warning" | "error";
  }
> = {
  inquiry_received: { icon: Bell, variant: "default" },
  inquiry_response: { icon: CheckCircle, variant: "success" },
  certificate_expiring: { icon: AlertTriangle, variant: "warning" },
  transaction_update: { icon: Info, variant: "default" },
  rating_change: { icon: Info, variant: "default" },
  verification_update: { icon: CheckCircle, variant: "success" },
  system_announcement: { icon: Bell, variant: "default" },
};

function getNotificationUrl(notification: SSENotification): string | undefined {
  if (!notification.relatedEntityType || !notification.relatedEntityId) {
    return undefined;
  }

  const entityRoutes: Record<string, string> = {
    inquiry: "/inquiries/supplier",
    feedstock: `/feedstock/${notification.relatedEntityId}`,
    certificate: "/credentials",
    project: `/dashboard/projects/${notification.relatedEntityId}`,
    agreement: `/dashboard/projects/${notification.relatedEntityId}/agreements`,
  };

  return entityRoutes[notification.relatedEntityType];
}

export function NotificationProvider() {
  const { user } = useAuth();
  const userId = user?.id ?? null;

  const handleNotification = useCallback((notification: SSENotification) => {
    const config = notificationConfig[notification.type] || {
      icon: Bell,
      variant: "default" as const,
    };
    const Icon = config.icon;
    const url = getNotificationUrl(notification);

    toast(notification.title, {
      description: notification.message,
      icon: <Icon className="h-4 w-4" />,
      action: url
        ? {
            label: "View",
            onClick: () => {
              window.location.href = url;
            },
          }
        : undefined,
      duration: 5000,
    });
  }, []);

  const handleBroadcast = useCallback(
    (notification: { type: string; title: string; message: string }) => {
      toast(notification.title, {
        description: notification.message,
        icon: <Bell className="h-4 w-4" />,
        duration: 8000,
      });
    },
    []
  );

  const handleConnectionChange = useCallback((isConnected: boolean) => {
    if (!isConnected) {
      // Only show after initial connection attempt fails
      console.log("[NotificationProvider] SSE disconnected");
    }
  }, []);

  const { isConnected, error } = useSSENotifications({
    userId: userId || null,
    onNotification: handleNotification,
    onBroadcast: handleBroadcast,
    onConnectionChange: handleConnectionChange,
    enabled: !!userId,
  });

  // Log connection errors (don't show to user unless persistent)
  useEffect(() => {
    if (error) {
      console.warn("[NotificationProvider] SSE error:", error);
    }
  }, [error]);

  // Debug logging in development
  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      console.log(
        `[NotificationProvider] SSE ${isConnected ? "connected" : "disconnected"} for user ${userId}`
      );
    }
  }, [isConnected, userId]);

  // This component doesn't render anything visible
  return null;
}

export default NotificationProvider;
