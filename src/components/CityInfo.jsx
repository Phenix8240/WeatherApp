// src/components/CityFinder.js

// import React, { useState } from 'react';
// import './CityInfo.css';
// import cityData from '../api/TouristSpot.json';  // Import the JSON data

// const CityFinder = () => {
//   const [cityName, setCityName] = useState('');
//   const [selectedCityData, setSelectedCityData] = useState(null);

//   const handleSearch = () => {
//     const result = cityData[cityName];
//     setSelectedCityData(result);
//   };

//   return (
//     <div className="container">
//       <h1>City Finder</h1>
//       <div className="search-bar">
//         <input
//           type="text"
//           className="input"
//           value={cityName}
//           onChange={(e) => setCityName(e.target.value)}
//           placeholder="Enter city name"
//         />
//         <button className="button" onClick={handleSearch}>Search</button>
//       </div>

//       {selectedCityData && (
//         <div className="city-info">
//           <h2>{selectedCityData.description}</h2>
//           <p>Coordinates: Latitude {selectedCityData.coordinates.latitude}, Longitude {selectedCityData.coordinates.longitude}</p>
//           <h3>Best Time to Visit</h3>
//           <p>{selectedCityData.best_time_to_visit.join(', ')}</p>
//           <h3>Local and Cultural Events</h3>
//           <ul>
//             {selectedCityData.local_and_cultural_events.map((event, index) => (
//               <li key={index}>{event}</li>
//             ))}
//           </ul>
//           <h3>Famous Food</h3>
//           <ul>
//             {selectedCityData.famous_food.map((food, index) => (
//               <li key={index}>{food}</li>
//             ))}
//           </ul>

//           <h3>Nearby Hotels</h3>
//           <div className="card-container">
//             {selectedCityData.nearby_hotels.map((hotel, index) => (
//               <div key={index} className="card hotel-card">
//                 <img src={hotel.image_url} alt={hotel.name} className="card-image" />
//                 <div className="card-content">
//                   <h3>{hotel.name}</h3>
//                   <p>{hotel.address}</p>
//                   <p>Contact: {hotel.contact}</p>
//                   <p>Rating: {hotel.rating}</p>
//                   <p>Amenities: {hotel.amenities.join(', ')}</p>
//                   <a href={hotel.website} target="_blank" rel="noopener noreferrer">Website</a>
//                   <button className="book-button">Book Now</button>
//                 </div>
//               </div>
//             ))}
//           </div>

//           <h3>Attractions</h3>
//           <div className="card-container">
//             {selectedCityData.attractions.map((attraction, index) => (
//               <div key={index} className="card attraction-card">
//                 <img src={attraction.image_url} alt={attraction.name} className="card-image" />
//                 <div className="card-content">
//                   <h3>{attraction.name}</h3>
//                   <p>{attraction.description}</p>
//                   <p>Coordinates: Latitude {attraction.coordinates.latitude}, Longitude {attraction.coordinates.longitude}</p>
//                   <p>Opening Hours: {attraction.opening_hours}</p>
//                   <p>Entry Fee: {attraction.entry_fee}</p>
//                   <p>Best Time to Visit: {attraction.best_time_to_visit}</p>
//                   <p>Average Rating: {attraction.average_rating}</p>
//                   <p>Contact Info: {attraction.contact_info.phone}</p>
//                   <p>Facilities: {attraction.facilities.join(', ')}</p>
//                   <a href={attraction.website} target="_blank" rel="noopener noreferrer">Website</a>
//                   <button className="book-button">Book Tour</button>
//                 </div>
//               </div>
//             ))}
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default CityFinder;


import React, { useState } from 'react';
import axios from 'axios';

const GeminiPackage = () => {
    const [placeName, setPlaceName] = useState('');
    const [hotels, setHotels] = useState([]);
    const [touristSpots, setTouristSpots] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    const handleSearch = async () => {
        setIsLoading(true);
        try {
            const hotelResponse = await axios.get(`https://api.gemini.example.com/hotels`, {
                params: { placeName: placeName, apiKey: 'AIzaSyDXLalygS0hAPn55rWh89yeoeiQV8B5DcU' }
            });

            const touristSpotResponse = await axios.get(`https://api.gemini.example.com/tourist-spots`, {
                params: { placeName: placeName, apiKey: 'AIzaSyDXLalygS0hAPn55rWh89yeoeiQV8B5DcU' }
            });

            setHotels(hotelResponse.data.hotels);
            setTouristSpots(touristSpotResponse.data.touristSpots);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="gemini-package">
            <h1>Discover Nearby Hotels and Tourist Spots</h1>
            <div className="search-bar">
                <input 
                    type="text" 
                    value={placeName} 
                    onChange={(e) => setPlaceName(e.target.value)} 
                    placeholder="Enter a place name..." 
                />
                <button onClick={handleSearch}>Search</button>
            </div>
            {isLoading ? (
                <p>Loading...</p>
            ) : (
                <div className="results">
                    <h2>Hotels</h2>
                    <div className="cards-container">
                        {hotels.map((hotel, index) => (
                            <div className="card" key={index}>
                                <h3>{hotel.name}</h3>
                                <p>{hotel.address}</p>
                                <p>Rating: {hotel.rating}</p>
                            </div>
                        ))}
                    </div>
                    <h2>Tourist Spots</h2>
                    <div className="cards-container">
                        {touristSpots.map((spot, index) => (
                            <div className="card" key={index}>
                                <h3>{spot.name}</h3>
                                <p>{spot.description}</p>
                            </div>
                        ))}
                    </div>
                    <h2>Combined Package</h2>
                    <div className="package-card">
                        <h3>Package for {placeName}</h3>
                        <p>{`Includes ${hotels.length} hotels and ${touristSpots.length} tourist spots.`}</p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default GeminiPackage;
