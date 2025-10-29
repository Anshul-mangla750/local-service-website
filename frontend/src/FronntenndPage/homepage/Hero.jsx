import React from "react";
function Hero() {
  return (
    <div className="container-fluid" style={{ width: "100vw" ,backgroundColor:"#F0FFFF" ,height:"100vh" }}>
      <div className="row text-center ">
        <h1 className="mt-5 " style={{ fontSize: "5rem" }}>
          <span>Find & Book</span> <span style={{color:"green"}}>Local Services</span> 
        </h1>
        <p className="m-2 text-muted" style={{ fontSize: "1.5rem" }}>
          connect with trusted local service providers in your area. From home
          repairs <br /> to personal care , book the perfect service in minutes.
        </p>
      </div>
      <div class="row m-5">
        <form className="d-flex" role="search">
          <input style={{height:"50px"}}
            className="form-control me-2 "
            type="search"
            placeholder="What service do you need?"
            aria-label="Search"
          />
          <button className="btn btn-outline-success" type="submit">
            Search
          </button>
        </form>
      </div>

      <div className="row text-center m-5">
        <div className="col">
          <h1>50K+</h1>
          <p>Service Providers</p>
        </div>
        <div className="col">
          <h2>1M+</h2>
          <p>Services Booked</p>
        </div>
        <div className="col">
          <h3>
            4.8<i class="fa-solid fa-star"></i>
          </h3>
          <p>Average Rating</p>
        </div>
        <div className="col">
          <h1>24/7</h1>
          <p>Support</p>
        </div>
      </div>
      <div className="row text-center">
        <p>Popular Services</p>
        <div className="d-flex justify-content-center flex-wrap">
            <span className="popular-service-pill">House Cleaning</span>
            <span className="popular-service-pill">Plumbing</span>
            <span className="popular-service-pill">Electrical</span>
            <span className="popular-service-pill">Moving</span>
            <span className="popular-service-pill">Handyman</span>
            <span className="popular-service-pill">Pet Care</span>
            <span className="popular-service-pill">Beauty & Wellness</span>
            <span className="popular-service-pill">Tutoring</span>
        </div>
      </div>
    </div>
  );
}

export default Hero;
