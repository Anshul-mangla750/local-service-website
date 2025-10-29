
import React from 'react';

function Ready() {
  return (
    <div
      className="d-flex flex-column justify-content-center align-items-center text-center text-white py-5"
      style={{
        background: 'linear-gradient(90deg, #4e54c8 0%, #f78ca0 100%)',
        minHeight: '250px',
      }}
    >
      <h2 className="fw-bold mb-3">Ready to find your perfect service provider?</h2>
      <p className="mb-4">
        Join thousands of satisfied customers who found reliable professionals through{' '}
        <span className="fw-bold">ServiceHub</span>
      </p>
      <div>
        <button type="button" className="btn btn-light me-3">
        <a href="http://localhost:8080/services" style={{textDecoration:"none" ,color:"black"}}>Browse services</a>
        </button>
        <button type="button" className="btn btn-outline-light">
          Become a Pro
        </button>
      </div>
    </div>
  );
}

export default Ready;
