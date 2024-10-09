// src/components/WeatherFinder.js

import React, { useState } from 'react';
import './WeatherInfo.css';
import cityData from '../api/TouristSpot.json';  // Import the JSON data

const WeatherFinder = () => {
  const [weatherCondition, setWeatherCondition] = useState('');
  const [filteredHotels, setFilteredHotels] = useState([]);
  const [filteredAttractions, setFilteredAttractions] = useState([]);

  const handleSearch = () => {
    const hotels = [];
    const attractions = [];

    Object.values(cityData).forEach((city) => {
      if (city.favorable_weather.includes(weatherCondition)) {
        if (city.nearby_hotels.length > 0) {
          hotels.push(city.nearby_hotels[0]); // Pick the first hotel from the city
        }
        if (city.attractions.length > 0) {
          attractions.push(city.attractions[0]); // Pick the first tourist spot from the city
        }
      }
    });

    setFilteredHotels(hotels);
    setFilteredAttractions(attractions);
  };

  return (
    <div className="container">
      <h1>Weather Finder</h1>
      <div className="search-bar">
        <input
          type="text"
          className="input"
          value={weatherCondition}
          onChange={(e) => setWeatherCondition(e.target.value)}
          placeholder="Enter weather condition (e.g., Winter)"
        />
        <button className="button" onClick={handleSearch}>Search</button>
      </div>

      {filteredHotels.length > 0 && (
        <div className="city-info">
          <h3>Hotels</h3>
          <div className="card-container">
            {filteredHotels.map((hotel, index) => (
              <div key={index} className="card hotel-card">
                <img src={hotel.image_url} alt={hotel.name} className="card-image" />
                <div className="card-content">
                  <h3>{hotel.name}</h3>
                  <p>{hotel.address}</p>
                  <p>Contact: {hotel.contact}</p>
                  <p>Rating: {hotel.rating}</p>
                  <p>Amenities: {hotel.amenities.join(', ')}</p>
                  <a href={hotel.website} target="_blank" rel="noopener noreferrer">Website</a>
                  <button className="book-button">Book Now</button>
                </div>
              </div>
            ))}
          </div>

          <h3>Tourist Spots</h3>
          <div className="card-container">
            {filteredAttractions.map((attraction, index) => (
              <div key={index} className="card attraction-card">
                <img src={attraction.image_url} alt={attraction.name} className="card-image" />
                <div className="card-content">
                  <h3>{attraction.name}</h3>
                  <p>{attraction.description}</p>
                  <p>Coordinates: Latitude {attraction.coordinates.latitude}, Longitude {attraction.coordinates.longitude}</p>
                  <p>Opening Hours: {attraction.opening_hours}</p>
                  <p>Entry Fee: {attraction.entry_fee}</p>
                  <p>Best Time to Visit: {attraction.best_time_to_visit}</p>
                  <p>Average Rating: {attraction.average_rating}</p>
                  <p>Contact Info: {attraction.contact_info.phone}</p>
                  <p>Facilities: {attraction.facilities.join(', ')}</p>
                  <a href={attraction.website} target="_blank" rel="noopener noreferrer">Website</a>
                  <button className="book-button">Book Tour</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default WeatherFinder;
