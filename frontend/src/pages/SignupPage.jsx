import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";

import { apiRequest } from "../api/client";
import { useAppContext } from "../context/AppContext";

export default function SignupPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { refreshSession, showNotice } = useAppContext();
  const requestedRole = searchParams.get("role") === "provider" ? "provider" : "customer";
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    role: requestedRole,
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setForm((current) =>
      current.role === requestedRole ? current : { ...current, role: requestedRole },
    );
  }, [requestedRole]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);

    try {
      const data = await apiRequest("/api/auth/signup", {
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
        <span className="eyebrow">Create account</span>
        <h1>Join LocalFix as a customer or provider</h1>
        <p>Create an account to book trusted local services or publish your own verified service listings.</p>

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
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={(event) =>
              setForm((current) => ({ ...current, email: event.target.value }))
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

          <div className="segmented">
            <button
              type="button"
              className={form.role === "customer" ? "chip is-active" : "chip"}
              onClick={() => setForm((current) => ({ ...current, role: "customer" }))}
            >
              Customer
            </button>
            <button
              type="button"
              className={form.role === "provider" ? "chip is-active" : "chip"}
              onClick={() => setForm((current) => ({ ...current, role: "provider" }))}
            >
              Provider
            </button>
          </div>

          <button type="submit" className="button button-primary" disabled={submitting}>
            {submitting ? "Creating..." : "Create account"}
          </button>
        </form>

        <p className="auth-switch">
          Already registered? <Link to="/login">Login instead.</Link>
        </p>
      </div>
    </section>
  );
}
