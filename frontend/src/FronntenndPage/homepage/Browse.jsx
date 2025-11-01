import React from "react";

function Browse() {
  const handleCategoryClick = (category) => {
    // Navigate to backend services page with category filter
    window.location.href = `http://localhost:8080/services?category=${encodeURIComponent(category)}`;
  };

  return (
    <div className="container">
      <div className="row text-center">
        <h1 className="mt-5" style={{ fontSize: "3rem" }}>
          Browse by category
        </h1>
        <p className="m-2 text-muted" style={{ fontSize: "1.3rem" }}>
          Find the perfect service providers for your needs across all categories.
        </p>
      </div>

      <div className="row row-cols-1 row-cols-md-3 g-4 mt-3">
        <div className="col">
          <div className="card h-100 shadow-sm" style={{ borderRadius: "10px", cursor: "pointer", transition: "transform 0.3s ease, box-shadow 0.3s ease" }} onMouseEnter={(e) => { e.currentTarget.style.transform = "scale(1.05)"; e.currentTarget.style.boxShadow = "0 8px 16px rgba(0,0,0,0.2)"; }} onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.boxShadow = "0 2px 4px rgba(0,0,0,0.1)"; }} onClick={() => handleCategoryClick("Home & Garden")}>
            <div
              className="d-flex align-items-center justify-content-center mx-auto mt-3"
              style={{ width: "50px", height: "50px", borderRadius: "50%", backgroundColor: "#E6F0FA" }}
            >
             <i class="fa-solid fa-house"></i>
            </div>
            <div className="card-body text-center">
              <h5 className="card-title mb-1" style={{ fontWeight: "600" }}>
                Home & Garden
              </h5>
              <p className="card-text text-muted" style={{ fontSize: "0.9rem" }}>
                2,500+ services
              </p>
            </div>
          </div>
        </div>

        <div className="col">
          <div className="card h-100 shadow-sm" style={{ borderRadius: "10px", cursor: "pointer", transition: "transform 0.3s ease, box-shadow 0.3s ease" }} onMouseEnter={(e) => { e.currentTarget.style.transform = "scale(1.05)"; e.currentTarget.style.boxShadow = "0 8px 16px rgba(0,0,0,0.2)"; }} onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.boxShadow = "0 2px 4px rgba(0,0,0,0.1)"; }} onClick={() => handleCategoryClick("Repairs & Maintenance")}>
            <div
              className="d-flex align-items-center justify-content-center mx-auto mt-3"
              style={{ width: "50px", height: "50px", borderRadius: "50%", backgroundColor: "#FCE9D6" }}
            >
              <i class="fa-solid fa-toolbox"></i>
            </div>
            <div className="card-body text-center">
              <h5 className="card-title mb-1" style={{ fontWeight: "600" }}>
                Repairs & Maintenance
              </h5>
              <p className="card-text text-muted" style={{ fontSize: "0.9rem" }}>
                1,800+ services
              </p>
            </div>
          </div>
        </div>

        <div className="col">
          <div className="card h-100 shadow-sm" style={{ borderRadius: "10px", cursor: "pointer", transition: "transform 0.3s ease, box-shadow 0.3s ease" }} onMouseEnter={(e) => { e.currentTarget.style.transform = "scale(1.05)"; e.currentTarget.style.boxShadow = "0 8px 16px rgba(0,0,0,0.2)"; }} onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.boxShadow = "0 2px 4px rgba(0,0,0,0.1)"; }} onClick={() => handleCategoryClick("Electrical")}>
            <div
              className="d-flex align-items-center justify-content-center mx-auto mt-3"
              style={{ width: "50px", height: "50px", borderRadius: "50%", backgroundColor: "#FEF9D9" }}
            >
             <i class="fa-solid fa-bolt"></i>
            </div>
            <div className="card-body text-center">
              <h5 className="card-title mb-1" style={{ fontWeight: "600" }}>
                Electrical
              </h5>
              <p className="card-text text-muted" style={{ fontSize: "0.9rem" }}>
                950+ services
              </p>
            </div>
          </div>
        </div>

        <div className="col">
          <div className="card h-100 shadow-sm" style={{ borderRadius: "10px", cursor: "pointer", transition: "transform 0.3s ease, box-shadow 0.3s ease" }} onMouseEnter={(e) => { e.currentTarget.style.transform = "scale(1.05)"; e.currentTarget.style.boxShadow = "0 8px 16px rgba(0,0,0,0.2)"; }} onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.boxShadow = "0 2px 4px rgba(0,0,0,0.1)"; }} onClick={() => handleCategoryClick("Painting")}>
            <div
              className="d-flex align-items-center justify-content-center mx-auto mt-3"
              style={{ width: "50px", height: "50px", borderRadius: "50%", backgroundColor: "#F4E6FA" }}
            >
              <i class="fa-solid fa-paintbrush"></i>
            </div>
            <div className="card-body text-center">
              <h5 className="card-title mb-1" style={{ fontWeight: "600" }}>
                Painting
              </h5>
              <p className="card-text text-muted" style={{ fontSize: "0.9rem" }}>
                750+ services
              </p>
            </div>
          </div>
        </div>

        <div className="col">
          <div className="card h-100 shadow-sm" style={{ borderRadius: "10px", cursor: "pointer", transition: "transform 0.3s ease, box-shadow 0.3s ease" }} onMouseEnter={(e) => { e.currentTarget.style.transform = "scale(1.05)"; e.currentTarget.style.boxShadow = "0 8px 16px rgba(0,0,0,0.2)"; }} onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.boxShadow = "0 2px 4px rgba(0,0,0,0.1)"; }} onClick={() => handleCategoryClick("Automotive")}>
            <div
              className="d-flex align-items-center justify-content-center mx-auto mt-3"
              style={{ width: "50px", height: "50px", borderRadius: "50%", backgroundColor: "#FCE6E8" }}
            >
              <i class="fa-solid fa-car"></i>
            </div>
            <div className="card-body text-center">
              <h5 className="card-title mb-1" style={{ fontWeight: "600" }}>
                Automotive
              </h5>
              <p className="card-text text-muted" style={{ fontSize: "0.9rem" }}>
                650+ services
              </p>
            </div>
          </div>
        </div>

        <div className="col">
          <div className="card h-100 shadow-sm" style={{ borderRadius: "10px", cursor: "pointer", transition: "transform 0.3s ease, box-shadow 0.3s ease" }} onMouseEnter={(e) => { e.currentTarget.style.transform = "scale(1.05)"; e.currentTarget.style.boxShadow = "0 8px 16px rgba(0,0,0,0.2)"; }} onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.boxShadow = "0 2px 4px rgba(0,0,0,0.1)"; }} onClick={() => handleCategoryClick("Health & Wellness")}>
            <div
              className="d-flex align-items-center justify-content-center mx-auto mt-3"
              style={{ width: "50px", height: "50px", borderRadius: "50%", backgroundColor: "#FCE6ED" }}
            >
              <i class="fa-solid fa-suitcase-medical"></i>
            </div>
            <div className="card-body text-center">
              <h5 className="card-title mb-1" style={{ fontWeight: "600" }}>
                Health & Wellness
              </h5>
              <p className="card-text text-muted" style={{ fontSize: "0.9rem" }}>
                1,200+ services
              </p>
            </div>
          </div>
        </div>

        <div className="col">
          <div className="card h-100 shadow-sm" style={{ borderRadius: "10px", cursor: "pointer", transition: "transform 0.3s ease, box-shadow 0.3s ease" }} onMouseEnter={(e) => { e.currentTarget.style.transform = "scale(1.05)"; e.currentTarget.style.boxShadow = "0 8px 16px rgba(0,0,0,0.2)"; }} onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.boxShadow = "0 2px 4px rgba(0,0,0,0.1)"; }} onClick={() => handleCategoryClick("Education & Tutoring")}>
            <div
              className="d-flex align-items-center justify-content-center mx-auto mt-3"
              style={{ width: "50px", height: "50px", borderRadius: "50%", backgroundColor: "#E6F0FA" }}
            >
             <i class="fa-solid fa-award"></i>
            </div>
            <div className="card-body text-center">
              <h5 className="card-title mb-1" style={{ fontWeight: "600" }}>
                Education & Tutoring
              </h5>
              <p className="card-text text-muted" style={{ fontSize: "0.9rem" }}>
                890+ services
              </p>
            </div>
          </div>
        </div>

        <div className="col">
          <div className="card h-100 shadow-sm" style={{ borderRadius: "10px", cursor: "pointer", transition: "transform 0.3s ease, box-shadow 0.3s ease" }} onMouseEnter={(e) => { e.currentTarget.style.transform = "scale(1.05)"; e.currentTarget.style.boxShadow = "0 8px 16px rgba(0,0,0,0.2)"; }} onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.boxShadow = "0 2px 4px rgba(0,0,0,0.1)"; }} onClick={() => handleCategoryClick("Photography")}>
            <div
              className="d-flex align-items-center justify-content-center mx-auto mt-3"
              style={{ width: "50px", height: "50px", borderRadius: "50%", backgroundColor: "#F0F0F0" }}
            >
              <i class="fa-solid fa-camera"></i>
            </div>
            <div className="card-body text-center">
              <h5 className="card-title mb-1" style={{ fontWeight: "600" }}>
                Photography
              </h5>
              <p className="card-text text-muted" style={{ fontSize: "0.9rem" }}>
                420+ services
              </p>
            </div>
          </div>
        </div>

        <div className="col">
          <div className="card h-100 shadow-sm" style={{ borderRadius: "10px", cursor: "pointer", transition: "transform 0.3s ease, box-shadow 0.3s ease" }} onMouseEnter={(e) => { e.currentTarget.style.transform = "scale(1.05)"; e.currentTarget.style.boxShadow = "0 8px 16px rgba(0,0,0,0.2)"; }} onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.boxShadow = "0 2px 4px rgba(0,0,0,0.1)"; }} onClick={() => handleCategoryClick("Beauty & Personal Care")}>
            <div
              className="d-flex align-items-center justify-content-center mx-auto mt-3"
              style={{ width: "50px", height: "50px", borderRadius: "50%", backgroundColor: "#DFF7F4" }}
            >
              <i class="fa-solid fa-scissors"></i>
            </div>
            <div className="card-body text-center">
              <h5 className="card-title mb-1" style={{ fontWeight: "600" }}>
                Beauty & Personal Care
              </h5>
              <p className="card-text text-muted" style={{ fontSize: "0.9rem" }}>
                680+ services
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Browse;
