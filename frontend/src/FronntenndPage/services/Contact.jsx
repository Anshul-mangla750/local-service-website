import React from 'react'
function Contact() {
    return ( 
        <div
      className="d-flex flex-column justify-content-center align-items-center text-center text-white py-5"
      style={{
        background: 'linear-gradient(90deg, #4e54c8 0%, #f78ca0 100%)',
        minHeight: '250px',
      }}
    >
      <h2 className="fw-bold mb-3">Don't see what you're looking for?</h2>
      <p className="mb-4">
       Contact us and we'll help you find the right professional for your specific needs{' '}
        <span className="fw-bold">ServiceHub</span>
      </p>
      <div>
        <button type="button" className="btn btn-light me-3">
          Contact Support
        </button>
       
      </div>
    </div>
     );
}

export default Contact;