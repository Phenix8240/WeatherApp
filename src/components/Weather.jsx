import React, { useEffect, useRef, useState } from 'react';
import "./Weather.css";
import search_icon from "../assets/search.png";
import clear_icon from "../assets/clear.png";
import cloud_icon from "../assets/cloud.png";
import drizzle_icon from "../assets/drizzle.png";
import rain_icon from "../assets/rain.png";
import snow_icon from "../assets/snow.png";
import wind_icon from "../assets/wind.png";
import wind_pressure_icon from "../assets/windpressure.png";
import humidity_icon from "../assets/humidity.png";
import visibility_icon from "../assets/visibility.png";
import sunrise_icon from "../assets/sunrise.png";
import sealevel_icon from "../assets/sealevel.png";
import countryList from "../api/countryList.json";

// Import weather videos
import clearVideo from "../assets/clear-sky.mp4";
import cloudVideo from "../assets/cloudy.mp4";
import drizzleVideo from "../assets/foggy.mp4";
import rainVideo from "../assets/rain.mp4";
import snowVideo from "../assets/snow.mp4";
import defaultVideo from "../assets/default.mp4";

// Weather videos mapping
const weatherVideos = {
    "clear": clearVideo,
    "clouds": cloudVideo,
    "drizzle": drizzleVideo,
    "rain": rainVideo,
    "snow": snowVideo,
    "default": defaultVideo
};

const Weather = () => {
    const inputRef = useRef();
    const [weatherData, setWeatherData] = useState(null);
    const [videoSrc, setVideoSrc] = useState(defaultVideo);
    const [videoKey, setVideoKey] = useState(Date.now()); // Unique key to force video reload

    const allIcons = {
        "01d": clear_icon,
        "01n": clear_icon,
        "02d": cloud_icon,
        "02n": cloud_icon,
        "03d": cloud_icon,
        "03n": cloud_icon,
        "04d": drizzle_icon,
        "04n": drizzle_icon,
        "09d": drizzle_icon,
        "09n": rain_icon,
        "10d": rain_icon,
        "10n": rain_icon,
        "13d": snow_icon,
        "13n": snow_icon,
    };

    const getCountryInfo = (countryCode) => {
        return countryList[countryCode] || { name: 'Unknown Country', countryCode: 'unknown', continent: 'unknown', population: 'unknown' };
    };

    const getFlagURL = (countryCode) => {
        try {
            const url = `https://flagcdn.com/w320/${countryCode.toLowerCase()}.png`;
            return url;
        } catch (error) {
            console.error("Error fetching flag data:", error);
        } 
    };

    const search = async (city) => {
        if (city === "") {
            alert("Enter City Name");
            return;
        }
        try {
            const url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&appid=${import.meta.env.VITE_APP_ID}`;
            const response = await fetch(url);
            const data = await response.json();
            console.log(data);

            const icon = allIcons[data.weather[0].icon] || clear_icon;
            const countryCode = data.sys.country;
            const countryDetails = getCountryInfo(countryCode);
            const flagURL = getFlagURL(countryCode);

            // Determine background video based on weather description
            const weatherDesc = data.weather[0].main.toLowerCase().trim();
            console.log("Weather Description:", weatherDesc);
            
            const video = weatherVideos[weatherDesc] || weatherVideos.default;
            console.log("Video Source Set To:", video);

            setVideoSrc(video);
            setVideoKey(Date.now()); // Update key to force reload

            setWeatherData({
                humidity: data.main.humidity,
                windSpeed: data.wind.speed,
                temp: Math.floor(data.main.temp),
                pressure: data.main.sea_level ? Math.floor(data.main.sea_level) : 'N/A',
                country: countryDetails.name || countryCode,
                continent: countryDetails.continent,
                flag: flagURL,
                location: data.name,
                des: data.weather[0].description,
                visibility: data.visibility / 1000,  
                sunrise: new Date(data.sys.sunrise * 1000).toLocaleTimeString(),  
                icon: icon
            });
        } catch (error) {
            console.error("Error fetching weather data:", error);
        }
    };

    useEffect(() => {
        search("Kolkata");
    }, []);

    return (
        <div className='weather'>
            <video key={videoKey} autoPlay loop muted className="bg-video">
                <source src={videoSrc} type="video/mp4" />
                Your browser does not support the video tag.
            </video>
            <div className="search_bar">
                <input type="text" ref={inputRef} placeholder='Search' />
                <img src={search_icon} alt="search" onClick={() => search(inputRef.current.value)} />
            </div>
            {weatherData ? (
                <>
                    <img src={weatherData.icon} alt="" className='weather_icon' />
                    <p className='temp'>{weatherData.temp}°C</p>
                    <div className="location">
                        <p>{weatherData.location}, <span>{weatherData.country}, {weatherData.continent}   <img src={weatherData.flag} alt={`${weatherData.country} flag`} className="flag_icon" /> </span></p>
                    </div>
                    <p className='location'>{weatherData.des.toUpperCase()}</p>
                    <div className="weather-data">
                        <div className="col">
                            <img src={humidity_icon} alt="humidity" />
                            <div>
                                <p>{weatherData.humidity} %</p>
                                <span>Humidity</span>
                            </div>
                        </div>
                        <div className="col">
                            <img src={wind_icon} alt="wind speed" />
                            <div>
                                <p>{weatherData.windSpeed} Km/h</p>
                                <span>Wind Speed</span>
                            </div>
                        </div>
                        <div className="col">
                            <img src={wind_pressure_icon} alt="pressure" />
                            <div>
                                <p>{weatherData.pressure} mb</p>
                                <span>Wind Pressure</span>
                            </div>
                        </div>
                        <div className="col">
                            <img src={sealevel_icon} alt="sea level" />
                            <div>
                                <p>{weatherData.pressure} MSL</p>
                                <span>Sea Level</span>
                            </div>
                        </div>
                        <div className="col">
                            <img src={visibility_icon} alt="visibility" />
                            <div>
                                <p>{weatherData.visibility} Km</p>
                                <span>Visibility</span>
                            </div>
                        </div>
                        <div className="col">
                            <img src={sunrise_icon} alt="sunrise" />
                            <div>
                                <p>{weatherData.sunrise}</p>
                                <span>Sunrise</span>
                            </div>
                        </div>
                    </div>
                </>
            ) : (
                <p>Loading...</p>
            )}
        </div>
    );
};

export default Weather;
