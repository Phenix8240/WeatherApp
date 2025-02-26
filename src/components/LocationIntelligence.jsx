import React, { useEffect, useState } from "react";
import {
  WiDaySunny,
  WiRain,
  WiSnow,
  WiThunderstorm,
  WiCloudy,
} from "react-icons/wi";

const LocationIntelligence = () => {
  const [userLocation, setUserLocation] = useState(null);
  const [weather, setWeather] = useState(null);
  const API_KEY = import.meta.env.VITE_APP_ID;

  const indianCities = ["Srinagar","Delhi","Jaipur","Mumbai","Gangtok","Kolkata","Guwahati","Agartala","Bhubaneswar", "Bangalore", "Hyderabad", "Chennai"];
  const worldCities = ["New York", "Moscow","London", "Tokyo", "Seoul", "Paris","Sydney","Berlin", "Dubai"];
  const [cityWeather, setCityWeather] = useState([]);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation({ latitude, longitude });
          fetchWeatherByCoords(latitude, longitude);
        },
        (error) => console.error("Error fetching location:", error)
      );
    }
  }, []);

  const fetchWeatherByCoords = async (lat, lon) => {
    try {
      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}`
      );
      const data = await response.json();
      setWeather(data);
    } catch (error) {
      console.error("Error fetching weather data:", error);
    }
  };

  useEffect(() => {
    const fetchWeatherForCities = async () => {
      const promises = [...indianCities, ...worldCities].map(async (city) => {
        const response = await fetch(
          `https://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&appid=${API_KEY}`
        );
        return response.json();
      });
      const results = await Promise.all(promises);
      setCityWeather(results);
    };
    fetchWeatherForCities();
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-center mb-6">🌎 Location Intelligence & Weather Insights</h1>

      {weather && (
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold">📍 Your Current Location</h2>
          <p className="text-lg">{weather.name}, {weather.sys.country}</p>
          <p className="text-xl font-semibold">{weather.main.temp}°C</p>
        </div>
      )}

      <h2 className="text-2xl font-bold mt-8">Indian Cities</h2>
      <div className="flex flex-wrap justify-center gap-6 p-4 overflow-x-auto">
  {cityWeather
    .filter(city => indianCities.includes(city.name))
    .map((city, index) => (
      <div
        key={index}
        className="w-72 bg-gradient-to-r from-blue-500 to-purple-600 text-white p-6 rounded-lg shadow-lg"
      >
        <h3 className="text-lg font-semibold">📍 {city.name}, {city.sys.country}</h3>
        <p className="text-2xl font-bold">🌡️ {city.main.temp}°C</p>
        <p className="text-sm">Feels Like: {city.main.feels_like}°C</p>
        <p className="text-sm">Humidity: {city.main.humidity}%</p>
        <p className="text-sm">Wind Speed: {city.wind.speed} m/s</p>
      </div>
    ))}
</div>


      <h2 className="text-2xl font-bold mt-8">🌍 World Cities</h2>
      <div className="flex flex-wrap justify-center gap-6 p-4 overflow-x-auto">
        {cityWeather.filter(city => worldCities.includes(city.name)).map((city, index) => (
          <div key={index} className="w-72 bg-gradient-to-r from-green-400 to-blue-500 text-white p-6 rounded-lg shadow-lg">
            <h3 className="text-lg font-semibold">📍 {city.name}, {city.sys.country}</h3>
            <p className="text-2xl font-bold">🌡️ {city.main.temp}°C</p>
            <p className="text-sm">Feels Like: {city.main.feels_like}°C</p>
            <p className="text-sm">Humidity: {city.main.humidity}%</p>
            <p className="text-sm">Wind Speed: {city.wind.speed} m/s</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LocationIntelligence;
