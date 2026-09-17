/**
 * Notification Bell Component
 * Displays notification count and dropdown with recent notifications
 */

import React, { useState } from "react";
import { BellIcon, EnterIcon, ExitIcon } from "@radix-ui/react-icons";
import {
  Badge,
  Box,
  Button,
  Card,
  Flex,
  Popover,
  ScrollArea,
  Text,
  Separator,
} from "@radix-ui/themes";

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: Date;
  link?: string;
}

interface NotificationBellProps {
  notifications: Notification[];
  unreadCount: number;
  onNotificationClick?: (notification: Notification) => void;
  onMarkAsRead?: (notificationId: string) => void;
  onMarkAllAsRead?: () => void;
  onDelete?: (notificationId: string) => void;
}

const getNotificationColor = (type: string): string => {
  const colorMap: Record<string, string> = {
    INTERNSHIP_VERIFIED: "green",
    INTERNSHIP_REJECTED: "red",
    GRADE_PUBLISHED: "blue",
    AT_RISK_ALERT: "red",
    ASSIGNMENT_DUE_SOON: "orange",
    VERIFICATION_PENDING: "amber",
  };
  return colorMap[type] || "gray";
};

export const NotificationBell: React.FC<NotificationBellProps> = ({
  notifications,
  unreadCount,
  onNotificationClick,
  onMarkAsRead,
  onMarkAllAsRead,
  onDelete,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Popover.Root open={isOpen} onOpenChange={setIsOpen}>
      <Popover.Trigger>
        <Box position="relative" display="inline-block">
          <Button
            variant="ghost"
            size="2"
            style={{ padding: 0, minWidth: "auto", width: 32, height: 32 }}
          >
            <BellIcon width={18} height={18} />
          </Button>
          {unreadCount > 0 && (
            <Badge
              size="1"
              color="red"
              style={{
                position: "absolute",
                top: -6,
                right: -6,
                minWidth: 20,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </Badge>
          )}
        </Box>
      </Popover.Trigger>

      <Popover.Content maxWidth="400px">
        <Flex direction="column" gap="0">
          {/* Header */}
          <Flex justify="between" align="center" p="3" pb="2">
            <Text weight="bold">Notifications</Text>
            {unreadCount > 0 && (
              <Button size="1" variant="ghost" onClick={onMarkAllAsRead}>
                Mark all as read
              </Button>
            )}
          </Flex>

          <Separator size="4" />

          {/* Notifications List */}
          {notifications.length === 0 ? (
            <Flex justify="center" align="center" style={{ height: 200 }}>
              <Text color="gray">No notifications</Text>
            </Flex>
          ) : (
            <ScrollArea style={{ height: 400 }}>
              <Flex direction="column">
                {notifications.map((notification, idx) => (
                  <Box key={notification.id}>
                    <Flex
                      gap="3"
                      p="3"
                      style={{
                        backgroundColor: notification.isRead ? "transparent" : "var(--blue-1)",
                        cursor: "pointer",
                      }}
                      onClick={() => {
                        if (!notification.isRead && onMarkAsRead) {
                          onMarkAsRead(notification.id);
                        }
                        onNotificationClick?.(notification);
                      }}
                    >
                      <Box
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: "50%",
                          backgroundColor: notification.isRead
                            ? "transparent"
                            : "var(--blue-9)",
                          marginTop: 8,
                          flexShrink: 0,
                        }}
                      />

                      <Flex direction="column" gap="1" style={{ flex: 1 }}>
                        <Flex justify="between" align="start">
                          <Text weight="medium" size="2">
                            {notification.title}
                          </Text>
                          <Badge color={getNotificationColor(notification.type)} size="1">
                            {notification.type}
                          </Badge>
                        </Flex>
                        <Text size="1" color="gray">
                          {notification.message}
                        </Text>
                        <Text size="1" color="gray">
                          {new Date(notification.createdAt).toRelativeTime?.() ||
                            new Date(notification.createdAt).toLocaleString()}
                        </Text>
                      </Flex>

                      <Button
                        size="1"
                        variant="ghost"
                        color="red"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDelete?.(notification.id);
                        }}
                      >
                        ×
                      </Button>
                    </Flex>

                    {idx < notifications.length - 1 && <Separator size="4" />}
                  </Box>
                ))}
              </Flex>
            </ScrollArea>
          )}

          <Separator size="4" />

          {/* Footer */}
          <Flex justify="center" p="2">
            <Button variant="ghost" size="1">
              View all notifications
            </Button>
          </Flex>
        </Flex>
      </Popover.Content>
    </Popover.Root>
  );
};
