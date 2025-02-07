import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Weather from './components/Weather';
import LocationIntelligence from './components/LocationIntelligence';
import BusinessFeatures from './components/BusinessFeatures';

const App = () => {
    return (
        <Router>
            
            <Routes>
                <Route path="/" element={<Weather />} />
                <Route path="/location" element={<LocationIntelligence />} />
                <Route path="/business" element={<BusinessFeatures />} />
            </Routes>
        </Router>
    );
};

export default App;