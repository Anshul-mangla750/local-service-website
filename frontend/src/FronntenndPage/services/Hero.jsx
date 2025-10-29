
import React from 'react';


function Hero() {
  return (
    <div className="bg-light p-5 rounded-3 text-center">
      <h1 className=" mb-3 " style={{fontSize:"3rem"}}>All Services</h1>
      <p className="mb-4 mt-4 text-secondary" style={{fontSize:"1.2rem"}}>
        Browse our complete catalog of professional services. Find exactly what you need from verified <br /> local providers.
      </p>
      <form className="d-flex justify-content-center gap-3 flex-wrap">
        <div className="input-group" style={{ maxWidth: '300px' }}>
          <span className="input-group-text bg-white border-end-0">
            <i className="fa fa-search text-muted"></i>
          </span>
          <input
            type="text"
            className="form-control border-start-0"
            placeholder="Search services..."
            aria-label="Search services"
          />
        </div>
        <div className="input-group" style={{ maxWidth: '200px' }}>
          <span className="input-group-text bg-white border-end-0">
            <i className="fa fa-map-marker-alt text-muted"></i>
          </span>
          <input
            type="text"
            className="form-control border-start-0"
            placeholder="Location"
            aria-label="Location"
          />
        </div>
        <button type="submit" className="btn btn-primary px-4 bg-success">
          <i className="fa fa-filter me-2"></i> Filter
        </button>
      </form>
    </div> 
  );
}

export default Hero;
