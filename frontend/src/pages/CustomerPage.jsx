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
import ServiceCard from "../components/ServiceCard";
import { useAppContext } from "../context/AppContext";

const sectionConfig = {
  overview: {
    endpoint: "/api/customer/dashboard",
    title: "Customer dashboard",
    description: "Track upcoming bookings, favorite services, reviews, and account updates.",
  },
  bookings: {
    endpoint: "/api/customer/bookings",
    title: "Your bookings",
    description: "Monitor every pending, accepted, completed, or rejected booking in one place.",
  },
  favorites: {
    endpoint: "/api/customer/favorites",
    title: "Favorite services",
    description: "Quick access to saved listings you may want to revisit or book next.",
  },
  reviews: {
    endpoint: "/api/customer/reviews",
    title: "Your reviews",
    description: "Manage written feedback for the services you have completed.",
  },
  wallet: {
    endpoint: "/api/customer/wallet",
    title: "Wallet and payments",
    description: "View the spend summary built dynamically from your completed bookings.",
  },
  settings: {
    endpoint: "/api/customer/settings",
    title: "Customer settings",
    description: "Keep your profile details and password up to date.",
  },
};

const customerLinks = [
  { to: "/customer", label: "Overview", description: "Snapshot and highlights", end: true },
  { to: "/customer/bookings", label: "Bookings", description: "Status and schedule" },
  { to: "/customer/favorites", label: "Favorites", description: "Saved services" },
  { to: "/customer/reviews", label: "Reviews", description: "Feedback and ratings" },
  { to: "/customer/wallet", label: "Wallet", description: "Spend and payment history" },
  { to: "/customer/settings", label: "Settings", description: "Profile and password" },
];

const CUSTOMER_CACHE_TTL = 1000 * 60 * 3;

