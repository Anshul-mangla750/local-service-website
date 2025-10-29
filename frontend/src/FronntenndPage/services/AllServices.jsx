import React from 'react';

function createService(id, title, rating, pros, description, price, icon) {
  return { id, title, rating, pros, description, price, icon };
}

const services = [
  createService(1, 'Painting', 4.7, 312, 'Interior and exterior painting services', 150, 'fa-solid fa-paintbrush'),
  createService(2, 'Handyman', 4.6, 398, 'General repairs and maintenance', 75, 'fa-solid fa-hammer'),
  createService(3, 'HVAC', 4.9, 123, 'Heating, cooling, and ventilation', 125, 'fa-solid fa-temperature-half'),
  createService(4, 'Automotive', 4.7, 234, 'Car repairs and maintenance', 80, 'fa-solid fa-car'),
  createService(5, 'Beauty & Personal Care', 4.8, 567, 'Hair, nails, and beauty services', 45, 'fa-solid fa-scissors'),
  createService(6, 'Security', 4.9, 89, 'Home security and surveillance', 200, 'fa-solid fa-shield-halved'),
  createService(7, 'Photography', 4.8, 178, 'Event and portrait photography', 300, 'fa-solid fa-camera'),
  createService(8, 'Landscaping', 4.6, 267, 'Lawn care and garden maintenance', 100, 'fa-solid fa-image'),
  createService(9, 'Tech Support', 4.7, 145, 'Computer and device support', 60, 'fa-solid fa-laptop'),
];

function AllServices() { 
  return (
    <div className="container my-4">
      <div className="row g-4">
        <h1>All Serices</h1>
        <p>Complete list of available services in your area</p>
        {services.map(service => (
          <div key={service.id} className="col-12 col-md-6 col-lg-4">
            <div className="card h-100 shadow-sm">
              <div className="card-body d-flex flex-column">
                <div className="d-flex align-items-center mb-3">
                  <div 
                    className="bg-primary bg-opacity-10 rounded p-3 me-3 d-flex align-items-center justify-content-center" 
                    style={{width: '48px', height: '48px'}}
                  >
                    <i className={service.icon}></i>
                  </div>
                  <h5 className="card-title mb-0">{service.title}</h5>
                </div>
                <div className="d-flex align-items-center mb-2">
                 <i class="fa-solid fa-star"></i>
                  <span className="me-2">{service.rating.toFixed(1)}</span>
                  <span className="text-muted">• {service.pros} pros</span>
                </div>
                <p className="card-text flex-grow-1">{service.description}</p>
                <div className="fw-bold mt-auto">
                  From ${service.price}
                  <span className="float-end"></span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default AllServices;
