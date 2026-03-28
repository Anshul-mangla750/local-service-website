import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import {
  apiRequest,
  clearCachedValuesByPrefix,
  readCachedValue,
  writeCachedValue,
} from "../api/client";
import DashboardShell from "../components/DashboardShell";
import Loader from "../components/Loader";
import { useAppContext } from "../context/AppContext";

const sectionConfig = {
  overview: {
    endpoint: "/api/provider/dashboard",
    title: "Provider hub",
    description: "Manage services, bookings, revenue, and provider profile settings in one place.",
  },
  services: {
    endpoint: "/api/provider/services",
    title: "Your services",
    description: "Edit your listings, remove outdated offers, and add new services dynamically.",
  },
  bookings: {
    endpoint: "/api/provider/bookings",
    title: "Booking management",
    description: "Review incoming requests and update booking statuses with live backend data.",
  },
  earnings: {
    endpoint: "/api/provider/earnings",
    title: "Earnings and analytics",
    description: "Track revenue, completed jobs, review feedback, and booking momentum.",
  },
  settings: {
    endpoint: "/api/provider/settings",
    title: "Provider settings",
    description: "Keep your provider profile polished and ready for new clients.",
  },
};

const providerLinks = [
  { to: "/provider", label: "Overview", description: "Key provider stats", end: true },
  { to: "/provider/services", label: "Services", description: "Listings and edits" },
  { to: "/provider/bookings", label: "Bookings", description: "Requests and status changes" },
  { to: "/provider/earnings", label: "Earnings", description: "Revenue and reviews" },
  { to: "/provider/settings", label: "Settings", description: "Profile and contact info" },
];

const PROVIDER_CACHE_TTL = 1000 * 60 * 3;

function getProviderCacheKey(userId, section) {
  return `provider:${userId}:${section}`;
}

function formatCurrency(value) {
  return `INR ${Number(value || 0).toLocaleString("en-IN")}`;
}

