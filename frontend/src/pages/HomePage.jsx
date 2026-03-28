import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { apiRequest, readCachedValue, writeCachedValue } from "../api/client";
import Loader from "../components/Loader";
import ServiceCard from "../components/ServiceCard";

const HOME_CACHE_KEY = "home-page";
const HOME_CACHE_TTL = 1000 * 60 * 5;
const CATEGORY_TONES = {
  Electrician: { accent: "#f5a623", surface: "#fff3d2" },
  Plumber: { accent: "#1d9e75", surface: "#e8f6f1" },
  "AC Repair": { accent: "#4b82f2", surface: "#e7efff" },
  Carpenter: { accent: "#9a6732", surface: "#f5e8d7" },
  Painter: { accent: "#b35ce0", surface: "#f7ecff" },
  Cleaning: { accent: "#16a085", surface: "#e7f8f2" },
};
const PROCESS_STEPS = [
  {
    number: "1",
    title: "Search service",
    description: "Type what you need fixed and browse trusted local categories in seconds.",
  },
  {
    number: "2",
    title: "Book a slot",
    description: "Compare providers, pricing, and reviews before choosing the right time.",
  },
  {
    number: "3",
    title: "Get it done",
    description: "Track the request, confirm the visit, and stay updated throughout the job.",
  },
  {
    number: "4",
    title: "Pay and review",
    description: "Complete the workflow with secure payments and genuine customer feedback.",
  },
];
const REVIEW_TONES = ["#e8563a", "#1d9e75", "#f5a623", "#5574f3"];

function getCategoryTone(categoryName) {
  return CATEGORY_TONES[categoryName] || { accent: "#e8563a", surface: "#fff0ea" };
}

function getInitials(label) {
  return String(label || "LF")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("");
}

function formatNumber(value) {
  return Number(value || 0).toLocaleString();
}

