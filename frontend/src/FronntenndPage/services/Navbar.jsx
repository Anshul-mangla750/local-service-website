import React from 'react'
import { Link } from 'react-router-dom';
function Navbar() {
    return (  
       <nav class="navbar navbar-expand-lg bg-body-tertiary sticky-top border-bottom" style={{backgroundColor:" #e3f2fd"}}>
  <div class="container-fluid">
    <a class="navbar-brand" href="#"><i class="fa-solid fa-house-user"></i> ServiceHub</a>
    <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarSupportedContent" aria-controls="navbarSupportedContent" aria-expanded="false" aria-label="Toggle navigation">
      <span class="navbar-toggler-icon"></span>
    </button>
    <div class="collapse navbar-collapse justify-content-end" id="navbarSupportedContent">
      <ul class="navbar-nav mb-2 mb-lg-0 ">
        <li class="nav-item mx-5">
          <Link class="nav-link active" aria-current="page" to="/">Home</Link>
        </li>
        <li class="nav-item mx-3 ">
          <a class="nav-link " href="#">Services</a>
        </li>
        <li class="nav-item mx-5 ">
          <a class="nav-link" aria-disabled="true">Support</a>
        </li>
         <li class="nav-item ">
          <a class="btn btn-primary bg-success" href="#" role="button">Sign In</a>
        </li>
      </ul>
    </div>
  </div>
</nav>
    );
}

export default Navbar;