function formatDate(value) {
  return value ? new Date(value).toLocaleDateString("en-IN") : "Flexible schedule";
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

function getStatusClassName(status) {
  return `dashboard-status dashboard-status--${status || "pending"}`;
}

function getInitials(label) {
  return String(label || "LF")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("");
}

function buildProviderWorkspace(currentUser, section, data) {
  if (!currentUser) {
    return null;
  }

  const base = {
    eyebrow: "Provider workspace",
    headline: `${currentUser.username || "Provider"}, your LocalFix desk is live`,
    summary: sectionConfig[section].description,
    profile: {
      initials: getInitials(currentUser.username),
      name: currentUser.username || "Provider",
      role: "Provider account",
      detail:
        data?.user?.workingHours || currentUser.email || "Keep your service profile sharp.",
    },
  };

  if (section === "overview" && data) {
    const nextBooking = data.recentBookings?.[0];

    return {
      ...base,
      chips: [
        `${data.stats.servicesCount} live services`,
        `${data.stats.newBookings} new requests`,
        `${formatCurrency(data.stats.revenue)} revenue`,
      ],
      spotlight: nextBooking
        ? {
            label: "Latest request",
            title: nextBooking.service?.title || "New booking activity",
            copy: `${getStatusLabel(nextBooking.status)} for ${formatDateTime(
              nextBooking.date,
              nextBooking.time,
            )}.`,
          }
        : {
            label: "Next move",
            title: "Publish or refresh a service listing",
            copy: "The more polished your profile and listings are, the easier it is to convert local demand.",
          },
      banner: {
        eyebrow: "Provider snapshot",
        title: "Run services, bookings, and earnings from one place",
        copy: "The provider hub keeps your active services, new requests, and customer signals lined up in a single workflow.",
        meta: [
          { label: "Services", value: data.stats.servicesCount },
          { label: "New bookings", value: data.stats.newBookings },
          { label: "Revenue", value: formatCurrency(data.stats.revenue) },
        ],
      },
    };
  }

  if (section === "services" && data) {
    return {
      ...base,
      chips: [`${data.services.length} live listings`, "Edit and refine", "Ready for booking"],
      spotlight: data.services[0]
        ? {
            label: "Latest listing",
            title: data.services[0].title,
            copy: `${formatCurrency(data.services[0].price)} in ${
              data.services[0].location || "your service area"
            }.`,
          }
        : {
            label: "Listings",
            title: "No services published yet",
            copy: "Create your first LocalFix listing to start accepting nearby requests.",
          },
      banner: {
        eyebrow: "Service management",
        title: "Keep every listing booking-ready",
        copy: "Use this view to refine pricing, descriptions, and service quality before demand arrives.",
        meta: [{ label: "Listings", value: data.services.length }],
      },
    };
  }

  if (section === "bookings" && data) {
    const pendingCount = data.bookings.filter((booking) => booking.status === "pending").length;
    const completedCount = data.bookings.filter((booking) => booking.status === "completed").length;

    return {
      ...base,
      chips: [
        `${data.bookings.length} booking records`,
        `${pendingCount} pending actions`,
        `${completedCount} completed jobs`,
      ],
      spotlight: data.bookings[0]
        ? {
            label: "Latest booking",
            title: data.bookings[0].service?.title || "Incoming request",
            copy: `${getStatusLabel(data.bookings[0].status)} for ${formatDateTime(
              data.bookings[0].date,
              data.bookings[0].time,
            )}.`,
          }
        : {
            label: "Pipeline",
            title: "No booking requests yet",
            copy: "Incoming LocalFix requests will show here with status controls and customer details.",
          },
      banner: {
        eyebrow: "Booking operations",
        title: "Handle incoming work with a cleaner pipeline",
        copy: "Move requests from pending to completed without losing track of dates, customers, or notes.",
        meta: [
          { label: "Total", value: data.bookings.length },
          { label: "Pending", value: pendingCount },
          { label: "Completed", value: completedCount },
        ],
      },
    };
  }

  if (section === "earnings" && data) {
    return {
      ...base,
      chips: [
        `${formatCurrency(data.stats.totalRevenue)} total revenue`,
        `${data.stats.completedBookings} completed jobs`,
        `${data.stats.averageRating}/5 average rating`,
      ],
      spotlight: data.recentCompletedBookings[0]
        ? {
            label: "Recent delivery",
            title: data.recentCompletedBookings[0].service?.title || "Completed booking",
            copy: `${formatCurrency(
              data.recentCompletedBookings[0].service?.price,
            )} earned on ${formatDate(data.recentCompletedBookings[0].date)}.`,
          }
        : {
            label: "Revenue desk",
            title: "No completed jobs yet",
            copy: "Completed provider jobs and customer feedback will stack up here over time.",
          },
      banner: {
        eyebrow: "Earnings view",
        title: "Track revenue and delivery quality together",
        copy: "The strongest provider dashboards connect completed work with repeatable customer trust signals.",
        meta: [
          { label: "Revenue", value: formatCurrency(data.stats.totalRevenue) },
          { label: "Average job", value: formatCurrency(data.stats.averageEarning) },
          { label: "Feedback", value: data.stats.totalFeedbacks },
        ],
      },
    };
  }

  return {
    ...base,
    chips: ["Profile polish", "Contact visibility", "Customer trust"],
    spotlight: {
      label: "Profile care",
      title: "Keep your public provider profile sharp",
      copy: "Clear bio, working hours, and contact details help customers trust your listing faster.",
    },
    banner: {
      eyebrow: "Settings",
      title: "Show customers a stronger provider profile",
      copy: "This is where your identity, working hours, and public bio stay current for future bookings.",
      meta: [
        { label: "Name", value: currentUser.username || "Provider" },
        { label: "Role", value: "Provider" },
      ],
    },
  };
}

export default function ProviderPage({ section }) {
  const { currentUser, refreshSession, sessionLoading, showNotice } = useAppContext();
  const cacheKey = useMemo(
    () => (currentUser ? getProviderCacheKey(currentUser.id, section) : null),
    [currentUser, section],
  );
  const cachedSectionData = useMemo(
    () => (cacheKey ? readCachedValue(cacheKey, PROVIDER_CACHE_TTL) : null),
    [cacheKey],
  );
  const [data, setData] = useState(() => cachedSectionData);
  const [loading, setLoading] = useState(() => !cachedSectionData);
  const [profileForm, setProfileForm] = useState({
    username: "",
    email: "",
    contactNumber: "",
    workingHours: "",
    bio: "",
  });

  const syncSectionState = (response) => {
    setData(response);

    if (response.user) {
      setProfileForm({
        username: response.user.username || "",
        email: response.user.email || "",
        contactNumber: response.user.contactNumber || "",
        workingHours: response.user.workingHours || "",
        bio: response.user.bio || "",
      });
    }
  };

  useEffect(() => {
    let isActive = true;

    const loadSection = async () => {
      if (sessionLoading) {
        return;
      }

      if (!currentUser || currentUser.role !== "provider") {
        if (isActive) {
          setData(null);
          setLoading(false);
        }
        return;
      }

      const cachedData = cacheKey
        ? readCachedValue(cacheKey, PROVIDER_CACHE_TTL)
        : null;

      if (cachedData) {
        syncSectionState(cachedData);
        setLoading(false);
      } else {
        setLoading(true);
      }

      try {
        const response = await apiRequest(sectionConfig[section].endpoint);
        if (!isActive) {
          return;
        }
        syncSectionState(response);
        if (cacheKey) {
          writeCachedValue(cacheKey, response);
        }
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
  }, [currentUser, section, sessionLoading, showNotice]);

  const reloadSection = async () => {
    if (!currentUser || !cacheKey) {
      return;
    }

    const response = await apiRequest(sectionConfig[section].endpoint);
    syncSectionState(response);
    writeCachedValue(cacheKey, response);
  };

  const handleDeleteService = async (serviceId) => {
    try {
      await apiRequest(`/api/services/${serviceId}`, {
        method: "DELETE",
      });
      clearCachedValuesByPrefix(`provider:${currentUser.id}:`);
      clearCachedValuesByPrefix("services:");
      clearCachedValuesByPrefix("home-page");
      clearCachedValuesByPrefix(`service-details:${serviceId}:`);
      await reloadSection();
      showNotice("success", "Service removed.");
    } catch (error) {
      showNotice("error", error.message);
    }
  };

  const handleBookingStatus = async (bookingId, status) => {
    try {
      await apiRequest(`/api/provider/bookings/${bookingId}/status`, {
        method: "PATCH",
        body: { status },
      });
      clearCachedValuesByPrefix(`provider:${currentUser.id}:`);
      clearCachedValuesByPrefix("home-page");
      clearCachedValuesByPrefix("service-details:");
      clearCachedValuesByPrefix(`booking-details:${bookingId}:`);
      clearCachedValuesByPrefix("admin:");
      await reloadSection();
      showNotice("success", "Booking status updated.");
    } catch (error) {
      showNotice("error", error.message);
    }
  };

  const handleSettingsSave = async (event) => {
    event.preventDefault();

    try {
      await apiRequest("/api/provider/settings", {
        method: "PUT",
        body: profileForm,
      });
      clearCachedValuesByPrefix(`provider:${currentUser.id}:`);
      clearCachedValuesByPrefix("services:");
      clearCachedValuesByPrefix("home-page");
      clearCachedValuesByPrefix("service-details:");
      await refreshSession();
      await reloadSection();
      showNotice("success", "Provider profile updated.");
    } catch (error) {
      showNotice("error", error.message);
    }
  };

  if (currentUser && currentUser.role !== "provider") {
    return <section className="page-shell">This workspace is only available to provider accounts.</section>;
  }

  if (sessionLoading || loading) {
    return <Loader label="Loading provider workspace..." />;
  }

  const workspace = buildProviderWorkspace(currentUser, section, data);
  const bookingStats =
    section === "bookings" && data
      ? {
          pending: data.bookings.filter((booking) => booking.status === "pending").length,
          accepted: data.bookings.filter((booking) => booking.status === "accepted").length,
          completed: data.bookings.filter((booking) => booking.status === "completed").length,
          rejected: data.bookings.filter((booking) => booking.status === "rejected").length,
        }
      : null;

  return (
    <div className="page-shell">
      <DashboardShell
        title={sectionConfig[section].title}
        subtitle={sectionConfig[section].description}
        links={providerLinks}
        theme="provider"
        workspace={workspace}
        actions={
          <Link className="button button-primary" to="/provider/services/new">
            New service
          </Link>
        }
      >
        {section === "overview" && data ? (
          <div className="dashboard-stack">
            <section className="dashboard-personal-grid">
              <article className="dashboard-spotlight-card dashboard-spotlight-card--provider">
                <span className="eyebrow">Provider momentum</span>
                <h2>
                  {data.recentBookings.length
                    ? `Keep ${data.recentBookings[0].service?.title || "your latest request"} moving`
                    : `${currentUser.username}, publish stronger services and bring demand in`}
                </h2>
                <p>
                  {data.recentBookings.length
                    ? `${getStatusLabel(data.recentBookings[0].status)} request from ${
                        data.recentBookings[0].user?.username || "a customer"
                      } for ${formatDateTime(data.recentBookings[0].date, data.recentBookings[0].time)}.`
                    : "New services, sharper copy, and cleaner pricing help your LocalFix profile convert faster."}
                </p>

                <div className="dashboard-mini-stats">
                  <article className="dashboard-mini-stat">
                    <strong>{data.stats.servicesCount}</strong>
                    <span>Live services</span>
                  </article>
                  <article className="dashboard-mini-stat">
                    <strong>{data.stats.newBookings}</strong>
                    <span>New bookings</span>
                  </article>
                  <article className="dashboard-mini-stat">
                    <strong>{formatCurrency(data.stats.revenue)}</strong>
                    <span>Revenue</span>
                  </article>
                </div>

                <div className="dashboard-action-row">
                  <Link className="button button-primary" to="/provider/services/new">
                    Publish service
                  </Link>
                  <Link className="button button-card-secondary" to="/provider/bookings">
                    Open bookings
                  </Link>
                </div>
              </article>

              <article className="dashboard-persona-card">
                <span className="eyebrow">Provider profile</span>
                <div className="dashboard-persona-card__header">
                  <div className="dashboard-persona-card__avatar">
                    {getInitials(currentUser.username)}
                  </div>
                  <div>
                    <strong>{currentUser.username}</strong>
                    <small>{currentUser.email}</small>
                  </div>
                </div>

                <div className="dashboard-persona-list">
                  <div>
                    <span>Working hours</span>
                    <strong>{data.user?.workingHours || "Set in settings"}</strong>
                  </div>
                  <div>
                    <span>Contact</span>
                    <strong>{data.user?.contactNumber || "Add contact number"}</strong>
                  </div>
                  <div>
                    <span>Completed jobs</span>
                    <strong>{data.stats.completedJobs}</strong>
                  </div>
                </div>
              </article>
            </section>

            <section className="dashboard-section-grid">
              <article className="dashboard-card">
                <div className="dashboard-card__header">
                  <div>
                    <span className="eyebrow">Recent bookings</span>
                    <h2>Keep the pipeline moving</h2>
                  </div>
                </div>

                <div className="dashboard-activity-list">
                  {data.recentBookings.map((booking) => (
                    <article key={booking.id} className="dashboard-activity-card">
                      <div className="dashboard-activity-card__top">
                        <div className="dashboard-activity-card__title">
                          <strong>{booking.service?.title || "Booked service"}</strong>
                          <small>{booking.user?.username || "Customer"}</small>
                        </div>
                        <span className={getStatusClassName(booking.status)}>
                          {getStatusLabel(booking.status)}
                        </span>
                      </div>
                      <div className="dashboard-activity-card__meta">
                        <span>{formatDateTime(booking.date, booking.time)}</span>
                        <span>{booking.notes || "No booking notes yet"}</span>
                      </div>
                    </article>
                  ))}

                  {!data.recentBookings.length ? (
                    <div className="dashboard-empty-note">
                      New customer requests will appear here as soon as your services start receiving traction.
                    </div>
                  ) : null}
                </div>
              </article>

              <article className="dashboard-card">
                <div className="dashboard-card__header">
                  <div>
                    <span className="eyebrow">Service portfolio</span>
                    <h2>Listings getting the spotlight</h2>
                  </div>
                </div>

                <div className="dashboard-activity-list">
                  {data.services.map((service) => (
                    <article key={service.id} className="dashboard-activity-card">
                      <div className="dashboard-activity-card__top">
                        <div className="dashboard-activity-card__title">
                          <strong>{service.title}</strong>
                          <small>{service.category} in {service.location}</small>
                        </div>
                        <span className="dashboard-rating-pill">
                          {service.reviewCount ? `${service.reviewCount} reviews` : "New"}
                        </span>
                      </div>
                      <div className="dashboard-activity-card__meta">
                        <span>{formatCurrency(service.price)}</span>
                        <span>{service.averageRating ? `${service.averageRating}/5 rating` : "Ready for bookings"}</span>
                      </div>
                    </article>
                  ))}

                  {!data.services.length ? (
                    <div className="dashboard-empty-note">
                      Add your first LocalFix service to start bringing requests into this workspace.
                    </div>
                  ) : null}
                </div>
              </article>
            </section>
          </div>
        ) : null}

        {section === "services" && data ? (
          <div className="dashboard-service-management-grid">
            {data.services.map((service) => (
              <article key={service.id} className="dashboard-service-panel">
                <div className="dashboard-service-panel__top">
                  <div>
                    <strong>{service.title}</strong>
                    <small>{service.category} in {service.location}</small>
                  </div>
                  <span className="dashboard-rating-pill">
                    {service.averageRating ? `${service.averageRating}/5` : "New"}
                  </span>
                </div>

                <div className="dashboard-service-panel__meta">
                  <span>{formatCurrency(service.price)}</span>
                  <span>
                    {service.reviewCount ? `${service.reviewCount} reviews` : "Ready for bookings"}
                  </span>
                  <span>
                    {service.bookingCount ? `${service.bookingCount} bookings tracked` : "Fresh listing"}
                  </span>
                </div>

                <div className="dashboard-action-row">
                  <Link className="button button-secondary" to={`/provider/services/${service.id}/edit`}>
                    Edit
                  </Link>
                  <button
                    type="button"
                    className="button button-card-secondary"
                    onClick={() => handleDeleteService(service.id)}
                  >
                    Delete
                  </button>
                </div>
              </article>
            ))}

            {!data.services.length ? (
              <div className="dashboard-empty-note">
                No services published yet. Create a listing to start receiving LocalFix requests.
              </div>
            ) : null}
          </div>
        ) : null}

        {section === "bookings" && data ? (
          <div className="dashboard-stack">
            <div className="metrics-grid">
              <article className="metric-card">
                <span>Pending</span>
                <strong>{bookingStats.pending}</strong>
              </article>
              <article className="metric-card">
                <span>Accepted</span>
                <strong>{bookingStats.accepted}</strong>
              </article>
              <article className="metric-card">
                <span>Completed</span>
                <strong>{bookingStats.completed}</strong>
              </article>
              <article className="metric-card">
                <span>Rejected</span>
                <strong>{bookingStats.rejected}</strong>
              </article>
            </div>

            <div className="dashboard-activity-list">
              {data.bookings.map((booking) => (
                <article key={booking.id} className="dashboard-activity-card">
                  <div className="dashboard-activity-card__top">
                    <div className="dashboard-activity-card__title">
                      <strong>{booking.service?.title || "Incoming booking"}</strong>
                      <small>{booking.user?.username || "Customer"}</small>
                    </div>
                    <span className={getStatusClassName(booking.status)}>
                      {getStatusLabel(booking.status)}
                    </span>
                  </div>
                  <div className="dashboard-activity-card__meta">
                    <span>{formatDateTime(booking.date, booking.time)}</span>
                    <span>{booking.notes || "No notes"}</span>
                  </div>

                  <div className="dashboard-action-row">
                    <Link
                      className="button button-secondary"
                      to={`/provider/bookings/${booking.id}`}
                    >
                      View details
                    </Link>
                    <Link
                      className="button button-card-secondary"
                      to={`/provider/bookings/${booking.id}#booking-chat`}
                    >
                      Open chat
                    </Link>
                    {["accepted", "completed", "rejected"].map((status) => (
                      <button
                        key={status}
                        type="button"
                        className="button button-card-secondary"
                        onClick={() => handleBookingStatus(booking.id, status)}
                      >
                        Mark {getStatusLabel(status)}
                      </button>
                    ))}
                  </div>
                </article>
              ))}

              {!data.bookings.length ? (
                <div className="dashboard-empty-note">
                  Incoming booking requests will appear here with quick status controls.
                </div>
              ) : null}
            </div>
          </div>
        ) : null}

        {section === "earnings" && data ? (
          <div className="dashboard-stack">
            <div className="metrics-grid">
              <article className="metric-card">
                <span>Total bookings</span>
                <strong>{data.stats.totalBookings}</strong>
              </article>
              <article className="metric-card">
                <span>Completed bookings</span>
                <strong>{data.stats.completedBookings}</strong>
              </article>
              <article className="metric-card">
                <span>Total revenue</span>
                <strong>INR {data.stats.totalRevenue}</strong>
              </article>
              <article className="metric-card">
                <span>Average rating</span>
                <strong>{data.stats.averageRating}</strong>
              </article>
            </div>

            <section className="dashboard-section-grid">
              <article className="dashboard-card">
                <div className="dashboard-card__header">
                  <div>
                    <span className="eyebrow">Completed jobs</span>
                    <h2>Recent delivery flow</h2>
                  </div>
                </div>

                <div className="dashboard-activity-list">
                  {data.recentCompletedBookings.map((booking) => (
                    <article key={booking.id} className="dashboard-activity-card">
                      <div className="dashboard-activity-card__top">
                        <div className="dashboard-activity-card__title">
                          <strong>{booking.service?.title || "Completed service"}</strong>
                          <small>{booking.user?.username || "Customer"}</small>
                        </div>
                        <span className="dashboard-rating-pill">
                          {formatCurrency(booking.service?.price)}
                        </span>
                      </div>
                      <div className="dashboard-activity-card__meta">
                        <span>{formatDate(booking.date)}</span>
                        <span>{booking.time || "Completed slot"}</span>
                      </div>
                    </article>
                  ))}

                  {!data.recentCompletedBookings.length ? (
                    <div className="dashboard-empty-note">
                      Completed jobs will appear here once your LocalFix requests start closing.
                    </div>
                  ) : null}
                </div>
              </article>

              <article className="dashboard-card">
                <div className="dashboard-card__header">
                  <div>
                    <span className="eyebrow">Latest feedback</span>
                    <h2>Review highlights</h2>
                  </div>
                </div>

                <div className="dashboard-activity-list">
                  {data.latestReviews.map((review) => (
                    <article key={review.id} className="dashboard-activity-card">
                      <div className="dashboard-activity-card__top">
                        <div className="dashboard-activity-card__title">
                          <strong>{review.booking?.service?.title || "Completed booking"}</strong>
                          <small>{review.user?.username || "Customer"}</small>
                        </div>
                        <span className="dashboard-rating-pill">{review.rating}/5</span>
                      </div>
                      <p className="dashboard-activity-card__copy">
                        {review.comment || "Positive completion review"}
                      </p>
                    </article>
                  ))}

                  {!data.latestReviews.length ? (
                    <div className="dashboard-empty-note">
                      Customer feedback will show up here as completed bookings start getting reviewed.
                    </div>
                  ) : null}
                </div>
              </article>
            </section>
          </div>
        ) : null}

        {section === "settings" && data ? (
          <div className="dashboard-settings-layout">
            <aside className="dashboard-profile-card">
              <span className="eyebrow">Public provider profile</span>
              <div className="dashboard-profile-card__header">
                <div className="dashboard-profile-card__avatar">
                  {getInitials(profileForm.username || currentUser.username)}
                </div>
                <div>
                  <strong>{profileForm.username || currentUser.username}</strong>
                  <small>{profileForm.email || currentUser.email}</small>
                </div>
              </div>

              <div className="dashboard-profile-list">
                <div>
                  <span>Contact</span>
                  <strong>{profileForm.contactNumber || "Add phone number"}</strong>
                </div>
                <div>
                  <span>Working hours</span>
                  <strong>{profileForm.workingHours || "Add working hours"}</strong>
                </div>
                <div>
                  <span>Bio</span>
                  <strong>{profileForm.bio || "Add a short provider bio"}</strong>
                </div>
              </div>
            </aside>

            <form className="dashboard-form-panel stack-form" onSubmit={handleSettingsSave}>
              <div className="dashboard-card__header">
                <div>
                  <span className="eyebrow">Provider profile</span>
                  <h2>Keep your public listing profile sharp</h2>
                </div>
              </div>

              <input
                type="text"
                value={profileForm.username}
                onChange={(event) =>
                  setProfileForm((current) => ({ ...current, username: event.target.value }))
                }
              />
              <input
                type="email"
                value={profileForm.email}
                onChange={(event) =>
                  setProfileForm((current) => ({ ...current, email: event.target.value }))
                }
              />
              <input
                type="text"
                value={profileForm.contactNumber}
                onChange={(event) =>
                  setProfileForm((current) => ({
                    ...current,
                    contactNumber: event.target.value,
                  }))
                }
                placeholder="Contact number"
              />
              <input
                type="text"
                value={profileForm.workingHours}
                onChange={(event) =>
                  setProfileForm((current) => ({
                    ...current,
                    workingHours: event.target.value,
                  }))
                }
                placeholder="Working hours"
              />
              <textarea
                rows="5"
                value={profileForm.bio}
                onChange={(event) =>
                  setProfileForm((current) => ({ ...current, bio: event.target.value }))
                }
                placeholder="Tell customers what makes your service trustworthy."
              />
              <button type="submit" className="button button-primary">
                Save provider settings
              </button>
            </form>
          </div>
        ) : null}

        {!currentUser ? (
          <div className="empty-panel">
            Please <Link to="/login">log in</Link> to access the provider hub.
          </div>
        ) : null}
      </DashboardShell>
    </div>
  );
}
