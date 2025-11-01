import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import LandingPage from './FronntenndPage/homepage/LandingPage'
import ServicesPage from './FronntenndPage/services/ServicePage'
import SupportPage from './FronntenndPage/homepage/SupportPage'
import {BrowserRouter as Router , Routes, Route} from 'react-router-dom'

function App() {

  return (

    <Router>
      <Routes>
    <Route path="/" element={<LandingPage/>} />,
    <Route path="/services" element={<ServicesPage/>} />
    <Route path="/support" element={<SupportPage/>} />
      </Routes>
  </Router>

  )
}

export default App
