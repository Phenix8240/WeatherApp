import React, { useEffect, useState } from 'react';

const LocationIntelligence = () => {
    const [userLocation, setUserLocation] = useState(null);
    const [cities, setCities] = useState([]);
    const [selectedCities, setSelectedCities] = useState([]);
    const [weatherData, setWeatherData] = useState([]);

    // Auto-Detect User’s Location
    useEffect(() => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const { latitude, longitude } = position.coords;
                    setUserLocation({ latitude, longitude });
                },
                (error) => {
                    console.error("Error fetching location:", error);
                }
            );
        } else {
            console.error("Geolocation is not supported by this browser.");
        }
    }, []);

    // Multi-City Weather Comparison
    const fetchWeatherForCities = async (cityNames) => {
        const weatherPromises = cityNames.map(async (city) => {
            const response = await fetch(
                `https://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&appid=${import.meta.env.VITE_APP_ID}`
            );
            return response.json();
        });
        const weatherData = await Promise.all(weatherPromises);
        setWeatherData(weatherData);
    };

    const handleCitySelection = (e) => {
        const selected = Array.from(e.target.selectedOptions, (option) => option.value);
        setSelectedCities(selected);
    };

    const compareCities = () => {
        fetchWeatherForCities(selectedCities);
    };

    return (
        <div className="location-intelligence p-4">
            <h1 className="text-2xl font-bold mb-4">Location Intelligence & Geo-Targeting</h1>

            {/* Auto-Detect User’s Location */}
            <div className="auto-detect mb-6">
                <h2 className="text-xl font-semibold mb-2">Auto-Detect User’s Location</h2>
                {userLocation ? (
                    <p>
                        Your location: Latitude {userLocation.latitude}, Longitude {userLocation.longitude}
                    </p>
                ) : (
                    <p>Fetching your location...</p>
                )}
            </div>

            {/* Multi-City Weather Comparison */}
            <div className="multi-city mb-6">
                <h2 className="text-xl font-semibold mb-2">Multi-City Weather Comparison</h2>
                <select multiple onChange={handleCitySelection} className="border p-2 w-full">
                    <option value="London">London</option>
                    <option value="New York">New York</option>
                    <option value="Tokyo">Tokyo</option>
                    <option value="Paris">Paris</option>
                </select>
                <button onClick={compareCities} className="bg-blue-500 text-white p-2 mt-2">
                    Compare Cities
                </button>
                <div className="weather-comparison mt-4">
                    {weatherData.map((data, index) => (
                        <div key={index} className="city-weather bg-slate-100 p-2 mb-2">
                            <p>{data.name}: {Math.floor(data.main.temp)}°C</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Satellite & Radar Weather Maps Integration */}
            <div className="satellite-maps">
                <h2 className="text-xl font-semibold mb-2">Satellite & Radar Weather Maps</h2>
                <iframe
                    src="https://www.windy.com/"
                    width="100%"
                    height="500"
                    title="Satellite and Radar Weather Map"
                ></iframe>
            </div>
        </div>
    );
};

export default LocationIntelligence;