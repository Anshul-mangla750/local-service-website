import { useDeferredValue, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";

import { apiRequest, readCachedValue, writeCachedValue } from "../api/client";
import Loader from "../components/Loader";
import ServiceCard from "../components/ServiceCard";

const SERVICES_CACHE_TTL = 1000 * 60 * 5;

export default function ServicesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentQueryString = searchParams.toString();
  const [searchInput, setSearchInput] = useState(searchParams.get("search") || "");
  const [selectedCategory, setSelectedCategory] = useState(
    searchParams.get("category") || "",
  );
  const [serviceData, setServiceData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const deferredSearch = useDeferredValue(searchInput);
  const queryString = new URLSearchParams(
    Object.entries({
      ...(deferredSearch.trim() ? { search: deferredSearch.trim() } : {}),
      ...(selectedCategory ? { category: selectedCategory } : {}),
    }),
  ).toString();

  useEffect(() => {
    if (queryString !== currentQueryString) {
      setSearchParams(queryString ? new URLSearchParams(queryString) : new URLSearchParams(), {
        replace: true,
      });
    }
  }, [currentQueryString, queryString, setSearchParams]);

  useEffect(() => {
    const cacheKey = `services:${queryString || "all"}`;
    const cachedData = readCachedValue(cacheKey, SERVICES_CACHE_TTL);
    let isActive = true;

    if (cachedData) {
      setServiceData(cachedData);
      setLoading(false);
    } else {
      setLoading(true);
    }

    const loadServices = async () => {
      setError("");

      try {
        const query = queryString ? new URLSearchParams(queryString) : new URLSearchParams();
        query.set("limit", "30");

        const data = await apiRequest(`/api/services?${query.toString()}`);
        if (!isActive) {
          return;
        }
        setServiceData(data);
        writeCachedValue(cacheKey, data);
      } catch (requestError) {
        if (!cachedData && isActive) {
          setError(requestError.message);
        }
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    };

    loadServices();

    return () => {
      isActive = false;
    };
  }, [queryString]);

  return (
    <div className="page-shell">
      <section className="page-hero">
        <div>
          <span className="eyebrow">Search results</span>
          <h1>Find trusted local service professionals near you</h1>
          <p>Search LocalFix across categories, neighborhoods, and service descriptions to find the right provider for the job.</p>
        </div>

        <div className="filter-panel">
          <input
            type="text"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Search by title, location, or category"
          />

          <div className="chip-row">
            <button
              type="button"
              className={!selectedCategory ? "chip is-active" : "chip"}
              onClick={() => setSelectedCategory("")}
            >
              All
            </button>

            {serviceData?.categories?.map((category) => (
              <button
                key={category.name}
                type="button"
                className={selectedCategory === category.name ? "chip is-active" : "chip"}
                onClick={() => setSelectedCategory(category.name)}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>
      </section>

      {loading ? <Loader label="Loading services..." /> : null}
      {error ? <section className="empty-panel">{error}</section> : null}

      {!loading && !error && serviceData ? (
        <>
          <div className="summary-strip">
            <strong>{serviceData.total} live services</strong>
            <span>
              {serviceData.filters.search
                ? `Matching "${serviceData.filters.search}"`
                : "Showing the current LocalFix catalog"}
            </span>
          </div>

          <section className="service-grid">
            {serviceData.services.map((service) => (
              <ServiceCard key={service.id} service={service} />
            ))}
          </section>

          {!serviceData.services.length ? (
            <section className="empty-panel">
              No services matched your current filters. Try another category or a broader search term.
            </section>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
