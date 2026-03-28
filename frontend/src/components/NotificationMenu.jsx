import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";

import { useAppContext } from "../context/AppContext";

function formatNotificationTime(value) {
  if (!value) {
    return "Just now";
  }

  const date = new Date(value);
  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));

  if (diffMinutes < 1) {
    return "Just now";
  }

  if (diffMinutes < 60) {
    return `${diffMinutes}m ago`;
  }

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) {
    return `${diffHours}h ago`;
  }

  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
  });
}

export default function NotificationMenu() {
  const menuRef = useRef(null);
  const [open, setOpen] = useState(false);
  const {
    notifications,
    notificationsLoading,
    markAllNotificationsRead,
    markNotificationRead,
    socketConnected,
    unreadNotificationsCount,
  } = useAppContext();

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const handlePointerDown = (event) => {
      if (!menuRef.current?.contains(event.target)) {
        setOpen(false);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    window.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  const handleNotificationOpen = async (notificationId) => {
    await markNotificationRead(notificationId);
    setOpen(false);
  };

  return (
    <div ref={menuRef} className="notification-menu">
      <button
        type="button"
        className={open ? "notification-trigger is-open" : "notification-trigger"}
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
        aria-label="Open notifications"
      >
        <span className={socketConnected ? "notification-trigger__dot is-live" : "notification-trigger__dot"} />
        <span>Notifications</span>
        {unreadNotificationsCount ? (
          <strong className="notification-trigger__count">{unreadNotificationsCount}</strong>
        ) : null}
      </button>

      {open ? (
        <div className="notification-panel">
          <div className="notification-panel__header">
            <div>
              <strong>Realtime updates</strong>
              <small>{socketConnected ? "Live connection active" : "Reconnecting..."}</small>
            </div>
            <button
              type="button"
              className="button button-ghost"
              onClick={markAllNotificationsRead}
              disabled={!unreadNotificationsCount}
            >
              Mark all read
            </button>
          </div>

          <div className="notification-panel__list">
            {notificationsLoading ? <div className="notification-empty">Loading notifications...</div> : null}

            {!notificationsLoading && !notifications.length ? (
              <div className="notification-empty">
                New booking updates and chat alerts will appear here.
              </div>
            ) : null}

            {notifications.map((notification) =>
              notification.link ? (
                <Link
                  key={notification.id}
                  className={notification.read ? "notification-card is-read" : "notification-card"}
                  to={notification.link}
                  onClick={() => handleNotificationOpen(notification.id)}
                >
                  <div className="notification-card__top">
                    <strong>{notification.title}</strong>
                    <span>{formatNotificationTime(notification.createdAt)}</span>
                  </div>
                  <p>{notification.message}</p>
                </Link>
              ) : (
                <button
                  key={notification.id}
                  type="button"
                  className={notification.read ? "notification-card is-read" : "notification-card"}
                  onClick={() => handleNotificationOpen(notification.id)}
                >
                  <div className="notification-card__top">
                    <strong>{notification.title}</strong>
                    <span>{formatNotificationTime(notification.createdAt)}</span>
                  </div>
                  <p>{notification.message}</p>
                </button>
              ),
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