export default function HomePage() {
  const navigate = useNavigate();
  const cachedHomeRef = useRef(readCachedValue(HOME_CACHE_KEY, HOME_CACHE_TTL));
  const [homeData, setHomeData] = useState(() => cachedHomeRef.current);
  const [loading, setLoading] = useState(() => !cachedHomeRef.current);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const loadHome = async () => {
      try {
        const data = await apiRequest("/api/home");
        setHomeData(data);
        writeCachedValue(HOME_CACHE_KEY, data);
      } catch (requestError) {
        if (!cachedHomeRef.current) {
          setError(requestError.message);
        }
      } finally {
        setLoading(false);
      }
    };

    loadHome();
  }, []);

  const goToSearch = ({ nextSearch = searchTerm, nextCategory = selectedCategory } = {}) => {
    const params = new URLSearchParams();

    if (nextSearch.trim()) {
      params.set("search", nextSearch.trim());
    }

    if (nextCategory) {
      params.set("category", nextCategory);
    }

    navigate(`/search${params.toString() ? `?${params}` : ""}`);
  };

  const handleSearch = (event) => {
    event.preventDefault();
    goToSearch();
  };

  const handleQuickCategory = (categoryName) => {
    setSelectedCategory(categoryName);
    goToSearch({
      nextSearch: searchTerm,
      nextCategory: categoryName,
    });
  };

  if (loading) {
    return <Loader label="Loading LocalFix..." />;
  }

  if (error) {
    return <section className="page-shell">Unable to load the homepage: {error}</section>;
  }

  return (
    <div className="page-shell page-shell-home">
      <section className="localfix-hero">
        <div className="localfix-hero__copy">
          <span className="localfix-hero__label">Trusted across local neighborhoods</span>
          <h1>
            Find and Book
            <span> Local Services </span>
            Instantly
          </h1>
          <p>{homeData.spotlight.subheadline}</p>

          <div className="localfix-hero__stats">
            <div className="localfix-stat">
              <strong>{formatNumber(homeData.stats.providersCount)}+</strong>
              <span>Verified providers</span>
            </div>
            <div className="localfix-stat">
              <strong>{formatNumber(homeData.stats.completedJobs)}+</strong>
              <span>Jobs completed</span>
            </div>
            <div className="localfix-stat">
              <strong>{homeData.stats.averageRating || "New"}</strong>
              <span>Average rating</span>
            </div>
          </div>
        </div>

        <form className="localfix-search-card" onSubmit={handleSearch}>
          <h2>What do you need fixed?</h2>

          <label className="localfix-field">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <circle cx="11" cy="11" r="7" />
              <path d="M20 20L16.65 16.65" />
            </svg>
            <input
              type="text"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Electrician, plumber, AC repair..."
            />
          </label>

          <label className="localfix-field">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M5 7H19" />
              <path d="M7 12H17" />
              <path d="M9 17H15" />
            </svg>
            <select
              value={selectedCategory}
              onChange={(event) => setSelectedCategory(event.target.value)}
            >
              <option value="">All categories</option>
              {homeData.categories.map((category) => (
                <option key={category.name} value={category.name}>
                  {category.name}
                </option>
              ))}
            </select>
          </label>

          <button type="submit" className="localfix-search-card__button">
            Search Services
          </button>

          <div className="localfix-search-card__popular">
            <span>Popular</span>
            <div className="localfix-quick-tags">
              {homeData.categories.slice(0, 5).map((category) => (
                <button
                  key={category.name}
                  type="button"
                  className="localfix-quick-tag"
                  onClick={() => handleQuickCategory(category.name)}
                >
                  {category.name}
                </button>
              ))}
            </div>
          </div>
        </form>
      </section>

      <section className="localfix-section" id="home-categories">
        <div className="localfix-section__head">
          <div>
            <span className="eyebrow">Browse by category</span>
            <h2>Built for the services people actually need nearby</h2>
          </div>
          <Link className="localfix-section__link" to="/search">
            View all
          </Link>
        </div>

        <div className="localfix-category-grid">
          {homeData.categories.map((category) => {
            const tone = getCategoryTone(category.name);

            return (
              <Link
                key={category.name}
                className="localfix-category-card"
                to={`/search?category=${encodeURIComponent(category.name)}`}
                style={{
                  "--category-accent": tone.accent,
                  "--category-surface": tone.surface,
                }}
              >
                <div className="localfix-category-card__visual">
                  {category.image?.url ? (
                    <img src={category.image.url} alt={category.name} />
                  ) : (
                    <span>{getInitials(category.name)}</span>
                  )}
                </div>
                <div className="localfix-category-card__copy">
                  <strong>{category.name}</strong>
                  <span>{formatNumber(category.count)} active listings</span>
                  <small>Average price from INR {formatNumber(category.averagePrice)}</small>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="localfix-section">
        <div className="localfix-section__head">
          <div>
            <span className="eyebrow">Featured services</span>
            <h2>Featured Services Near You</h2>
          </div>
          <Link className="localfix-section__link" to="/search">
            See all
          </Link>
        </div>

        <div className="service-grid">
          {homeData.featuredServices.map((service) => (
            <ServiceCard key={service.id} service={service} />
          ))}
        </div>
      </section>

      <section className="localfix-process" id="how-it-works">
        <div className="localfix-process__inner">
          <div className="localfix-section__head">
            <div>
              <span className="eyebrow">How LocalFix works</span>
              <h2>From search to booking in four simple steps</h2>
            </div>
          </div>

          <div className="localfix-step-grid">
            {PROCESS_STEPS.map((step) => (
              <article key={step.number} className="localfix-step">
                <div className="localfix-step__number">{step.number}</div>
                <h3>{step.title}</h3>
                <p>{step.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="localfix-section">
        <div className="localfix-section__head">
          <div>
            <span className="eyebrow">Recent reviews</span>
            <h2>What customers say</h2>
          </div>
          <Link className="localfix-section__link" to="/search">
            Explore services
          </Link>
        </div>

        <div className="localfix-review-grid">
          {homeData.testimonials.slice(0, 3).map((review, index) => (
            <article
              key={review.id}
              className="localfix-review-card"
              style={{ "--review-tone": REVIEW_TONES[index % REVIEW_TONES.length] }}
            >
              <div className="localfix-review-card__head">
                <div className="localfix-review-card__avatar">
                  {getInitials(review.user?.username || "LocalFix")}
                </div>
                <div>
                  <strong>{review.user?.username || "Customer"}</strong>
                  <span>{review.booking?.service?.title || "Completed service"}</span>
                </div>
              </div>
              <div className="localfix-review-card__rating">Rating {review.rating}/5</div>
              <p>{review.comment || "Completed successfully and left a positive impression."}</p>
              <small>
                {review.createdAt
                  ? new Date(review.createdAt).toLocaleDateString()
                  : "Recently posted"}
              </small>
            </article>
          ))}
        </div>
      </section>

      <section className="localfix-provider-cta" id="providers">
        <div>
          <span className="eyebrow">For professionals</span>
          <h2>Are you a service professional?</h2>
          <p>
            Join {formatNumber(homeData.stats.providersCount)}+ verified providers on
            LocalFix and grow your bookings with a cleaner local marketplace.
          </p>
        </div>

        <div className="localfix-provider-cta__actions">
          <Link className="button button-primary" to="/signup?role=provider">
            Register as Provider
          </Link>
          <Link className="button button-secondary" to="/provider">
            See provider hub
          </Link>
        </div>
      </section>
    </div>
  );
}
