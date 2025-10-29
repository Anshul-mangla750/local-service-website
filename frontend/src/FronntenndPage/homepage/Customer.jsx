import React from 'react';
import "./Customer.css"

function Customer() {
  return (
    <div className="container text-center my-5">
      <h2 className="fw-bold mb-2">What Our Customers Say</h2>
      <p className="text-muted mb-5">Join thousands of satisfied customers</p>

      <div className="row position-relative">
        <div className="col-md-4 mb-4 position-relative">
          <div className="card h-100 shadow-sm p-3" style={{ borderRadius: '10px' }}>
            <div className="mb-3">
              
              <span><i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i></span>
            </div>
            <p className="">
              "Amazing service! Found the perfect cleaner for my home in minutes. Professional, reliable, and affordable."
            </p>
            <p className="fw-bold mb-0">Sarah Johnson</p>
            <p className="text-muted">House Cleaning</p>
            <div className="text-success position-absolute" style={{ bottom: '15px', right: '15px' }}>
             <i class="fa-solid fa-circle-check"></i>
            </div>
          </div>
        </div>

        <div className="col-md-4 mb-4 position-relative">
          <div className="card h-100 shadow-sm p-3" style={{ borderRadius: '10px' }}>
            <div className="mb-3">
              
              <span><i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i><i class="fa-solid fa-star"><i class="fa-solid fa-star-half"></i></i></span>
            </div>
            <p className="">
              "The electrician arrived on time and fixed my issue quickly. Great platform for finding local services."
            </p>
            <p className="fw-bold mb-0">Mike Chen</p>
            <p className="text-muted">Electrical Repair</p>
            <div className="text-success position-absolute" style={{ bottom: '15px', right: '15px' }}>
              <i class="fa-solid fa-circle-check"></i>
             
            </div>
          </div>
        </div>

        <div className="col-md-4 mb-4 position-relative">
          <div className="card h-100 shadow-sm p-3" style={{ borderRadius: '10px' }}>
            <div className="mb-3">
              
              <span><i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i><i class="fa-solid fa-star-half"></i></span>
            </div>
            <p className="">
              "Love how easy it is to compare providers and read reviews. Booked a painter and couldn't be happier!"
            </p>
            <p className="fw-bold mb-0">Emily Davis</p>
            <p className="text-muted">Painting</p>
            <div className="text-success position-absolute" style={{ bottom: '15px', right: '15px' }}>
              <i class="fa-solid fa-circle-check"></i>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Customer;
