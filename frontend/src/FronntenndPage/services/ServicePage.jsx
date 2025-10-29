import React from 'react'
import Navbar from './Navbar';
import Footer from './Footer';
import FeaturedServices from './FeaturedServices';
import AllServices from './AllServices';
import Hero from './Hero';
import Contact from './Contact';

function ServicesPage() {
    return (  
        <>
        <Navbar/>
        <Hero/>
        <FeaturedServices/>
        <AllServices/>
        <Contact/>
        <Footer/>
        
        </>
    );
}

export default ServicesPage;