import {
  createContext,
  startTransition,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  apiRequest,
  clearCachedValue,
  clearCachedValuesByPrefix,
  readCachedValue,
  writeCachedValue,
} from "../api/client";
import { connectSocket, disconnectSocket } from "../services/socket";

const AppContext = createContext(null);
const SESSION_CACHE_KEY = "session-user";
const SESSION_CACHE_TTL = 1000 * 60 * 30;
const NOTIFICATION_LIMIT = 12;

export function AppProvider({ children }) {
  const cachedUserRef = useRef(readCachedValue(SESSION_CACHE_KEY, SESSION_CACHE_TTL));
  const [currentUser, setCurrentUser] = useState(() => cachedUserRef.current);
  const [sessionLoading, setSessionLoading] = useState(() => !cachedUserRef.current);
  const [notice, setNotice] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [socketConnected, setSocketConnected] = useState(false);

  const showNotice = useCallback((type, message) => {
    setNotice({
      id: Date.now(),
      type,
      message,
    });
  }, []);

  const clearNotice = useCallback(() => {
    setNotice(null);
  }, []);

  const refreshSession = useCallback(async ({ background = false } = {}) => {
    if (!background) {
      setSessionLoading(true);
    }

    try {
      const data = await apiRequest("/api/auth/session");

      startTransition(() => {
        setCurrentUser(data.user);
      });

      if (data.user) {
        writeCachedValue(SESSION_CACHE_KEY, data.user);
      } else {
        clearCachedValue(SESSION_CACHE_KEY);
      }
    } catch (error) {
      startTransition(() => {
        setCurrentUser(null);
      });
      clearCachedValue(SESSION_CACHE_KEY);
    } finally {
      setSessionLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshSession({ background: Boolean(cachedUserRef.current) });
  }, [refreshSession]);

  const refreshNotifications = useCallback(
    async ({ background = false } = {}) => {
      if (!currentUser) {
        setNotifications([]);
        setNotificationsLoading(false);
        return;
      }

      if (!background) {
        setNotificationsLoading(true);
      }

      try {
        const data = await apiRequest(`/api/notifications?limit=${NOTIFICATION_LIMIT}`);
        startTransition(() => {
          setNotifications(data.notifications || []);
        });
      } catch (error) {
        if (!background) {
          showNotice("error", error.message);
        }
      } finally {
        setNotificationsLoading(false);
      }
    },
    [currentUser, showNotice],
  );

  const markNotificationRead = useCallback(
    async (notificationId) => {
      try {
        const data = await apiRequest(`/api/notifications/${notificationId}/read`, {
          method: "PATCH",
        });

        startTransition(() => {
          setNotifications((current) =>
            current.map((notification) =>
              notification.id === notificationId ? data.notification : notification,
            ),
          );
        });
      } catch (error) {
        showNotice("error", error.message);
      }
    },
    [showNotice],
  );

  const markAllNotificationsRead = useCallback(async () => {
    try {
      await apiRequest("/api/notifications/read-all", {
        method: "POST",
      });

      startTransition(() => {
        setNotifications((current) =>
          current.map((notification) => ({
            ...notification,
            read: true,
            readAt: notification.readAt || new Date().toISOString(),
          })),
        );
      });
    } catch (error) {
      showNotice("error", error.message);
    }
  }, [showNotice]);

  useEffect(() => {
    if (sessionLoading) {
      return undefined;
    }

    if (!currentUser) {
      setNotifications([]);
      setNotificationsLoading(false);
      setSocketConnected(false);
      disconnectSocket();
      return undefined;
    }

    refreshNotifications();

    const socket = connectSocket();

    const handleConnect = () => {
      setSocketConnected(true);
    };

    const handleDisconnect = () => {
      setSocketConnected(false);
    };

    const handleIncomingNotification = ({ notification }) => {
      if (!notification) {
        return;
      }

      startTransition(() => {
        setNotifications((current) => {
          const nextNotifications = [
            notification,
            ...current.filter((item) => item.id !== notification.id),
          ];

          return nextNotifications.slice(0, NOTIFICATION_LIMIT);
        });
      });

      if (notification.kind === "booking_created" || notification.kind === "booking_status_updated") {
        clearCachedValuesByPrefix("customer:");
        clearCachedValuesByPrefix("provider:");
        clearCachedValuesByPrefix("admin:");
        clearCachedValuesByPrefix("booking-details:");
        showNotice("info", notification.title);
      }
    };

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("notification:new", handleIncomingNotification);

    if (socket.connected) {
      setSocketConnected(true);
    }

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("notification:new", handleIncomingNotification);
      disconnectSocket();
      setSocketConnected(false);
    };
  }, [currentUser, refreshNotifications, sessionLoading, showNotice]);

  const unreadNotificationsCount = useMemo(
    () => notifications.filter((notification) => !notification.read).length,
    [notifications],
  );

  const value = useMemo(
    () => ({
      clearNotice,
      currentUser,
      markAllNotificationsRead,
      markNotificationRead,
      notice,
      notifications,
      notificationsLoading,
      refreshNotifications,
      refreshSession,
      sessionLoading,
      setCurrentUser,
      showNotice,
      socketConnected,
      unreadNotificationsCount,
    }),
    [
      clearNotice,
      currentUser,
      markAllNotificationsRead,
      markNotificationRead,
      notice,
      notifications,
      notificationsLoading,
      refreshNotifications,
      refreshSession,
      sessionLoading,
      showNotice,
      socketConnected,
      unreadNotificationsCount,
    ],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppContext() {
  const value = useContext(AppContext);

  if (!value) {
    throw new Error("useAppContext must be used inside AppProvider.");
  }

  return value;
}
