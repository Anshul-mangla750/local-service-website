import { Link } from "react-router-dom";

export default function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="site-footer__inner">
        <div className="site-footer__brand">
          <strong>
            Local<span>Fix</span>
          </strong>
          <p>
            Verified electricians, plumbers, AC technicians, carpenters, and home-service
            professionals in one cleaner local marketplace.
          </p>
        </div>

        <div className="site-footer__links">
          <Link to="/search">Services</Link>
          <Link to="/signup?role=provider">Providers</Link>
          <Link to="/login">Log in</Link>
          <Link to="/signup">Sign up</Link>
        </div>

        <div className="site-footer__meta">
          <span>Verified local pros</span>
          <span>Book, review, return</span>
          <span>{new Date().getFullYear()} LocalFix</span>
        </div>
      </div>
    </footer>
  );
}
