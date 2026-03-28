import { Link } from "react-router-dom";

function getInitials(label) {
  return String(label || "LF")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("");
}

function getBadge(service) {
  if (service.averageRating && service.averageRating >= 4.8) {
    return { label: "Top Rated", verified: false };
  }

  if ((service.reviewCount || 0) > 0) {
    return { label: "Verified", verified: true };
  }

  return null;
}

export default function ServiceCard({ service, action }) {
  const providerName = service.owner?.username || "Verified provider";
  const badge = getBadge(service);

  return (
    <article className="service-card">
      <Link className="service-card__image" to={`/services/${service.id}`}>
        <img src={service.image.url} alt={service.title} />
        {badge ? (
          <span
            className={
              badge.verified ? "service-card__badge is-verified" : "service-card__badge"
            }
          >
            {badge.label}
          </span>
        ) : null}
      </Link>

      <div className="service-card__content">
        <div className="service-card__eyebrow">{service.category}</div>
        <h3>{service.title}</h3>
        <p className="service-card__summary">
          {service.description || "Trusted local help for repairs, maintenance, and upgrades."}
        </p>

        <div className="service-card__provider">
          <div className="service-card__avatar">{getInitials(providerName)}</div>
          <div>
            <strong>{providerName}</strong>
            <span>{service.location || "Nearby service area"}</span>
          </div>
        </div>

        <div className="service-card__meta">
          <div className="service-card__rating">
            <strong>{service.averageRating ? `${service.averageRating}/5` : "New"}</strong>
            <span>
              {service.reviewCount ? `${service.reviewCount} reviews` : "Just added"}
            </span>
          </div>
          <div className="service-card__price">
            INR {service.price}
            <span>starting</span>
          </div>
        </div>
      </div>

      <div className="service-card__actions">
        <Link className="button button-primary" to={`/services/${service.id}`}>
          View details
        </Link>
        {action || (
          <Link
            className="button button-card-secondary"
            to={`/search?category=${encodeURIComponent(service.category)}`}
          >
            More like this
          </Link>
        )}
      </div>
    </article>
  );
}
