import React from 'react';

function Work() {
  return (
    <div className="container text-center my-5">
      <h2 className="fw-bold mb-2">How ServiceHub Works</h2>
      <p className="text-muted mb-5">Getting the help you need is simple and straightforward</p>

      <div className="row">
        <div className="col-md-4 mb-4">
          <div
            className="mx-auto mb-3 d-flex align-items-center justify-content-center"
            style={{
              width: '50px',
              height: '50px',
              borderRadius: '50%',
              backgroundColor: '#28a745',
              color: 'white',
              fontWeight: 'bold',
              fontSize: '1.5rem',
            }}
          >
            1
          </div>
          <h5 className="fw-bold">Search & Browse</h5>
          <p className="text-muted px-3">
            Find the perfect service provider by searching our extensive directory or browsing by category.
          </p>
        </div>

        <div className="col-md-4 mb-4">
          <div
            className="mx-auto mb-3 d-flex align-items-center justify-content-center"
            style={{
              width: '50px',
              height: '50px',
              borderRadius: '50%',
              backgroundColor: '#28a745',
              color: 'white',
              fontWeight: 'bold',
              fontSize: '1.5rem',
            }}
          >
            2
          </div>
          <h5 className="fw-bold">Compare & Choose</h5>
          <p className="text-muted px-3">
            Review profiles, ratings, and prices to choose the best provider for your specific needs.
          </p>
        </div>

        <div className="col-md-4 mb-4">
          <div
            className="mx-auto mb-3 d-flex align-items-center justify-content-center"
            style={{
              width: '50px',
              height: '50px',
              borderRadius: '50%',
              backgroundColor: '#28a745',
              color: 'white',
              fontWeight: 'bold',
              fontSize: '1.5rem',
            }}
          >
            3
          </div>
          <h5 className="fw-bold">Book & Relax</h5>
          <p className="text-muted px-3">
            Book your service in minutes and let our verified professionals take care of the rest.
          </p>
        </div>
      </div>
    </div>
  );
}

export default Work;
