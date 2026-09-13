"use client";

import { createContext, ReactNode, useCallback, useContext, useMemo, useState } from "react";

export type AppNotification = {
  id: string;
  title: string;
  body?: string;
  href?: string;
  tone?: "info" | "success" | "error";
  createdAt: string;
  read: boolean;
};

type AddNotificationInput = Omit<AppNotification, "createdAt" | "read"> & {
  createdAt?: string;
};

type NotificationContextValue = {
  notifications: AppNotification[];
  unreadCount: number;
  addNotification: (notification: AddNotificationInput) => void;
  markAllRead: () => void;
  clearNotifications: () => void;
};

const NotificationContext = createContext<NotificationContextValue | null>(null);
const NOTIFICATION_STORAGE_KEY = "athenaeumNotifications";

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<AppNotification[]>(() => readStoredNotifications());

  const addNotification = useCallback((notification: AddNotificationInput) => {
    setNotifications((current) => {
      const nextNotification: AppNotification = {
        ...notification,
        createdAt: notification.createdAt ?? new Date().toISOString(),
        read: false,
      };
      const withoutDuplicate = current.filter((item) => item.id !== notification.id);

      return writeStoredNotifications([nextNotification, ...withoutDuplicate].slice(0, 20));
    });
  }, []);

  const markAllRead = useCallback(() => {
    setNotifications((current) => writeStoredNotifications(current.map((item) => ({ ...item, read: true }))));
  }, []);

  const clearNotifications = useCallback(() => {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(NOTIFICATION_STORAGE_KEY);
    }

    setNotifications([]);
  }, []);

  const value = useMemo<NotificationContextValue>(
    () => ({
      notifications,
      unreadCount: notifications.filter((item) => !item.read).length,
      addNotification,
      markAllRead,
      clearNotifications,
    }),
    [addNotification, clearNotifications, markAllRead, notifications],
  );

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
}

export function useNotifications() {
  const context = useContext(NotificationContext);

  if (!context) {
    throw new Error("useNotifications must be used inside NotificationProvider.");
  }

  return context;
}

function readStoredNotifications() {
  if (typeof window === "undefined") return [];

  const storedValue = window.localStorage.getItem(NOTIFICATION_STORAGE_KEY);

  if (!storedValue) return [];

  try {
    const parsedValue = JSON.parse(storedValue) as AppNotification[];

    return Array.isArray(parsedValue) ? parsedValue.slice(0, 20) : [];
  } catch {
    return [];
  }
}

function writeStoredNotifications(notifications: AppNotification[]) {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(NOTIFICATION_STORAGE_KEY, JSON.stringify(notifications));
  }

  return notifications;
}
