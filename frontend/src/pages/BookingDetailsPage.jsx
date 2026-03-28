import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";

import {
  apiRequest,
  clearCachedValuesByPrefix,
  readCachedValue,
  writeCachedValue,
} from "../api/client";
import ChatBox from "../components/chat/ChatBox";
import Loader from "../components/Loader";
import { useAppContext } from "../context/AppContext";

const BOOKING_CACHE_TTL = 1000 * 60 * 10;

function getBookingCacheKey(bookingId, viewerId) {
  return `booking-details:${bookingId}:${viewerId || "guest"}`;
}

function formatDate(value) {
  return value ? new Date(value).toLocaleDateString("en-IN") : "Schedule pending";
}

function formatDateTime(date, time) {
  if (!date && !time) {
    return "Schedule pending";
  }

  if (!date) {
    return time;
  }

  return `${formatDate(date)}${time ? ` at ${time}` : ""}`;
}

function formatCurrency(value) {
  return `INR ${Number(value || 0).toLocaleString("en-IN")}`;
}

function getStatusLabel(status) {
  if (!status) {
    return "Pending";
  }

  return status.charAt(0).toUpperCase() + status.slice(1);
}

function getWorkspaceLink(role) {
  if (role === "admin") {
    return {
      to: "/admin/bookings",
      label: "Back to admin bookings",
    };
  }

  if (role === "provider") {
    return {
      to: "/provider/bookings",
      label: "Back to provider bookings",
    };
  }

  return {
    to: "/customer/bookings",
    label: "Back to my bookings",
  };
}

function getProviderStatusActions(isProviderViewer, status) {
  if (!isProviderViewer) {
    return [];
  }

  if (status === "pending") {
    return ["accepted", "rejected"];
  }

  if (status === "accepted") {
    return ["completed", "rejected"];
  }

  return [];
}

