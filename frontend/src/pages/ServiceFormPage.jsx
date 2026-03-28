import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { apiRequest, clearCachedValuesByPrefix } from "../api/client";
import Loader from "../components/Loader";
import { useAppContext } from "../context/AppContext";

export default function ServiceFormPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = Boolean(id);
  const { currentUser, sessionLoading, showNotice } = useAppContext();
  const [loading, setLoading] = useState(isEditMode);
  const [saving, setSaving] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [form, setForm] = useState({
    title: "",
    description: "",
    price: "",
    location: "",
    category: "",
    imageUrl: "",
  });

  useEffect(() => {
    if (!isEditMode || sessionLoading || currentUser?.role !== "provider") {
      return;
    }

    const loadService = async () => {
      try {
        const data = await apiRequest(`/api/services/${id}`);
        setForm({
          title: data.service.title,
          description: data.service.description,
          price: data.service.price,
          location: data.service.location,
          category: data.service.category,
          imageUrl: data.service.image.url,
        });
      } catch (error) {
        showNotice("error", error.message);
      } finally {
        setLoading(false);
      }
    };

    loadService();
  }, [currentUser?.role, id, isEditMode, sessionLoading, showNotice]);

  if (sessionLoading || loading) {
    return <Loader label="Loading service editor..." />;
  }

  if (currentUser?.role !== "provider") {
    return (
      <section className="page-shell">
        Only provider accounts can create or edit services.
      </section>
    );
  }

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);

    const payload = new FormData();
    payload.append("title", form.title);
    payload.append("description", form.description);
    payload.append("price", form.price);
    payload.append("location", form.location);
    payload.append("category", form.category);

    if (imageFile) {
      payload.append("image", imageFile);
    }

    try {
      await apiRequest(isEditMode ? `/api/services/${id}` : "/api/services", {
        method: isEditMode ? "PUT" : "POST",
        body: payload,
      });
      clearCachedValuesByPrefix(`provider:${currentUser.id}:`);
      clearCachedValuesByPrefix("services:");
      clearCachedValuesByPrefix("home-page");
      if (id) {
        clearCachedValuesByPrefix(`service-details:${id}:`);
      }
      showNotice("success", isEditMode ? "Service updated." : "Service created.");
      navigate("/provider/services", { replace: true });
    } catch (error) {
      showNotice("error", error.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="page-shell">
      <div className="editor-shell">
        <div className="section-heading">
          <span className="eyebrow">{isEditMode ? "Update listing" : "New listing"}</span>
          <h1>{isEditMode ? "Refine your service page" : "Publish a new service"}</h1>
        </div>

        <form className="editor-grid" onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Service title"
            value={form.title}
            onChange={(event) =>
              setForm((current) => ({ ...current, title: event.target.value }))
            }
            required
          />
          <input
            type="text"
            placeholder="Category"
            value={form.category}
            onChange={(event) =>
              setForm((current) => ({ ...current, category: event.target.value }))
            }
            required
          />
          <input
            type="number"
            min="0"
            placeholder="Price"
            value={form.price}
            onChange={(event) =>
              setForm((current) => ({ ...current, price: event.target.value }))
            }
            required
          />
          <input
            type="text"
            placeholder="Location"
            value={form.location}
            onChange={(event) =>
              setForm((current) => ({ ...current, location: event.target.value }))
            }
            required
          />
          <textarea
            rows="7"
            placeholder="Describe the service, scope, and what customers can expect."
            value={form.description}
            onChange={(event) =>
              setForm((current) => ({ ...current, description: event.target.value }))
            }
            required
          />
          <div className="upload-panel">
            {form.imageUrl ? <img src={form.imageUrl} alt={form.title || "Service preview"} /> : null}
            <input type="file" accept="image/*" onChange={(event) => setImageFile(event.target.files?.[0] || null)} />
          </div>
          <button type="submit" className="button button-primary" disabled={saving}>
            {saving ? "Saving..." : isEditMode ? "Save changes" : "Create service"}
          </button>
        </form>
      </div>
    </section>
  );
}
