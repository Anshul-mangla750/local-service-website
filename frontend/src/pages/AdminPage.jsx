import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { apiRequest, readCachedValue, writeCachedValue } from "../api/client";
import DashboardShell from "../components/DashboardShell";
import Loader from "../components/Loader";
import { useAppContext } from "../context/AppContext";

const ADMIN_CACHE_TTL = 1000 * 60 * 3;

const sectionConfig = {
  overview: {
    endpoint: "/api/admin/stats",
    title: "Admin operations",
    description: "Track marketplace health, bookings, providers, and service quality signals.",
  },
  users: {
    endpoint: "/api/admin/users",
    title: "Users and roles",
    description: "Review customers, providers, and admins across the LocalFix marketplace.",
  },
  services: {
    endpoint: "/api/admin/services",
    title: "Service oversight",
    description: "Audit listings, booking volume, and review activity across service categories.",
  },
  bookings: {
    endpoint: "/api/admin/bookings",
    title: "Bookings oversight",
    description: "Review marketplace booking volume, request statuses, and recent service demand.",
  },
  disputes: {
    endpoint: "/api/admin/disputes",
    title: "Dispute signals",
    description: "Watch rejected bookings and low-rated reviews that may need intervention.",
  },
};

const adminLinks = [
  { to: "/admin", label: "Overview", description: "Marketplace analytics", end: true },
  { to: "/admin/users", label: "Users", description: "Customers and providers" },
  { to: "/admin/services", label: "Services", description: "Listing approval view" },
  { to: "/admin/bookings", label: "Bookings", description: "Request oversight" },
  { to: "/admin/disputes", label: "Disputes", description: "Review risk signals" },
];

