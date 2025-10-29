import React from 'react';

function FeaturedServices() {
  return (
    <div className="container my-4">
      <div className="row g-4">
        <h1>Featured Services</h1>
        <p>Our most popular and highl-rated services</p>
        <div className="col-md-6 col-lg-4">
          <div className="card h-100 shadow-sm">
            <div className="position-relative" style={{height: '180px', backgroundColor: '#e9ecef'}}>
            <img src="https://media.istockphoto.com/id/1345670559/photo/electrician-fixing-an-electrical-outlet-and-measuring-the-voltage.webp?a=1&b=1&s=612x612&w=0&k=20&c=5lp_iJQfahTtJnv5CluqHagQPgzrAKdumG-L_eI59Qk=" alt="" height={"180px"} width={"414px"} />
              <span className="badge bg-success position-absolute top-0 end-0 m-2">
                <i className="bi bi-check-circle-fill me-1"></i> Verified
              </span>
             
            </div>
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-start mb-2">
                <h5 className="card-title mb-0">Electrical Installation & Repair</h5>
                <span className="fw-bold">From $95</span>
              </div>
              <p className="card-text text-muted">PowerPro Electricians</p>
              <div className="d-flex flex-wrap align-items-center gap-3 mb-2">
                <div className="d-flex align-items-center">
                  <i className="bi bi-star-fill text-warning me-1"></i>
                  <span><i class="fa-solid fa-star"/>4.7</span>
                  <span className="text-muted ms-1">(189)</span>
                </div>
                <div className="d-flex align-items-center">
                  <i className="bi bi-clock text-muted me-1"></i>
                  <span><i class="fa-regular fa-clock"></i>Same Day</span>
                </div>
              </div>
              <div className="d-flex align-items-center mb-2">
                <i className="bi bi-geo-alt text-muted me-1"></i>
                <span>Metro Area</span>
              </div>
              <div className="mb-3">
                <span className="badge bg-secondary me-2">Licensed</span>
                <span className="badge bg-secondary me-2">Certified</span>
                <span className="badge bg-secondary me-2">Emergency</span>
              </div>
              <button className="btn btn-success w-100">View Details</button>
            </div>
           
          </div>
        </div>

        <div className="col-md-6 col-lg-4">
          <div className="card h-100 shadow-sm">
            <div className="position-relative" style={{height: '180px', backgroundColor: '#e9ecef'}}>
              <img src="https://media.istockphoto.com/id/932230962/photo/house-painting.webp?a=1&b=1&s=612x612&w=0&k=20&c=AbT2qyzDzEIOzIF6pHunwQGsdiB6un3Yt4MIm-p4yZM=" alt="" height={"180px"} width={"414px"}/>
              <span className="badge bg-success position-absolute top-0 end-0 m-2">
                <i className="bi bi-check-circle-fill me-1"></i> Verified
              </span>
              
            </div>
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-start mb-2">
                <h5 className="card-title mb-0">Interior House Painting</h5>
                <span className="fw-bold">From $299</span>
              </div>
              <p className="card-text text-muted">ColorCraft Painters</p>
              <div className="d-flex flex-wrap align-items-center gap-3 mb-2">
                <div className="d-flex align-items-center">
                  <i className="bi bi-star-fill text-warning me-1"></i>
                  <span><i class="fa-solid fa-star"/>4.8</span>
                  <span className="text-muted ms-1">(124)</span>
                </div>
                <div className="d-flex align-items-center">
                  <i className="bi bi-clock text-muted me-1"></i>
                  <span><i class="fa-regular fa-clock"></i>Within 24 hours</span>
                </div>
              </div>
              <div className="d-flex align-items-center mb-2">
                <i className="bi bi-geo-alt text-muted me-1"></i>
                <span>North District</span>
              </div>
              <div className="mb-3">
                <span className="badge bg-secondary me-2">Interior</span>
                <span className="badge bg-secondary me-2">Exterior</span>
                <span className="badge bg-secondary me-2">Color Consultation</span>
              </div>
              <button className="btn btn-success w-100">View Details</button>
            </div>
           
          </div>
        </div>

        <div className="col-md-6 col-lg-4">
          <div className="card h-100 shadow-sm">
            <div className="position-relative" style={{height: '180px', backgroundColor: '#e9ecef'}}>
             <img src="https://media.istockphoto.com/id/1291180143/photo/the-countdown-to-clean-shiny-floors.webp?a=1&b=1&s=612x612&w=0&k=20&c=iD226yvtG3IfvsGg1uA3a2SlWTOXrvlsC2-wJv9x5qM=" alt=""  height={"180px"} width={"414px"}/>
              <span className="badge bg-success position-absolute top-0 end-0 m-2">
                <i className="bi bi-check-circle-fill me-1"></i> Verified
              </span>
              
            </div>
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-start mb-2">
                <h5 className="card-title mb-0">Professional House Cleaning</h5>
                <span className="fw-bold">From $89</span>
              </div>
              <p className="card-text text-muted">CleanPro Services</p>
              <div className="d-flex flex-wrap align-items-center gap-3 mb-2">
                <div className="d-flex align-items-center">
                  <i className="bi bi-star-fill text-warning me-1"></i>
                  <span><i class="fa-solid fa-star"/>4.9</span>
                  <span className="text-muted ms-1">(234)</span>
                </div>
                <div className="d-flex align-items-center">
                  <i className="bi bi-clock text-muted me-1"></i>
                  <span><i class="fa-regular fa-clock"></i>Within 2 hours</span>
                </div>
              </div>
              <div className="d-flex align-items-center mb-2">
                <i className="bi bi-geo-alt text-muted me-1"></i>
                <span>Downtown Area</span>
              </div>
              <div className="mb-3">
                <span className="badge bg-secondary me-2">Deep Cleaning</span>
                <span className="badge bg-secondary me-2">Eco-Friendly</span>
                <span className="badge bg-secondary me-2">Insured</span>
              </div>
              <button className="btn btn-success w-100">View Details</button>
            </div>
           
          </div>
        </div>

        <div className="col-md-6 col-lg-4">
          <div className="card h-100 shadow-sm">
            <div className="position-relative" style={{height: '180px', backgroundColor: '#e9ecef'}}>
            <img src="https://media.istockphoto.com/id/1516511531/photo/a-plumber-carefully-fixes-a-leak-in-a-sink-using-a-wrench.webp?a=1&b=1&s=612x612&w=0&k=20&c=NfRUQTs1dQoAE-NUOmziEvc8EKYlekfh8q2UQTrJJbU=" alt="" height={"180px"} width={"414px"}/>
              <span className="badge bg-success position-absolute top-0 end-0 m-2">
                <i className="bi bi-check-circle-fill me-1"></i> Verified
              </span>
             
            </div>
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-start mb-2">
                <h5 className="card-title mb-0">Emergency Plumbing Repair</h5>
                <span className="fw-bold">From $125</span>
              </div>
              <p className="card-text text-muted">AquaFix Plumbing</p>
              <div className="d-flex flex-wrap align-items-center gap-3 mb-2">
                <div className="d-flex align-items-center">
                  <i className="bi bi-star-fill text-warning me-1"></i>
                  <span><i class="fa-solid fa-star"/>4.8</span>
                  <span className="text-muted ms-1">(156)</span>
                </div>
                <div className="d-flex align-items-center">
                  <i className="bi bi-clock text-muted me-1"></i>
                  <span><i class="fa-regular fa-clock"></i>24/7 Available</span>
                </div>
              </div>
              <div className="d-flex align-items-center mb-2">
                <i className="bi bi-geo-alt text-muted me-1"></i>
                <span>Citywide</span>
              </div>
              <div className="mb-3">
                <span className="badge bg-secondary me-2">24/7 Service</span>
                <span className="badge bg-secondary me-2">Licensed</span>
                <span className="badge bg-secondary me-2">Warranty</span>
              </div>
              <button className="btn btn-success w-100">View Details</button>
            </div>
           
          </div>
        </div>
      </div>
    </div>
  );
}
export default FeaturedServices;