function getCustomerCacheKey(userId, section) {
  return `customer:${userId}:${section}`;
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

function buildCustomerWorkspace(currentUser, section, data) {
  if (!currentUser) {
    return null;
  }

  const base = {
    eyebrow: "Customer workspace",
    headline: `Hi ${currentUser.username || "Customer"}, your LocalFix desk is ready`,
    summary: sectionConfig[section].description,
    profile: {
      initials: getInitials(currentUser.username),
      name: currentUser.username || "Customer",
      role: "Customer account",
      detail:
        data?.user?.address || currentUser.email || "Keep your favorite local services close.",
    },
  };

  if (section === "overview" && data) {
    const nextBooking = data.upcomingBookings?.[0];

    return {
      ...base,
      chips: [
        `${data.stats.upcomingCount} active bookings`,
        `${data.stats.favoritesCount} saved services`,
        `${data.stats.reviewsCount} review notes`,
      ],
      spotlight: nextBooking
        ? {
            label: "Next booking",
            title: nextBooking.service?.title || "Upcoming service visit",
            copy: `${formatDateTime(nextBooking.date, nextBooking.time)} in ${
              nextBooking.service?.location || "your area"
            }.`,
          }
        : {
            label: "Next move",
            title: "Search a trusted provider nearby",
            copy: "Browse LocalFix categories, compare reviews, and book your next visit in minutes.",
          },
      banner: {
        eyebrow: "Personal snapshot",
        title: nextBooking
          ? `${currentUser.username}, your next service is already lined up`
          : `${currentUser.username}, you are all clear for the next job`,
        copy: nextBooking
          ? `Everything about ${nextBooking.service?.title || "your upcoming booking"} stays in one place, from booking status to provider details.`
          : "Save providers you trust, keep your address updated, and jump back into local bookings whenever you need help.",
        meta: [
          { label: "Upcoming", value: data.stats.upcomingCount },
          { label: "Favorites", value: data.stats.favoritesCount },
          { label: "Spent", value: formatCurrency(data.stats.totalSpent) },
        ],
      },
    };
  }

  if (section === "bookings" && data) {
    const bookings = data.bookings || [];
    const pendingCount = bookings.filter((booking) => booking.status === "pending").length;
    const completedCount = bookings.filter((booking) => booking.status === "completed").length;

    return {
      ...base,
      chips: [
        `${bookings.length} booking records`,
        `${pendingCount} pending decisions`,
        `${completedCount} completed jobs`,
      ],
      spotlight: bookings[0]
        ? {
            label: "Latest booking",
            title: bookings[0].service?.title || "Recent booking activity",
            copy: `${getStatusLabel(bookings[0].status)} for ${formatDateTime(
              bookings[0].date,
              bookings[0].time,
            )}.`,
          }
        : {
            label: "Booking flow",
            title: "No bookings yet",
            copy: "Your next request will show up here with status, schedule, and provider details.",
          },
      banner: {
        eyebrow: "Booking center",
        title: "Every LocalFix request in one timeline",
        copy: "Track what is pending, what is confirmed, and what has already been completed without hopping between pages.",
        meta: [
          { label: "Total", value: bookings.length },
          { label: "Pending", value: pendingCount },
          { label: "Completed", value: completedCount },
        ],
      },
    };
  }

  if (section === "favorites" && data) {
    return {
      ...base,
      chips: [`${data.services.length} saved services`, "Compare later", "Book when ready"],
      spotlight: data.services[0]
        ? {
            label: "Saved first",
            title: data.services[0].title,
            copy: `${formatCurrency(data.services[0].price)} starting quote in ${
              data.services[0].location || "your area"
            }.`,
          }
        : {
            label: "Saved list",
            title: "Build your shortlist",
            copy: "Use favorites to keep the providers you trust ready for later.",
          },
      banner: {
        eyebrow: "Saved providers",
        title: "Your shortlist stays booking-ready",
        copy: "Favorites make it easy to revisit trusted listings without searching from scratch.",
        meta: [{ label: "Saved", value: data.services.length }],
      },
    };
  }

  if (section === "reviews" && data) {
    return {
      ...base,
      chips: [
        `${data.stats.totalReviews} reviews written`,
        `${data.stats.fiveStarReviews} five-star notes`,
        `${data.stats.averageRating}/5 average`,
      ],
      spotlight: data.reviews[0]
        ? {
            label: "Latest review",
            title: data.reviews[0].booking?.service?.title || "Completed booking",
            copy: `${data.reviews[0].rating}/5 rating shared with the marketplace.`,
          }
        : {
            label: "Feedback desk",
            title: "No reviews posted yet",
            copy: "Once a booking is completed, you can leave trusted feedback right here.",
          },
      banner: {
        eyebrow: "Feedback center",
        title: "Keep your reviews useful and up to date",
        copy: "Your review history shapes trust for future customers and helps providers improve.",
        meta: [
          { label: "Average", value: data.stats.averageRating },
          { label: "Reviews", value: data.stats.totalReviews },
          { label: "Five-star", value: data.stats.fiveStarReviews },
        ],
      },
    };
  }

  if (section === "wallet" && data) {
    return {
      ...base,
      chips: [
        `${formatCurrency(data.stats.totalSpent)} total spend`,
        `${data.stats.completedPayments} completed payments`,
        `${data.stats.pendingPayments} pending items`,
      ],
      spotlight: data.payments[0]
        ? {
            label: "Latest payment",
            title: data.payments[0].service?.title || "Completed service",
            copy: `${formatCurrency(data.payments[0].amount)} on ${formatDate(data.payments[0].date)}.`,
          }
        : {
            label: "Wallet view",
            title: "No payment history yet",
            copy: "Completed service payments will appear here with quick transaction references.",
          },
      banner: {
        eyebrow: "Wallet summary",
        title: "A clean look at your LocalFix spending",
        copy: "Use this view to understand how much you have spent, what is complete, and what is still in progress.",
        meta: [
          { label: "Spent", value: formatCurrency(data.stats.totalSpent) },
          { label: "Completed", value: data.stats.completedPayments },
          { label: "Pending", value: data.stats.pendingPayments },
        ],
      },
    };
  }

  return {
    ...base,
    chips: ["Profile updates", "Password security", "LocalFix access"],
    spotlight: {
      label: "Profile care",
      title: "Keep your account ready for the next booking",
      copy: "Update your address, phone, and password so booking requests stay smooth.",
    },
    banner: {
      eyebrow: "Settings",
      title: "Keep your customer account polished",
      copy: "A complete profile makes future service bookings faster and easier to confirm.",
      meta: [
        { label: "Name", value: currentUser.username || "Customer" },
        { label: "Role", value: "Customer" },
      ],
    },
  };
}

export default function CustomerPage({ section }) {
  const { currentUser, refreshSession, sessionLoading, showNotice } = useAppContext();
  const cacheKey = useMemo(
    () => (currentUser ? getCustomerCacheKey(currentUser.id, section) : null),
    [currentUser, section],
  );
  const cachedSectionData = useMemo(
    () => (cacheKey ? readCachedValue(cacheKey, CUSTOMER_CACHE_TTL) : null),
    [cacheKey],
  );
  const [data, setData] = useState(() => cachedSectionData);
  const [loading, setLoading] = useState(() => !cachedSectionData);
  const [profileForm, setProfileForm] = useState({
    username: "",
    email: "",
    address: "",
    phone: "",
  });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [reviewDrafts, setReviewDrafts] = useState({});

  const syncSectionState = (response) => {
    setData(response);

    if (response.user) {
      setProfileForm({
        username: response.user.username || "",
        email: response.user.email || "",
        address: response.user.address || "",
        phone: response.user.phone || "",
      });
    }

    if (response.reviews) {
      const nextDrafts = {};
      response.reviews.forEach((review) => {
        nextDrafts[review.id] = {
          rating: String(review.rating),
          comment: review.comment || "",
        };
      });
      setReviewDrafts(nextDrafts);
      return;
    }

    setReviewDrafts({});
  };

  useEffect(() => {
    let isActive = true;

    const loadSection = async () => {
      if (sessionLoading) {
        return;
      }

      if (!currentUser || currentUser.role !== "customer") {
        if (isActive) {
          setData(null);
          setLoading(false);
          setReviewDrafts({});
        }
        return;
      }

      const cachedData = cacheKey
        ? readCachedValue(cacheKey, CUSTOMER_CACHE_TTL)
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

  const handleRemoveFavorite = async (serviceId) => {
    try {
      await apiRequest(`/api/customer/favorites/${serviceId}`, {
        method: "DELETE",
      });
      clearCachedValuesByPrefix(`customer:${currentUser.id}:`);
      clearCachedValuesByPrefix(`service-details:${serviceId}:`);
      await refreshSession();
      await reloadSection();
      showNotice("success", "Removed from favorites.");
    } catch (error) {
      showNotice("error", error.message);
    }
  };

  const handleProfileSave = async (event) => {
    event.preventDefault();

    try {
      await apiRequest("/api/customer/settings", {
        method: "PUT",
        body: profileForm,
      });
      clearCachedValuesByPrefix(`customer:${currentUser.id}:`);
      clearCachedValuesByPrefix("service-details:");
      await refreshSession();
      await reloadSection();
      showNotice("success", "Profile updated.");
    } catch (error) {
      showNotice("error", error.message);
    }
  };

  const handlePasswordChange = async (event) => {
    event.preventDefault();

    try {
      await apiRequest("/api/customer/change-password", {
        method: "POST",
        body: passwordForm,
      });
      clearCachedValuesByPrefix(`customer:${currentUser.id}:`);
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      showNotice("success", "Password updated.");
    } catch (error) {
      showNotice("error", error.message);
    }
  };

  const handleReviewUpdate = async (reviewId) => {
    try {
      await apiRequest(`/api/customer/reviews/${reviewId}`, {
        method: "PUT",
        body: reviewDrafts[reviewId],
      });
      clearCachedValuesByPrefix(`customer:${currentUser.id}:`);
      clearCachedValuesByPrefix("service-details:");
      await reloadSection();
      showNotice("success", "Review updated.");
    } catch (error) {
      showNotice("error", error.message);
    }
  };

  if (currentUser && currentUser.role !== "customer") {
    return <section className="page-shell">This workspace is only available to customer accounts.</section>;
  }

  if (sessionLoading || loading) {
    return <Loader label="Loading customer workspace..." />;
  }

  const workspace = buildCustomerWorkspace(currentUser, section, data);
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
        links={customerLinks}
        theme="customer"
        workspace={workspace}
        actions={
          <Link className="button button-primary" to="/search">
            Find services
          </Link>
        }
      >
        {section === "overview" && data ? (
          <div className="dashboard-stack">
            <section className="dashboard-personal-grid">
              <article className="dashboard-spotlight-card dashboard-spotlight-card--customer">
                <span className="eyebrow">Personalized snapshot</span>
                <h2>
                  {data.upcomingBookings.length
                    ? `Your next service is ${data.upcomingBookings[0].service?.title || "already scheduled"}`
                    : `${currentUser.username}, discover your next trusted local provider`}
                </h2>
                <p>
                  {data.upcomingBookings.length
                    ? `${formatDateTime(
                        data.upcomingBookings[0].date,
                        data.upcomingBookings[0].time,
                      )} with ${data.upcomingBookings[0].service?.owner?.username || "a local provider"}.`
                    : "Browse categories, keep a shortlist of favorites, and book nearby professionals when you need them."}
                </p>

                <div className="dashboard-mini-stats">
                  <article className="dashboard-mini-stat">
                    <strong>{data.stats.upcomingCount}</strong>
                    <span>Active bookings</span>
                  </article>
                  <article className="dashboard-mini-stat">
                    <strong>{data.stats.favoritesCount}</strong>
                    <span>Saved services</span>
                  </article>
                  <article className="dashboard-mini-stat">
                    <strong>{formatCurrency(data.stats.totalSpent)}</strong>
                    <span>Total spend</span>
                  </article>
                </div>

                <div className="dashboard-action-row">
                  <Link className="button button-primary" to="/customer/bookings">
                    Open bookings
                  </Link>
                  <Link className="button button-card-secondary" to="/customer/favorites">
                    Saved services
                  </Link>
                </div>
              </article>

              <article className="dashboard-persona-card">
                <span className="eyebrow">Customer profile</span>
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
                    <span>Address</span>
                    <strong>{data.user?.address || "Add address in settings"}</strong>
                  </div>
                  <div>
                    <span>Phone</span>
                    <strong>{data.user?.phone || "Add phone in settings"}</strong>
                  </div>
                  <div>
                    <span>Reviews posted</span>
                    <strong>{data.stats.reviewsCount}</strong>
                  </div>
                </div>
              </article>
            </section>

            <section className="dashboard-section-grid">
              <article className="dashboard-card">
                <div className="dashboard-card__header">
                  <div>
                    <span className="eyebrow">Upcoming</span>
                    <h2>Bookings on your schedule</h2>
                  </div>
                </div>

                <div className="dashboard-activity-list">
                  {data.upcomingBookings.map((booking) => (
                    <article key={booking.id} className="dashboard-activity-card">
                      <div className="dashboard-activity-card__top">
                        <div className="dashboard-activity-card__title">
                          <strong>{booking.service?.title || "Booked service"}</strong>
                          <small>{booking.service?.location || "LocalFix service area"}</small>
                        </div>
                        <span className={getStatusClassName(booking.status)}>
                          {getStatusLabel(booking.status)}
                        </span>
                      </div>
                      <div className="dashboard-activity-card__meta">
                        <span>{formatDateTime(booking.date, booking.time)}</span>
                        <span>{booking.service?.owner?.username || "Provider assigned"}</span>
                      </div>
                    </article>
                  ))}

                  {!data.upcomingBookings.length ? (
                    <div className="dashboard-empty-note">
                      No active bookings yet. Search nearby services and book your first LocalFix visit.
                    </div>
                  ) : null}
                </div>
              </article>

              <article className="dashboard-card">
                <div className="dashboard-card__header">
                  <div>
                    <span className="eyebrow">Recent feedback</span>
                    <h2>Your latest review notes</h2>
                  </div>
                </div>

                <div className="dashboard-activity-list">
                  {data.recentReviews.map((review) => (
                    <article key={review.id} className="dashboard-activity-card">
                      <div className="dashboard-activity-card__top">
                        <div className="dashboard-activity-card__title">
                          <strong>{review.booking?.service?.title || "Completed booking"}</strong>
                          <small>{review.user?.username || "Customer review"}</small>
                        </div>
                        <span className="dashboard-rating-pill">{review.rating}/5</span>
                      </div>
                      <p className="dashboard-activity-card__copy">
                        {review.comment || "Positive completion feedback."}
                      </p>
                    </article>
                  ))}

                  {!data.recentReviews.length ? (
                    <div className="dashboard-empty-note">
                      Your completed bookings can be reviewed from this workspace once feedback is available.
                    </div>
                  ) : null}
                </div>
              </article>
            </section>

            <article className="dashboard-card">
              <div className="dashboard-card__header">
                <div>
                  <span className="eyebrow">Favorites</span>
                  <h2>Saved services ready to revisit</h2>
                </div>
                <Link className="button button-card-secondary" to="/customer/favorites">
                  View all favorites
                </Link>
              </div>

              {data.favoriteServices.length ? (
                <div className="service-grid">
                  {data.favoriteServices.map((service) => (
                    <ServiceCard key={service.id} service={service} />
                  ))}
                </div>
              ) : (
                <div className="dashboard-empty-note">
                  You have not saved any services yet. Favorite providers you trust so they are easy to book later.
                </div>
              )}
            </article>
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
                      <strong>{booking.service?.title || "Booked service"}</strong>
                      <small>
                        {booking.service?.owner?.username || "Provider"} in{" "}
                        {booking.service?.location || "your area"}
                      </small>
                    </div>
                    <span className={getStatusClassName(booking.status)}>
                      {getStatusLabel(booking.status)}
                    </span>
                  </div>
                  <div className="dashboard-activity-card__meta">
                    <span>{formatDateTime(booking.date, booking.time)}</span>
                    <span>{booking.notes || "No notes added"}</span>
                  </div>

                  <div className="dashboard-action-row">
                    <Link
                      className="button button-card-secondary"
                      to={`/customer/bookings/${booking.id}`}
                    >
                      View details
                    </Link>
                    <Link
                      className="button button-card-secondary"
                      to={`/customer/bookings/${booking.id}#booking-chat`}
                    >
                      Open chat
                    </Link>
                  </div>
                </article>
              ))}

              {!data.bookings.length ? (
                <div className="dashboard-empty-note">
                  No bookings yet. Once you request a service, the full timeline will show here.
                </div>
              ) : null}
            </div>
          </div>
        ) : null}

        {section === "favorites" && data ? (
          <div className="dashboard-stack">
            <article className="dashboard-card">
              <div className="dashboard-card__header">
                <div>
                  <span className="eyebrow">Saved services</span>
                  <h2>Your booking shortlist</h2>
                </div>
                <Link className="button button-primary" to="/search">
                  Discover more
                </Link>
              </div>
              <p className="dashboard-card__copy">
                Keep trusted providers here, compare them later, and book when the time is right.
              </p>
            </article>

            <div className="service-grid">
              {data.services.map((service) => (
                <ServiceCard
                  key={service.id}
                  service={service}
                  action={
                    <button
                      type="button"
                      className="button button-card-secondary"
                      onClick={() => handleRemoveFavorite(service.id)}
                    >
                      Remove
                    </button>
                  }
                />
              ))}
            </div>

            {!data.services.length ? (
              <div className="dashboard-empty-note">
                You have not saved any services yet. Use favorites to build a quick local shortlist.
              </div>
            ) : null}
          </div>
        ) : null}

        {section === "reviews" && data ? (
          <div className="dashboard-stack">
            <div className="metrics-grid">
              <article className="metric-card">
                <span>Average rating</span>
                <strong>{data.stats.averageRating}</strong>
              </article>
              <article className="metric-card">
                <span>Total reviews</span>
                <strong>{data.stats.totalReviews}</strong>
              </article>
              <article className="metric-card">
                <span>Five star reviews</span>
                <strong>{data.stats.fiveStarReviews}</strong>
              </article>
            </div>

            <div className="dashboard-edit-grid">
              {data.reviews.map((review) => (
                <article key={review.id} className="dashboard-card dashboard-review-editor-card">
                  <div className="dashboard-card__header">
                    <div>
                      <span className="eyebrow">Editable review</span>
                      <h2>{review.booking?.service?.title || "Completed booking"}</h2>
                    </div>
                    <span className="dashboard-rating-pill">{review.rating}/5</span>
                  </div>

                  <div className="review-editor">
                    <select
                      value={reviewDrafts[review.id]?.rating || "5"}
                      onChange={(event) =>
                        setReviewDrafts((current) => ({
                          ...current,
                          [review.id]: {
                            ...current[review.id],
                            rating: event.target.value,
                          },
                        }))
                      }
                    >
                      <option value="5">5</option>
                      <option value="4">4</option>
                      <option value="3">3</option>
                      <option value="2">2</option>
                      <option value="1">1</option>
                    </select>
                    <textarea
                      rows="4"
                      value={reviewDrafts[review.id]?.comment || ""}
                      onChange={(event) =>
                        setReviewDrafts((current) => ({
                          ...current,
                          [review.id]: {
                            ...current[review.id],
                            comment: event.target.value,
                          },
                        }))
                      }
                    />
                    <button
                      type="button"
                      className="button button-secondary"
                      onClick={() => handleReviewUpdate(review.id)}
                    >
                      Save review
                    </button>
                  </div>
                </article>
              ))}

              {!data.reviews.length ? (
                <div className="dashboard-empty-note">
                  No reviews to edit yet. Completed jobs with feedback will show here.
                </div>
              ) : null}
            </div>
          </div>
        ) : null}

        {section === "wallet" && data ? (
          <div className="dashboard-stack">
            <div className="metrics-grid">
              <article className="metric-card">
                <span>Total spent</span>
                <strong>{formatCurrency(data.stats.totalSpent)}</strong>
              </article>
              <article className="metric-card">
                <span>Completed payments</span>
                <strong>{data.stats.completedPayments}</strong>
              </article>
              <article className="metric-card">
                <span>Pending payments</span>
                <strong>{data.stats.pendingPayments}</strong>
              </article>
            </div>

            <div className="dashboard-activity-list">
              {data.payments.map((payment) => (
                <article key={payment.id} className="dashboard-activity-card">
                  <div className="dashboard-activity-card__top">
                    <div className="dashboard-activity-card__title">
                      <strong>{payment.service?.title || "Completed service"}</strong>
                      <small>{payment.transactionId}</small>
                    </div>
                    <span className={getStatusClassName(payment.status)}>
                      {getStatusLabel(payment.status)}
                    </span>
                  </div>
                  <div className="dashboard-activity-card__meta">
                    <span>{formatCurrency(payment.amount)}</span>
                    <span>{formatDate(payment.date)}</span>
                  </div>
                </article>
              ))}

              {!data.payments.length ? (
                <div className="dashboard-empty-note">
                  Payment activity will appear here after your completed LocalFix bookings.
                </div>
              ) : null}
            </div>
          </div>
        ) : null}

        {section === "settings" && data ? (
          <div className="dashboard-settings-layout">
            <aside className="dashboard-profile-card">
              <span className="eyebrow">Account snapshot</span>
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
                  <span>Address</span>
                  <strong>{profileForm.address || "Add your address"}</strong>
                </div>
                <div>
                  <span>Phone</span>
                  <strong>{profileForm.phone || "Add your phone"}</strong>
                </div>
                <div>
                  <span>Role</span>
                  <strong>Customer</strong>
                </div>
              </div>
            </aside>

            <div className="dashboard-settings-stack">
              <form className="dashboard-form-panel stack-form" onSubmit={handleProfileSave}>
                <div className="dashboard-card__header">
                  <div>
                    <span className="eyebrow">Profile</span>
                    <h2>Update your details</h2>
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
                  value={profileForm.address}
                  onChange={(event) =>
                    setProfileForm((current) => ({ ...current, address: event.target.value }))
                  }
                  placeholder="Address"
                />
                <input
                  type="text"
                  value={profileForm.phone}
                  onChange={(event) =>
                    setProfileForm((current) => ({ ...current, phone: event.target.value }))
                  }
                  placeholder="Phone"
                />
                <button type="submit" className="button button-primary">
                  Save profile
                </button>
              </form>

              <form className="dashboard-form-panel stack-form" onSubmit={handlePasswordChange}>
                <div className="dashboard-card__header">
                  <div>
                    <span className="eyebrow">Security</span>
                    <h2>Change password</h2>
                  </div>
                </div>

                <input
                  type="password"
                  placeholder="Current password"
                  value={passwordForm.currentPassword}
                  onChange={(event) =>
                    setPasswordForm((current) => ({
                      ...current,
                      currentPassword: event.target.value,
                    }))
                  }
                />
                <input
                  type="password"
                  placeholder="New password"
                  value={passwordForm.newPassword}
                  onChange={(event) =>
                    setPasswordForm((current) => ({
                      ...current,
                      newPassword: event.target.value,
                    }))
                  }
                />
                <input
                  type="password"
                  placeholder="Confirm new password"
                  value={passwordForm.confirmPassword}
                  onChange={(event) =>
                    setPasswordForm((current) => ({
                      ...current,
                      confirmPassword: event.target.value,
                    }))
                  }
                />
                <button type="submit" className="button button-secondary">
                  Update password
                </button>
              </form>
            </div>
          </div>
        ) : null}

        {!currentUser ? (
          <div className="empty-panel">
            Please <Link to="/login">log in</Link> to access the customer workspace.
          </div>
        ) : null}
      </DashboardShell>
    </div>
  );
}
