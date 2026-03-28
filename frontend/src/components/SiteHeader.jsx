import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";

import {
  apiRequest,
  clearCachedValue,
  clearCachedValuesByPrefix,
} from "../api/client";
import NotificationMenu from "./NotificationMenu";
import { useAppContext } from "../context/AppContext";

const marketingLinks = [
  { label: "Home", to: "/" },
  { label: "Services", to: "/search" },
  { label: "How it works", to: "/#how-it-works" },
];

function isMarketingLinkActive(location, destination) {
  const { pathname, hash } = location;

  if (destination === "/") {
    return pathname === "/" && hash !== "#how-it-works";
  }

  if (destination === "/search") {
    return pathname.startsWith("/search") || pathname.startsWith("/services");
  }

  if (destination === "/#how-it-works") {
    return pathname === "/" && hash === "#how-it-works";
  }

  return false;
}

export default function SiteHeader() {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser, setCurrentUser, showNotice } = useAppContext();

  const handleLogout = async () => {
    try {
      await apiRequest("/api/auth/logout", {
        method: "POST",
      });
      clearCachedValue("session-user");
      clearCachedValuesByPrefix("customer:");
      clearCachedValuesByPrefix("provider:");
      clearCachedValuesByPrefix("admin:");
      clearCachedValuesByPrefix("service-details:");
      clearCachedValuesByPrefix("booking-details:");
      setCurrentUser(null);
      showNotice("success", "Signed out successfully.");
      navigate("/", { replace: true });
    } catch (error) {
      showNotice("error", error.message);
    }
  };

  return (
    <header className="site-header">
      <div className="site-header__inner">
        <Link to="/" className="brand-mark">
          <div className="brand-mark__wordmark">
            <strong>
              Local<span>Fix</span>
            </strong>
            <small>Find and book local services</small>
          </div>
        </Link>

        <nav className="site-nav" aria-label="Main navigation">
          {marketingLinks.map((link) => (
            <Link
              key={link.to}
              className={
                isMarketingLinkActive(location, link.to)
                  ? "site-nav__link is-active"
                  : "site-nav__link"
              }
              to={link.to}
            >
              {link.label}
            </Link>
          ))}

          {currentUser?.role === "customer" && (
            <NavLink
              className={({ isActive }) =>
                isActive ? "site-nav__link is-active" : "site-nav__link"
              }
              to="/customer"
            >
              Dashboard
            </NavLink>
          )}

          {currentUser?.role === "provider" && (
            <NavLink
              className={({ isActive }) =>
                isActive ? "site-nav__link is-active" : "site-nav__link"
              }
              to="/provider"
            >
              Provider Hub
            </NavLink>
          )}

          {currentUser?.role === "admin" && (
            <NavLink
              className={({ isActive }) =>
                isActive ? "site-nav__link is-active" : "site-nav__link"
              }
              to="/admin"
            >
              Admin
            </NavLink>
          )}
        </nav>

        <div className="site-header__actions">
          {currentUser ? (
            <>
              <NotificationMenu />
              <div className="user-chip">
                <span>{currentUser.username}</span>
                <small>{currentUser.role}</small>
              </div>
              <button type="button" className="button button-ghost" onClick={handleLogout}>
                Logout
              </button>
            </>
          ) : (
            <>
              <NavLink to="/signup?role=provider" className="provider-badge">
                Become a Provider
              </NavLink>
              <NavLink to="/login" className="button button-ghost">
                Log in
              </NavLink>
              <NavLink to="/signup" className="button button-primary">
                Sign up
              </NavLink>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
