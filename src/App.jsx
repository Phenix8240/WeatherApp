import React, { useState } from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import Weather from './components/Weather';
import LocationIntelligence from './components/LocationIntelligence';
import BusinessFeatures from './components/BusinessFeatures';
import Insights from './components/BusinessFeatures';
import Navbar from './components/Navbar';

const App = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const toggleMenu = () => {
        setIsMenuOpen(!isMenuOpen);
    };

    return (
        <Router>
            <Navbar />
            <Routes>
                <Route path="/" element={<Weather />} />
                <Route path="/location" element={<LocationIntelligence />} />
                <Route path="/business" element={<Insights />} />
            </Routes>
        </Router>
    );
};

export default App;
