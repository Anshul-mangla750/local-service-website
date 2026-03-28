import { Link } from "react-router-dom";

export default function NotFoundPage() {
  return (
    <section className="page-shell">
      <div className="empty-panel">
        <h1>Page not found</h1>
        <p>The LocalFix page you requested does not exist.</p>
        <Link className="button button-primary" to="/">
          Return to LocalFix
        </Link>
      </div>
    </section>
  );
}
