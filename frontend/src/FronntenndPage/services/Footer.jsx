import React from 'react';

function Footer() {
  return (
    <footer className=" text-white pt-5 pb-4" style={{ backgroundColor: "#2c3e50" }}>
      <div className="container text-center text-md-start">
        

        <div className="row text-md-start text-center">
          <div className="col-md-3 mb-4">
            <h5 className="fw-bold d-flex align-items-center gap-2">
              <span className="  d-inline-block" style={{ width: '24px', height: '24px' }}>
                <i class="fa-solid fa-house-user"></i>
                
              </span>
              ServiceHub
            </h5>
            <p>Your trusted platform for finding and booking local services.</p>
          </div>

          <div className="col-md-3 mb-4">
            <h6 className="fw-bold">For Customers</h6>
            <ul className="list-unstyled ">
              <li><a href="#" className="text-white   text-decoration-none">Browse Services</a></li>
              <li><a href="#" className="text-white text-decoration-none">How It Works</a></li>
              <li><a href="#" className="text-white text-decoration-none">Support</a></li>
              <li><a href="#" className="text-white text-decoration-none">Reviews</a></li>
            </ul>
          </div>

          <div className="col-md-3 mb-4">
            <h6 className="fw-bold">For Providers</h6>
            <ul className="list-unstyled">
              <li><a href="#" className="text-white text-decoration-none">Join as Provider</a></li>
              <li><a href="#" className="text-white text-decoration-none">Provider Resources</a></li>
              <li><a href="#" className="text-white text-decoration-none">Success Stories</a></li>
              <li><a href="#" className="text-white text-decoration-none">Tools & Support</a></li>
            </ul>
          </div>

          <div className="col-md-3 mb-4">
            <h6 className="fw-bold">Company</h6>
            <ul className="list-unstyled">
              <li><a href="#" className="text-white text-decoration-none">About Us</a></li>
              <li><a href="#" className="text-white text-decoration-none">Careers</a></li>
              <li><a href="#" className="text-white text-decoration-none">Privacy Policy</a></li>
              <li><a href="#" className="text-white text-decoration-none">Terms of Service</a></li>
            </ul>
          </div>
        </div>
      </div>
      <div className="text-center mt-4">
        <small>© 2025 ServiceHub. All rights reserved.</small>
      </div>
    </footer>
  );
}

export default Footer;
