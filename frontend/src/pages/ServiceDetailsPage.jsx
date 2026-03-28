import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import {
  apiRequest,
  clearCachedValuesByPrefix,
  readCachedValue,
  writeCachedValue,
} from "../api/client";
import Loader from "../components/Loader";
import ServiceCard from "../components/ServiceCard";
import { useAppContext } from "../context/AppContext";

const SERVICE_DETAILS_CACHE_TTL = 1000 * 60 * 5;

function getServiceDetailsCacheKey(serviceId, viewerId) {
  return `service-details:${serviceId}:${viewerId || "guest"}`;
}

function getInitials(label) {
  return String(label || "LF")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("");
}

function formatDateLabel(value, fallback) {
  return value ? new Date(value).toLocaleDateString() : fallback;
}

export default function ServiceDetailsPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { currentUser, refreshSession, showNotice } = useAppContext();
  const viewerCacheKey = useMemo(
    () => getServiceDetailsCacheKey(id, currentUser?.id),
    [currentUser?.id, id],
  );
  const [details, setDetails] = useState(() =>
    readCachedValue(viewerCacheKey, SERVICE_DETAILS_CACHE_TTL),
  );
  const [loading, setLoading] = useState(() =>
    !readCachedValue(viewerCacheKey, SERVICE_DETAILS_CACHE_TTL),
  );
  const [submittingBooking, setSubmittingBooking] = useState(false);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [bookingForm, setBookingForm] = useState({
    date: "",
    time: "",
    notes: "",
  });
  const [reviewForm, setReviewForm] = useState({
    rating: "5",
    comment: "",
  });

  useEffect(() => {
    const cachedDetails = readCachedValue(viewerCacheKey, SERVICE_DETAILS_CACHE_TTL);
    let isActive = true;

    if (cachedDetails) {
      setDetails(cachedDetails);
      setLoading(false);
    } else {
      setDetails(null);
      setLoading(true);
    }

    const loadDetails = async () => {
      try {
        const data = await apiRequest(`/api/services/${id}`);
        if (!isActive) {
          return;
        }
        setDetails(data);
        writeCachedValue(viewerCacheKey, data);
      } catch (error) {
        if (!cachedDetails && isActive) {
          showNotice("error", error.message);
        }
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    };

    loadDetails();

    return () => {
      isActive = false;
    };
  }, [id, showNotice, viewerCacheKey]);

  const reloadDetails = async () => {
    const data = await apiRequest(`/api/services/${id}`);
    setDetails(data);
    writeCachedValue(viewerCacheKey, data);
  };

  const toggleFavorite = async () => {
    if (!currentUser) {
      showNotice("error", "Please log in first.");
      navigate("/login");
      return;
    }

    try {
      if (details.service.isFavorite) {
        await apiRequest(`/api/customer/favorites/${id}`, {
          method: "DELETE",
        });
      } else {
        await apiRequest(`/api/customer/favorites/${id}`, {
          method: "POST",
        });
      }

      clearCachedValuesByPrefix(`service-details:${id}:`);
      clearCachedValuesByPrefix(`customer:${currentUser.id}:`);
      await refreshSession();
      await reloadDetails();
      showNotice(
        "success",
        details.service.isFavorite ? "Removed from favorites." : "Saved to favorites.",
      );
    } catch (error) {
      showNotice("error", error.message);
    }
  };

  const submitBooking = async (event) => {
    event.preventDefault();
    setSubmittingBooking(true);

    try {
      const response = await apiRequest("/api/bookings", {
        method: "POST",
        body: {
          serviceId: id,
          ...bookingForm,
        },
      });
      setBookingForm({
        date: "",
        time: "",
        notes: "",
      });
      clearCachedValuesByPrefix(`service-details:${id}:`);
      clearCachedValuesByPrefix(`customer:${currentUser.id}:`);
      if (details.service.owner?.id) {
        clearCachedValuesByPrefix(`provider:${details.service.owner.id}:`);
      }
      showNotice("success", "Booking request sent.");
      navigate(`/booking-confirm/${response.booking.id}`, {
        state: { booking: response.booking },
      });
    } catch (error) {
      showNotice("error", error.message);
    } finally {
      setSubmittingBooking(false);
    }
  };

  const submitReview = async (event) => {
    event.preventDefault();
    setSubmittingReview(true);

    try {
      await apiRequest(`/api/services/${id}/reviews`, {
        method: "POST",
        body: reviewForm,
      });
      setReviewForm({
        rating: "5",
        comment: "",
      });
      clearCachedValuesByPrefix(`service-details:${id}:`);
      clearCachedValuesByPrefix(`customer:${currentUser.id}:`);
      clearCachedValuesByPrefix("home-page");
      if (details.service.owner?.id) {
        clearCachedValuesByPrefix(`provider:${details.service.owner.id}:`);
      }
      showNotice("success", "Review submitted successfully.");
      await reloadDetails();
    } catch (error) {
      showNotice("error", error.message);
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) {
    return <Loader label="Loading service details..." />;
  }

  if (!details) {
    return <section className="page-shell">Unable to load this service.</section>;
  }

  const formattedPrice = Number(details.service.price || 0).toLocaleString("en-IN");
  const reviewCount = Number(details.service.reviewCount || 0);
  const bookingCount = Number(details.service.bookingCount || 0);
  const providerName = details.service.owner?.username || "Provider";
  const providerInitials = getInitials(providerName);
  const ratingLabel = details.service.averageRating
    ? `${details.service.averageRating}/5`
    : "New listing";
  const reviewLabel = reviewCount
    ? `${reviewCount} customer review${reviewCount === 1 ? "" : "s"}`
    : "Be the first to review";
  const bookingLabel = bookingCount
    ? `${bookingCount} booking request${bookingCount === 1 ? "" : "s"} tracked`
    : "Ready for first request";
  const serviceHighlights = [
    {
      label: "Availability",
      value: details.service.owner?.workingHours || "Flexible working hours",
    },
    {
      label: "Service area",
      value: details.service.location || "Neighborhood-based coverage",
    },
    {
      label: "Trust signal",
      value: reviewCount ? "Rated by real customers" : "Fresh LocalFix listing",
    },
    {
      label: "Booking flow",
      value: bookingLabel,
    },
  ];
  const serviceChecklist = [
    `Handled by ${providerName}.`,
    reviewCount
      ? `Backed by ${reviewCount} customer review${reviewCount === 1 ? "" : "s"}.`
      : "Open for the first customer review.",
    details.service.location
      ? `Serves ${details.service.location} and nearby areas.`
      : "Available for nearby local requests.",
    "Booking, confirmation, and review flow all stay inside LocalFix.",
  ];

  return (
    <div className="page-shell localfix-detail-page">
      <section className="localfix-detail-hero">
        <div className="localfix-detail-hero__media">
          <img src={details.service.image.url} alt={details.service.title} />
          <div className="localfix-detail-hero__floating">
            <span>{details.service.category}</span>
            <strong>INR {formattedPrice}</strong>
            <small>Starting visit quote</small>
          </div>
        </div>

        <div className="localfix-detail-hero__content">
          <div className="localfix-detail-breadcrumbs">
            <Link to="/search">Services</Link>
            <span>/</span>
            <span>{details.service.category}</span>
          </div>

          <div className="localfix-detail-heading">
            <span className="eyebrow">Verified local service</span>
            <h1>{details.service.title}</h1>
            <p>{details.service.description}</p>
          </div>

          <div className="localfix-detail-tags">
            <span>{reviewLabel}</span>
            <span>{providerName}</span>
            <span>{details.service.location}</span>
          </div>

          <div className="localfix-detail-metrics">
            <article>
              <strong>INR {formattedPrice}</strong>
              <span>Starting price</span>
            </article>
            <article>
              <strong>{ratingLabel}</strong>
              <span>Marketplace rating</span>
            </article>
            <article>
              <strong>{reviewCount}</strong>
              <span>Reviews</span>
            </article>
            <article>
              <strong>{bookingCount || 0}</strong>
              <span>Requests tracked</span>
            </article>
          </div>

          <div className="localfix-detail-provider">
            <div className="localfix-detail-provider__avatar">{providerInitials}</div>
            <div className="localfix-detail-provider__copy">
              <strong>{providerName}</strong>
              <p>{details.service.owner?.bio || "Ready to take on nearby service requests."}</p>
            </div>
            <div className="localfix-detail-provider__chips">
              <span>{details.service.owner?.workingHours || "Flexible schedule"}</span>
              <span>{reviewCount ? "Customer reviewed" : "Open for new bookings"}</span>
            </div>
          </div>

          <div className="localfix-detail-actions">
            {currentUser?.role === "customer" ? (
              <button type="button" className="button button-ghost" onClick={toggleFavorite}>
                {details.service.isFavorite ? "Remove favorite" : "Save favorite"}
              </button>
            ) : null}

            <Link
              className="button button-card-secondary"
              to={`/search?category=${encodeURIComponent(details.service.category)}`}
            >
              Browse similar
            </Link>

            {details.service.isOwner ? (
              <Link
                className="button button-primary"
                to={`/provider/services/${details.service.id}/edit`}
              >
                Edit listing
              </Link>
            ) : null}
          </div>
        </div>
      </section>

      <section className="localfix-detail-grid">
        <div className="localfix-detail-main">
          <article className="localfix-detail-card">
            <div className="localfix-detail-card__head">
              <div>
                <span className="eyebrow">Service overview</span>
                <h2>What customers can expect</h2>
              </div>
            </div>

            <p className="localfix-detail-copy">{details.service.description}</p>

            <div className="localfix-detail-highlight-grid">
              {serviceHighlights.map((item) => (
                <article key={item.label} className="localfix-detail-highlight">
                  <span>{item.label}</span>
                  <strong>{item.value}</strong>
                </article>
              ))}
            </div>
          </article>

          <article className="localfix-detail-card">
            <div className="localfix-detail-card__head">
              <div>
                <span className="eyebrow">Why this listing works</span>
                <h2>Clear details before you book</h2>
              </div>
            </div>

            <div className="localfix-detail-checklist">
              {serviceChecklist.map((item) => (
                <div key={item} className="localfix-detail-checklist__item">
                  <span className="localfix-detail-checklist__dot" />
                  <p>{item}</p>
                </div>
              ))}
            </div>
          </article>

          <article className="localfix-detail-card">
            <div className="localfix-detail-card__head">
              <div>
                <span className="eyebrow">Customer reviews</span>
                <h2>What people are saying</h2>
              </div>
            </div>

            <div className="localfix-detail-review-list">
              {details.reviews.map((review) => (
                <article key={review.id} className="localfix-detail-review">
                  <div className="localfix-detail-review__top">
                    <div className="localfix-detail-review__identity">
                      <div className="localfix-detail-review__avatar">
                        {getInitials(review.user?.username || "Customer")}
                      </div>
                      <div>
                        <strong>{review.user?.username || "Customer"}</strong>
                        <small>
                          {formatDateLabel(
                            review.booking?.date || review.createdAt,
                            "Recent review",
                          )}
                        </small>
                      </div>
                    </div>
                    <span className="localfix-detail-review__score">{`${review.rating}/5`}</span>
                  </div>
                  <p>{review.comment || "Completed job with positive feedback."}</p>
                </article>
              ))}

              {!details.reviews.length ? (
                <div className="empty-panel localfix-detail-empty">
                  No reviews yet. The first completed booking can set the tone here.
                </div>
              ) : null}
            </div>
          </article>

          {details.relatedServices.length ? (
            <section className="localfix-detail-related">
              <div className="localfix-detail-card__head">
                <div>
                  <span className="eyebrow">Similar services</span>
                  <h2>Keep exploring</h2>
                </div>
              </div>

              <div className="service-grid">
                {details.relatedServices.map((service) => (
                  <ServiceCard key={service.id} service={service} />
                ))}
              </div>
            </section>
          ) : null}
        </div>

        <aside className="localfix-detail-aside">
          <article className="localfix-detail-card localfix-detail-card--accent">
            <span className="eyebrow">Quick summary</span>
            <div className="localfix-detail-price">
              <strong>INR {formattedPrice}</strong>
              <span>Starting quote</span>
            </div>

            <div className="localfix-detail-summary-list">
              <div>
                <span>Category</span>
                <strong>{details.service.category}</strong>
              </div>
              <div>
                <span>Location</span>
                <strong>{details.service.location}</strong>
              </div>
              <div>
                <span>Rating</span>
                <strong>{ratingLabel}</strong>
              </div>
            </div>

            <p className="localfix-detail-note">
              {reviewCount
                ? `Backed by ${reviewCount} review${reviewCount === 1 ? "" : "s"} and ${bookingLabel.toLowerCase()}.`
                : "Fresh listing with an active provider profile and open booking availability."}
            </p>
          </article>

          {currentUser?.role === "customer" ? (
            <form
              id="localfix-booking-card"
              className="localfix-detail-card localfix-detail-form stack-form"
              onSubmit={submitBooking}
            >
              <div className="localfix-detail-card__head">
                <div>
                  <span className="eyebrow">Book now</span>
                  <h2>Request this service</h2>
                </div>
              </div>

              <input
                type="date"
                value={bookingForm.date}
                onChange={(event) =>
                  setBookingForm((current) => ({ ...current, date: event.target.value }))
                }
                required
              />
              <input
                type="time"
                value={bookingForm.time}
                onChange={(event) =>
                  setBookingForm((current) => ({ ...current, time: event.target.value }))
                }
                required
              />
              <textarea
                rows="4"
                value={bookingForm.notes}
                onChange={(event) =>
                  setBookingForm((current) => ({ ...current, notes: event.target.value }))
                }
                placeholder="Describe your requirement"
              />
              <button type="submit" className="button button-primary" disabled={submittingBooking}>
                {submittingBooking ? "Sending..." : "Send booking request"}
              </button>
            </form>
          ) : (
            <div className="localfix-detail-card localfix-detail-form">
              <div className="localfix-detail-card__head">
                <div>
                  <span className="eyebrow">Booking access</span>
                  <h2>Customer account required</h2>
                </div>
              </div>

              <p className="localfix-detail-copy">
                {currentUser
                  ? "Only customer accounts can place bookings and leave completion reviews."
                  : "Sign in as a customer to place a booking and leave a review after the service is completed."}
              </p>

              {!currentUser ? (
                <Link className="button button-primary" to="/login">
                  Sign in to continue
                </Link>
              ) : null}
            </div>
          )}

          {currentUser?.role === "customer" && details.canReview ? (
            <form
              className="localfix-detail-card localfix-detail-form stack-form"
              onSubmit={submitReview}
            >
              <div className="localfix-detail-card__head">
                <div>
                  <span className="eyebrow">Eligible to review</span>
                  <h2>Share your experience</h2>
                </div>
              </div>

              <select
                value={reviewForm.rating}
                onChange={(event) =>
                  setReviewForm((current) => ({ ...current, rating: event.target.value }))
                }
              >
                <option value="5">5 - Excellent</option>
                <option value="4">4 - Great</option>
                <option value="3">3 - Good</option>
                <option value="2">2 - Needs improvement</option>
                <option value="1">1 - Poor</option>
              </select>
              <textarea
                rows="4"
                value={reviewForm.comment}
                onChange={(event) =>
                  setReviewForm((current) => ({ ...current, comment: event.target.value }))
                }
                placeholder="How did the service go?"
              />
              <button type="submit" className="button button-secondary" disabled={submittingReview}>
                {submittingReview ? "Submitting..." : "Submit review"}
              </button>
            </form>
          ) : null}
        </aside>
      </section>
    </div>
  );
}