function getAdminCacheKey(section) {
  return `admin:${section}`;
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

function getStatusLabel(status) {
  if (!status) {
    return "Pending";
  }

  return status.charAt(0).toUpperCase() + status.slice(1);
}

export default function AdminPage({ section }) {
  const { currentUser, sessionLoading, showNotice } = useAppContext();
  const cacheKey = useMemo(() => getAdminCacheKey(section), [section]);
  const cachedSectionData = useMemo(
    () => readCachedValue(cacheKey, ADMIN_CACHE_TTL),
    [cacheKey],
  );
  const [data, setData] = useState(() => cachedSectionData);
  const [loading, setLoading] = useState(() => !cachedSectionData);

  useEffect(() => {
    let isActive = true;

    const loadSection = async () => {
      if (sessionLoading) {
        return;
      }

      if (!currentUser || currentUser.role !== "admin") {
        if (isActive) {
          setLoading(false);
          setData(null);
        }
        return;
      }

      const cachedData = readCachedValue(cacheKey, ADMIN_CACHE_TTL);

      if (cachedData) {
        setData(cachedData);
        setLoading(false);
      } else {
        setLoading(true);
      }

      try {
        const response = await apiRequest(sectionConfig[section].endpoint);
        if (!isActive) {
          return;
        }

        setData(response);
        writeCachedValue(cacheKey, response);
      } catch (error) {
        if (!cachedData && isActive) {
          showNotice("error", error.message);
        }
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    };

    loadSection();

    return () => {
      isActive = false;
    };
  }, [cacheKey, currentUser, section, sessionLoading, showNotice]);

  if (sessionLoading || loading) {
    return <Loader label="Loading admin workspace..." />;
  }

  if (currentUser && currentUser.role !== "admin") {
    return (
      <section className="page-shell">
        <div className="empty-panel">This workspace is only available to LocalFix admin accounts.</div>
      </section>
    );
  }

  if (!currentUser) {
    return (
      <section className="page-shell">
        <div className="empty-panel">
          Please <Link to="/login">log in</Link> with an admin account to open the LocalFix operations panel.
        </div>
      </section>
    );
  }

  return (
    <div className="page-shell">
      <DashboardShell
        title={sectionConfig[section].title}
        subtitle={sectionConfig[section].description}
        links={adminLinks}
      >
        {section === "overview" && data ? (
          <div className="dashboard-stack">
            <div className="metrics-grid">
              <article className="metric-card">
                <span>Total users</span>
                <strong>{data.stats.totalUsers}</strong>
              </article>
              <article className="metric-card">
                <span>Total services</span>
                <strong>{data.stats.totalServices}</strong>
              </article>
              <article className="metric-card">
                <span>Total bookings</span>
                <strong>{data.stats.totalBookings}</strong>
              </article>
              <article className="metric-card">
                <span>Total revenue</span>
                <strong>INR {data.stats.totalRevenue}</strong>
              </article>
            </div>

            <div className="dashboard-card">
              <div className="section-heading">
                <span className="eyebrow">Role mix</span>
                <h2>Marketplace composition</h2>
              </div>
              <div className="detail-highlight-grid">
                <article className="detail-highlight-card">
                  <span>Customers</span>
                  <strong>{data.stats.customerCount}</strong>
                </article>
                <article className="detail-highlight-card">
                  <span>Providers</span>
                  <strong>{data.stats.providerCount}</strong>
                </article>
                <article className="detail-highlight-card">
                  <span>Admins</span>
                  <strong>{data.stats.adminCount}</strong>
                </article>
              </div>
            </div>

            <div className="dashboard-card">
              <div className="section-heading">
                <span className="eyebrow">Recent bookings</span>
                <h2>Latest marketplace activity</h2>
              </div>
              <div className="list-stack">
                {data.recentBookings.map((booking) => (
                  <article key={booking.id} className="list-card list-card-wide">
                    <div>
                      <strong>{booking.service?.title || "Booked service"}</strong>
                      <small>{booking.user?.username || "Customer"}</small>
                    </div>
                    <div>
                      <span>{getStatusLabel(booking.status)}</span>
                      <small>{formatDate(booking.date)}</small>
                    </div>
                    <Link
                      className="button button-card-secondary"
                      to={`/admin/bookings/${booking.id}`}
                    >
                      Details
                    </Link>
                  </article>
                ))}
              </div>
            </div>
          </div>
        ) : null}

        {section === "users" && data ? (
          <div className="list-stack">
            {data.users.map((user) => (
              <article key={user.id} className="dashboard-card">
                <div className="list-card list-card-wide">
                  <div>
                    <strong>{user.username}</strong>
                    <small>{user.email}</small>
                  </div>
                  <div>
                    <span>{user.role}</span>
                    <small>
                      {user.joinedAt
                        ? new Date(user.joinedAt).toLocaleDateString()
                        : "Recently joined"}
                    </small>
                  </div>
                </div>
                <div className="detail-highlight-grid">
                  <article className="detail-highlight-card">
                    <span>Bookings</span>
                    <strong>{user.bookingsCount}</strong>
                  </article>
                  <article className="detail-highlight-card">
                    <span>Services</span>
                    <strong>{user.servicesCount}</strong>
                  </article>
                  <article className="detail-highlight-card">
                    <span>Favorites</span>
                    <strong>{user.favoriteServices?.length || 0}</strong>
                  </article>
                </div>
              </article>
            ))}
          </div>
        ) : null}

        {section === "services" && data ? (
          <div className="list-stack">
            {data.services.map((service) => (
              <article key={service.id} className="dashboard-card">
                <div className="list-card list-card-wide">
                  <div>
                    <strong>{service.title}</strong>
                    <small>{service.owner?.username || "Provider"} - {service.category}</small>
                  </div>
                  <div>
                    <span>INR {service.price}</span>
                    <small>{service.location}</small>
                  </div>
                </div>
                <div className="detail-highlight-grid">
                  <article className="detail-highlight-card">
                    <span>Rating</span>
                    <strong>{service.averageRating || "New"}</strong>
                  </article>
                  <article className="detail-highlight-card">
                    <span>Bookings</span>
                    <strong>{service.bookingCount || 0}</strong>
                  </article>
                  <article className="detail-highlight-card">
                    <span>Pending requests</span>
                    <strong>{service.pendingBookings || 0}</strong>
                  </article>
                </div>
              </article>
            ))}
          </div>
        ) : null}

        {section === "bookings" && data ? (
          <div className="dashboard-stack">
            <div className="metrics-grid">
              <article className="metric-card">
                <span>Total bookings</span>
                <strong>{data.stats.total}</strong>
              </article>
              <article className="metric-card">
                <span>Pending</span>
                <strong>{data.stats.pending}</strong>
              </article>
              <article className="metric-card">
                <span>Accepted</span>
                <strong>{data.stats.accepted}</strong>
              </article>
              <article className="metric-card">
                <span>Completed</span>
                <strong>{data.stats.completed}</strong>
              </article>
            </div>

            <div className="dashboard-activity-list">
              {data.bookings.map((booking) => (
                <article key={booking.id} className="dashboard-activity-card">
                  <div className="dashboard-activity-card__top">
                    <div className="dashboard-activity-card__title">
                      <strong>{booking.service?.title || "Booked service"}</strong>
                      <small>
                        {booking.user?.username || "Customer"} with{" "}
                        {booking.service?.owner?.username || "Provider"}
                      </small>
                    </div>
                    <span className={`status-pill status-pill-${booking.status || "pending"}`}>
                      {getStatusLabel(booking.status)}
                    </span>
                  </div>

                  <div className="dashboard-activity-card__meta">
                    <span>{formatDateTime(booking.date, booking.time)}</span>
                    <span>
                      INR {Number(booking.service?.price || 0).toLocaleString("en-IN")}
                    </span>
                  </div>

                  <div className="dashboard-action-row">
                    <Link
                      className="button button-card-secondary"
                      to={`/admin/bookings/${booking.id}`}
                    >
                      View booking
                    </Link>
                    <Link
                      className="button button-secondary"
                      to={`/services/${booking.service?.id}`}
                    >
                      View service
                    </Link>
                  </div>
                </article>
              ))}

              {!data.bookings.length ? (
                <div className="empty-panel">
                  No bookings found right now. Recent marketplace requests will appear here.
                </div>
              ) : null}
            </div>
          </div>
        ) : null}

        {section === "disputes" && data ? (
          <div className="list-stack">
            {data.disputeSignals.map((signal) => (
              <article key={signal.id} className="dashboard-card admin-signal-card">
                <div className="list-card list-card-wide">
                  <div>
                    <strong>{signal.type}</strong>
                    <small>{signal.summary}</small>
                  </div>
                  <div>
                    <span className={`status-pill status-pill-${signal.severity}`}>
                      {signal.severity}
                    </span>
                    <small>{new Date(signal.createdAt).toLocaleDateString()}</small>
                  </div>
                </div>
                <p className="detail-section-copy">{signal.detail}</p>
              </article>
            ))}
            {!data.disputeSignals.length ? (
              <div className="empty-panel">No dispute signals right now. The marketplace looks healthy.</div>
            ) : null}
          </div>
        ) : null}
      </DashboardShell>
    </div>
  );
}
