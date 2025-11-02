import React, { useState } from 'react';

function createService(id, title, rating, pros, description, price, icon, category) {
  return { id, title, rating, pros, description, price, icon, category };
}

const services = [
  createService(1, 'Painting', 4.7, 312, 'Interior and exterior painting services', 150, 'fa-solid fa-paintbrush', 'Home Improvement'),
  createService(2, 'Handyman', 4.6, 398, 'General repairs and maintenance', 75, 'fa-solid fa-hammer', 'Home Improvement'),
  createService(3, 'HVAC', 4.9, 123, 'Heating, cooling, and ventilation', 125, 'fa-solid fa-temperature-half', 'Home Improvement'),
  createService(4, 'Automotive', 4.7, 234, 'Car repairs and maintenance', 80, 'fa-solid fa-car', 'Automotive'),
  createService(5, 'Beauty & Personal Care', 4.8, 567, 'Hair, nails, and beauty services', 45, 'fa-solid fa-scissors', 'Beauty & Wellness'),
  createService(6, 'Security', 4.9, 89, 'Home security and surveillance', 200, 'fa-solid fa-shield-halved', 'Home Improvement'),
  createService(7, 'Photography', 4.8, 178, 'Event and portrait photography', 300, 'fa-solid fa-camera', 'Creative Services'),
  createService(8, 'Landscaping', 4.6, 267, 'Lawn care and garden maintenance', 100, 'fa-solid fa-image', 'Home Improvement'),
  createService(9, 'Tech Support', 4.7, 145, 'Computer and device support', 60, 'fa-solid fa-laptop', 'Technology'),
];

function AllServices() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const categories = ['All', ...new Set(services.map(service => service.category))];

  const filteredServices = services.filter(service => {
    const matchesSearch = service.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          service.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || service.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="container my-4">
      <div className="row g-4">
        <h1>All Services</h1>
        <p>Complete list of available services in your area</p>

        {/* Search and Filter Controls */}
        <div className="col-12 mb-4">
          <div className="row g-3">
            <div className="col-md-6">
              <input
                type="text"
                className="form-control"
                placeholder="Search services..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="col-md-6">
              <select
                className="form-select"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {filteredServices.map(service => (
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
