import React from 'react'
import { Link } from 'react-router-dom';
function Navbar() {
    return (  
       <nav class="navbar navbar-expand-lg bg-body-tertiary sticky-top" style={{backgroundColor:" #e3f2fd"}}>
  <div class="container-fluid">
    <a class="navbar-brand" href="#"><i class="fa-solid fa-house-user"></i> ServiceHub</a>
    <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarSupportedContent" aria-controls="navbarSupportedContent" aria-expanded="false" aria-label="Toggle navigation">
      <span class="navbar-toggler-icon"></span>
    </button>
    <div class="collapse navbar-collapse justify-content-end" id="navbarSupportedContent">
      <ul class="navbar-nav mb-2 mb-lg-0 ">
        <li class="nav-item mx-5">
          <a class="nav-link active" aria-current="page" href="#">Home</a>
        </li>
        <li class="nav-item mx-3 ">
          <Link class="nav-link " to="http://localhost:8080/services">Services</Link>
        </li>
        <li class="nav-item mx-5 ">
          <Link class="nav-link" to="/support">Support</Link>
        </li>
         <li class="nav-item ">
          <a class="btn btn-primary bg-success" href="http://localhost:8080/signup" role="button">Sign up</a>
        </li>
      </ul>
    </div>
  </div>
</nav>
    );
}

export default Navbar;
