import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { apiRequest } from "../api/client";
import { useAppContext } from "../context/AppContext";

export default function LoginPage() {
  const navigate = useNavigate();
  const { refreshSession, showNotice } = useAppContext();
  const [form, setForm] = useState({
    username: "",
    password: "",
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);

    try {
      const data = await apiRequest("/api/auth/login", {
        method: "POST",
        body: form,
      });
      await refreshSession();
      showNotice("success", data.message);
      navigate(data.redirectTo || "/");
    } catch (error) {
      showNotice("error", error.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="auth-shell">
      <div className="auth-panel">
        <span className="eyebrow">Welcome back</span>
        <h1>Log in to your LocalFix workspace</h1>
        <p>Use one account to search services, manage bookings, review professionals, and operate provider or admin workflows.</p>

        <form className="stack-form" onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Username"
            value={form.username}
            onChange={(event) =>
              setForm((current) => ({ ...current, username: event.target.value }))
            }
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={form.password}
            onChange={(event) =>
              setForm((current) => ({ ...current, password: event.target.value }))
            }
            required
          />
          <button type="submit" className="button button-primary" disabled={submitting}>
            {submitting ? "Signing in..." : "Login"}
          </button>
        </form>

        <p className="auth-switch">
          Need an account? <Link to="/signup">Create one here.</Link>
        </p>
      </div>
    </section>
  );
}
