import React from 'react'
import Hero from './Hero.jsx'
import Navbar from './Navbar.jsx'
import Footer from './Footer.jsx'
import Browse from './Browse.jsx'
import Customer from './Customer.jsx'

import Work from './Work.jsx'
import Ready from './Ready.jsx'


function LandingPage() {
    return ( 
        <>
        <Navbar/>
        <Hero/>
        <Browse/>
        
        <Work/>
        <Customer/>
        <Ready/>
        <Footer/>
        
        </>
     );
}

export default LandingPage;