export default function BookingDetailsPage() {
  const { bookingId } = useParams();
  const location = useLocation();
  const { currentUser, sessionLoading, showNotice } = useAppContext();
  const cacheKey = useMemo(
    () => (bookingId ? getBookingCacheKey(bookingId, currentUser?.id) : null),
    [bookingId, currentUser?.id],
  );
  const [booking, setBooking] = useState(() =>
    cacheKey ? readCachedValue(cacheKey, BOOKING_CACHE_TTL) : null,
  );
  const [loading, setLoading] = useState(() =>
    cacheKey ? !readCachedValue(cacheKey, BOOKING_CACHE_TTL) : false,
  );
  const [updatingStatus, setUpdatingStatus] = useState("");
  const workspaceLink = getWorkspaceLink(currentUser?.role);
  const providerName = booking?.service?.owner?.username || "Provider";
  const customerName = booking?.user?.username || "Customer";
  const isCustomerViewer =
    currentUser?.role === "customer" && booking?.user?.id === currentUser?.id;
  const isProviderViewer =
    currentUser?.role === "provider" && booking?.service?.owner?.id === currentUser?.id;
  const canUseChat = isCustomerViewer || isProviderViewer;
  const statusActions = getProviderStatusActions(isProviderViewer, booking?.status);

  useEffect(() => {
    let isActive = true;

    const loadBooking = async () => {
      if (sessionLoading) {
        return;
      }

      if (!bookingId || !currentUser) {
        if (isActive) {
          setBooking(null);
          setLoading(false);
        }
        return;
      }

      const cachedBooking = cacheKey ? readCachedValue(cacheKey, BOOKING_CACHE_TTL) : null;

      if (cachedBooking) {
        setBooking(cachedBooking);
        setLoading(false);
      } else {
        setLoading(true);
      }

      try {
        const response = await apiRequest(`/api/bookings/${bookingId}`);
        if (!isActive) {
          return;
        }

        setBooking(response.booking);
        if (cacheKey) {
          writeCachedValue(cacheKey, response.booking);
        }
      } catch (error) {
        if (!cachedBooking && isActive) {
          showNotice("error", error.message);
        }
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    };

    loadBooking();

    return () => {
      isActive = false;
    };
  }, [bookingId, cacheKey, currentUser, sessionLoading, showNotice]);

  const handleStatusChange = async (status) => {
    if (!booking || !currentUser) {
      return;
    }

    setUpdatingStatus(status);

    try {
      const response = await apiRequest(`/api/provider/bookings/${booking.id}/status`, {
        method: "PATCH",
        body: { status },
      });

      clearCachedValuesByPrefix(`provider:${currentUser.id}:`);
      if (response.booking?.user?.id) {
        clearCachedValuesByPrefix(`customer:${response.booking.user.id}:`);
      }
      clearCachedValuesByPrefix("admin:");
      clearCachedValuesByPrefix(`booking-confirm:${booking.id}`);
      clearCachedValuesByPrefix(`booking-details:${booking.id}:`);

      setBooking(response.booking);
      if (cacheKey) {
        writeCachedValue(cacheKey, response.booking);
      }

      showNotice("success", "Booking status updated.");
    } catch (error) {
      showNotice("error", error.message);
    } finally {
      setUpdatingStatus("");
    }
  };

  useEffect(() => {
    if (!booking || !canUseChat || location.hash !== "#booking-chat") {
      return undefined;
    }

    const frameId = window.requestAnimationFrame(() => {
      document
        .getElementById("booking-chat")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    });

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, [booking, canUseChat, location.hash]);

  if (sessionLoading || loading) {
    return <Loader label="Loading booking details..." />;
  }

  if (!currentUser) {
    return (
      <section className="page-shell">
        <div className="empty-panel">
          Please <Link to="/login">log in</Link> to view this booking.
        </div>
      </section>
    );
  }

  if (!booking) {
    return (
      <section className="page-shell">
        <div className="empty-panel">
          Booking details are not available right now. <Link to={workspaceLink.to}>{workspaceLink.label}</Link>.
        </div>
      </section>
    );
  }

  return (
    <section className="page-shell">
      <div className="page-hero booking-confirm-panel">
        <div className="booking-confirm-panel__copy">
          <span className="eyebrow">Booking details</span>
          <h1>{booking.service?.title || "LocalFix booking"}</h1>
          <p>
            Review the schedule, status, notes, and account context for this booking from one
            place.
          </p>
        </div>

        <div className="booking-confirm-panel__status">
          <span className={`status-pill status-pill-${booking.status || "pending"}`}>
            {getStatusLabel(booking.status)}
          </span>
          <strong>{formatDateTime(booking.date, booking.time)}</strong>
          <small>{booking.service?.location || "Local service area"}</small>
        </div>
      </div>

      <div className="detail-layout">
        <div className="detail-main">
          <article className="detail-section-card">
            <div className="section-heading">
              <span className="eyebrow">Booking snapshot</span>
              <h2>Everything attached to this request</h2>
            </div>

            <div className="detail-highlight-grid">
              <article className="detail-highlight-card">
                <span>Status</span>
                <strong>{getStatusLabel(booking.status)}</strong>
              </article>
              <article className="detail-highlight-card">
                <span>Scheduled</span>
                <strong>{formatDateTime(booking.date, booking.time)}</strong>
              </article>
              <article className="detail-highlight-card">
                <span>Quote</span>
                <strong>{formatCurrency(booking.service?.price)}</strong>
              </article>
            </div>

            <div className="list-stack">
              <article className="list-card list-card-wide">
                <div>
                  <strong>Booking ID</strong>
                  <small>{booking.id}</small>
                </div>
                <div>
                  <strong>Created</strong>
                  <small>{formatDate(booking.createdAt)}</small>
                </div>
              </article>

              <article className="list-card list-card-wide">
                <div>
                  <strong>Customer</strong>
                  <small>{customerName}</small>
                </div>
                <div>
                  <strong>Provider</strong>
                  <small>{providerName}</small>
                </div>
              </article>

              <article className="list-card list-card-wide">
                <div>
                  <strong>Service</strong>
                  <small>{booking.service?.title || "Booked service"}</small>
                </div>
                <div>
                  <strong>Location</strong>
                  <small>{booking.service?.location || "Shared on request"}</small>
                </div>
              </article>

              <article className="list-card">
                <div>
                  <strong>Notes</strong>
                  <small>{booking.notes || "No additional notes were added to this request."}</small>
                </div>
              </article>
            </div>
          </article>

          {statusActions.length ? (
            <article className="detail-section-card">
              <div className="section-heading">
                <span className="eyebrow">Provider controls</span>
                <h2>Update the booking workflow</h2>
              </div>

              <div className="dashboard-action-row">
                {statusActions.map((status) => (
                  <button
                    key={status}
                    type="button"
                    className="button button-secondary"
                    onClick={() => handleStatusChange(status)}
                    disabled={Boolean(updatingStatus)}
                  >
                    {updatingStatus === status
                      ? "Updating..."
                      : `Mark ${getStatusLabel(status)}`}
                  </button>
                ))}
              </div>
            </article>
          ) : null}

          {canUseChat ? <ChatBox bookingId={booking.id} anchorId="booking-chat" /> : null}
        </div>

        <aside className="detail-sidebar">
          <article className="detail-sidebar-card detail-sidebar-card-primary">
            <span className="eyebrow">Quick summary</span>
            <div className="detail-sidebar__list">
              <div>
                <span>1</span>
                <strong>{customerName}</strong>
              </div>
              <div>
                <span>2</span>
                <strong>{providerName}</strong>
              </div>
              <div>
                <span>3</span>
                <strong>{formatCurrency(booking.service?.price)}</strong>
              </div>
            </div>
          </article>

          <article className="detail-sidebar-card detail-sidebar-card-muted">
            <div className="section-heading">
              <span className="eyebrow">Go next</span>
              <h2>Move through the workspace</h2>
            </div>

            <div className="stack-form">
              <Link className="button button-primary" to={workspaceLink.to}>
                {workspaceLink.label}
              </Link>
              <Link className="button button-secondary" to={`/services/${booking.service?.id}`}>
                View service
              </Link>
            </div>
          </article>
        </aside>
      </div>
    </section>
  );
}
