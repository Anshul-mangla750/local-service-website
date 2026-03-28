import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";

import { apiRequest, readCachedValue, writeCachedValue } from "../api/client";
import Loader from "../components/Loader";
import { useAppContext } from "../context/AppContext";

const BOOKING_CACHE_TTL = 1000 * 60 * 10;

export default function BookingConfirmPage() {
  const location = useLocation();
  const { bookingId } = useParams();
  const { currentUser, sessionLoading, showNotice } = useAppContext();
  const bookingFromState = location.state?.booking || null;
  const cacheKey = useMemo(
    () => (bookingId ? `booking-confirm:${bookingId}` : null),
    [bookingId],
  );
  const [booking, setBooking] = useState(() => {
    if (bookingFromState) {
      return bookingFromState;
    }

    return cacheKey ? readCachedValue(cacheKey, BOOKING_CACHE_TTL) : null;
  });
  const [loading, setLoading] = useState(() => !bookingFromState && Boolean(bookingId));

  useEffect(() => {
    if (bookingFromState && cacheKey) {
      writeCachedValue(cacheKey, bookingFromState);
    }
  }, [bookingFromState, cacheKey]);

  useEffect(() => {
    let isActive = true;

    const loadBooking = async () => {
      if (!bookingId || bookingFromState || sessionLoading || !currentUser) {
        setLoading(false);
        return;
      }

      const cachedBooking = cacheKey ? readCachedValue(cacheKey, BOOKING_CACHE_TTL) : null;

      if (cachedBooking) {
        setBooking(cachedBooking);
        setLoading(false);
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
  }, [bookingFromState, bookingId, cacheKey, currentUser, sessionLoading, showNotice]);

  if (sessionLoading || loading) {
    return <Loader label="Loading booking confirmation..." />;
  }

  if (!booking) {
    return (
      <section className="page-shell">
        <div className="empty-panel">
          Booking details are not available right now. <Link to="/customer/bookings">Open your bookings</Link>.
        </div>
      </section>
    );
  }

  return (
    <section className="page-shell">
      <div className="page-hero booking-confirm-panel">
        <div className="booking-confirm-panel__copy">
          <span className="eyebrow">Booking confirmed in LocalFix</span>
          <h1>Your request is now in the provider queue</h1>
          <p>
            LocalFix has saved your booking details and the provider can now review the request,
            confirm the slot, and continue the job flow.
          </p>
        </div>

        <div className="booking-confirm-panel__status">
          <span className={`status-pill status-pill-${booking.status}`}>
            {booking.status.replace("_", " ")}
          </span>
          <strong>{booking.service?.title}</strong>
          <small>{booking.service?.location || "Local service area"}</small>
        </div>
      </div>

      <div className="detail-layout">
        <div className="detail-main">
          <article className="detail-section-card">
            <div className="section-heading">
              <span className="eyebrow">Booking snapshot</span>
              <h2>Everything saved for this request</h2>
            </div>

            <div className="detail-highlight-grid">
              <article className="detail-highlight-card">
                <span>Service</span>
                <strong>{booking.service?.title || "Booked service"}</strong>
              </article>
              <article className="detail-highlight-card">
                <span>Date</span>
                <strong>{new Date(booking.date).toLocaleDateString()}</strong>
              </article>
              <article className="detail-highlight-card">
                <span>Time slot</span>
                <strong>{booking.time}</strong>
              </article>
            </div>

            <div className="list-stack">
              <article className="list-card list-card-wide">
                <div>
                  <strong>Booking ID</strong>
                  <small>{booking.id}</small>
                </div>
                <div>
                  <strong>Provider</strong>
                  <small>{booking.service?.owner?.username || "Assigned provider"}</small>
                </div>
              </article>

              <article className="list-card">
                <div>
                  <strong>Request notes</strong>
                  <small>{booking.notes || "No additional notes were added."}</small>
                </div>
              </article>
            </div>
          </article>
        </div>

        <aside className="detail-sidebar">
          <article className="detail-sidebar-card detail-sidebar-card-primary">
            <span className="eyebrow">Next steps</span>
            <div className="detail-sidebar__list">
              <div>
                <span>1</span>
                <strong>Provider reviews the request</strong>
              </div>
              <div>
                <span>2</span>
                <strong>Status updates appear in your dashboard</strong>
              </div>
              <div>
                <span>3</span>
                <strong>Review the job after completion</strong>
              </div>
            </div>
          </article>

          <article className="detail-sidebar-card detail-sidebar-card-muted">
            <div className="section-heading">
              <span className="eyebrow">Go next</span>
              <h2>Keep moving in LocalFix</h2>
            </div>

            <div className="stack-form">
              <Link className="button button-primary" to={`/customer/bookings/${booking.id}`}>
                View booking details
              </Link>
              <Link className="button button-primary" to="/customer/bookings">
                Open my bookings
              </Link>
              <Link className="button button-secondary" to="/search">
                Find more services
              </Link>
            </div>
          </article>
        </aside>
      </div>
    </section>
  );
}
