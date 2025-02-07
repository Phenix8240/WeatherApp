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
import airQualityIcon from "../assets/air-quality.jpg";
import countryList from "../api/countryList.json";

// Import weather videos
import clearMorning from "../assets/clear-sky.mp4";
import clearAfternoon from "../assets/clear-sky.mp4";
import clearEvening from "../assets/clear-sky.mp4";
import clearNight from "../assets/clear-sky.mp4";
import cloudyMorning from "../assets/cloudy-sky.mp4";
import cloudyAfternoon from "../assets/cloudy-sky.mp4";
import cloudyEvening from "../assets/cloudy-sky.mp4";
import cloudyNight from "../assets/cloudy-sky.mp4";
import rainVideo from "../assets/rain.mp4";
import snowVideo from "../assets/snow.mp4";
import defaultVideo from "../assets/default.mp4";

// Weather videos mapping
const weatherVideos = {
    "clear_morning": clearMorning,
    "clear_afternoon": clearAfternoon,
    "clear_evening": clearEvening,
    "clear_night": clearNight,
    "clouds_morning": cloudyMorning,
    "clouds_afternoon": cloudyAfternoon,
    "clouds_evening": cloudyEvening,
    "clouds_night": cloudyNight,
    "rain": rainVideo,
    "snow": snowVideo,
    "default": defaultVideo,
};

const Weather = () => {
    const inputRef = useRef();
    const [weatherData, setWeatherData] = useState(null);
    const [videoSrc, setVideoSrc] = useState(defaultVideo);
    const [videoKey, setVideoKey] = useState(Date.now());
    const [currentTime, setCurrentTime] = useState('');

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

    const getTimeOfDay = () => {
        const hour = new Date().getHours();
        if (hour >= 6 && hour < 12) return "morning";
        if (hour >= 12 && hour < 18) return "afternoon";
        if (hour >= 18 && hour < 24) return "evening";
        return "night";
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

    const fetchAirQuality = async (lat, lon) => {
        const url = `https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${import.meta.env.VITE_APP_ID}`;
        const response = await fetch(url);
        const data = await response.json();
        return data.list[0].main.aqi;
    };

    const fetchForecast = async (city) => {
        const url = `https://api.openweathermap.org/data/2.5/forecast?q=${city}&units=metric&appid=${import.meta.env.VITE_APP_ID}`;
        const response = await fetch(url);
        const data = await response.json();
        return data.list;
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

            // Determine background video based on weather description and time of day
            const weatherDesc = data.weather[0].main.toLowerCase().trim();
            const timeOfDay = getTimeOfDay();
            const video = weatherVideos[`${weatherDesc}_${timeOfDay}`] || weatherVideos.default;
            console.log("Video Source Set To:", video);

            setVideoSrc(video);
            setVideoKey(Date.now());

            // Fetch air quality data
            const aqi = await fetchAirQuality(data.coord.lat, data.coord.lon);

            // Fetch 7-day forecast
            const forecast = await fetchForecast(city);

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
                sunset: new Date(data.sys.sunset * 1000).toLocaleTimeString(),
                icon: icon,
                aqi: aqi,
                forecast: forecast,
            });
        } catch (error) {
            console.error("Error fetching weather data:", error);
        }
    };

    useEffect(() => {
        const updateTime = () => {
            const time = new Date().toLocaleTimeString('en-GB', { hour12: false }); // 24-hour format
            setCurrentTime(time);
        };
        updateTime();
        const intervalId = setInterval(updateTime, 1000);
        return () => clearInterval(intervalId);
    }, []);

    useEffect(() => {
        search("Kolkata");
    }, []);

    return (
        <div className='weather mt-6'>
            
            <video key={videoKey} autoPlay loop muted className="bg-video">
                <source src={videoSrc} type="video/mp4" />
                Your browser does not support the video tag.
            </video>
            <div className="search_bar">
                <input type="text" ref={inputRef} placeholder='Enter City for Search' />
                <img src={search_icon} alt="search" onClick={() => search(inputRef.current.value)} />
            </div>
            {weatherData ? (
                <>
                    <img src={weatherData.icon} alt="" className='weather_icon' />
                    <p className='temp'>{weatherData.temp}°C</p>
                    <div className="location flex items-center justify-between">
                        <p>{weatherData.location}, <span>{weatherData.country}, {weatherData.continent}</span></p>
                        <img src={weatherData.flag} alt={`${weatherData.country} flag`} className="flag_icon w-10 h-8 ml-2" />
                    </div>

                    <div className="time_of_day text-xl text-center my-2">
                        <p>Current Time: {currentTime} <span>{getTimeOfDay()}</span></p>
                    </div>

                    <div className="weather-data grid grid-cols-3 gap-4 mt-4">
                        <div className="col bg-slate-400 rounded-md flex justify-center items-center">
                            <img src={humidity_icon} alt="humidity" />
                            <div>
                                <p>{weatherData.humidity} %</p>
                                <span>Humidity</span>
                            </div>
                        </div>
                        <div className="col bg-slate-400 rounded-md flex justify-center items-center">
                            <img src={wind_icon} alt="wind speed" />
                            <div>
                                <p>{weatherData.windSpeed} Km/h</p>
                                <span>Wind Speed</span>
                            </div>
                        </div>
                        <div className="col bg-slate-400 rounded-md flex justify-center items-center">
                            <img src={wind_pressure_icon} alt="pressure" />
                            <div>
                                <p>{weatherData.pressure} mb</p>
                                <span>Wind Pressure</span>
                            </div>
                        </div>
                        <div className="col bg-slate-400 rounded-md flex justify-center items-center">
                            <img src={sealevel_icon} alt="sea level" />
                            <div>
                                <p>{weatherData.pressure} MSL</p>
                                <span>Sea Level</span>
                            </div>
                        </div>
                        <div className="col bg-slate-400 rounded-md flex justify-center items-center">
                            <img src={visibility_icon} alt="visibility" />
                            <div>
                                <p>{weatherData.visibility} Km</p>
                                <span>Visibility</span>
                            </div>
                        </div>

                        <div className="col bg-slate-400 rounded-md flex justify-center items-center">
                            <img src={airQualityIcon} alt="air quality" />
                            <div>
                                <p>{weatherData.aqi}</p>
                                <span>Air Quality</span>
                            </div>
                        </div>

                        <div className="col bg-slate-400 rounded-md flex justify-center items-center">
                            <img src={sunrise_icon} alt="sunrise" />
                            <div>
                                <p>{weatherData.sunrise}</p>
                                <span>Sunrise</span>
                            </div>
                        </div>
                        <div className="col bg-slate-400 rounded-md flex justify-center items-center">
                            <img src={sunrise_icon} alt="sunset" />
                            <div>
                                <p>{weatherData.sunset}</p>
                                <span>Sunset</span>
                            </div>
                        </div>
                    </div>

                    {/* Hourly Forecast Section */}
                    {/* Hourly Forecast Section */}
                    <div className="hourly-forecast mt-6">
                        <h1 className="text-2xl mb-4">Hourly Forecast</h1>
                        <div className="w-[calc(6*6rem)] overflow-x-auto whitespace-nowrap scrollbar-hide">
                            <div className="flex gap-2">
                                {weatherData.forecast.slice(0, 12).map((hour, index) => (
                                    <div
                                        key={index}
                                        className="hourly-card bg-gray-700 rounded-md w-20 flex-shrink-0 text-center p-2"
                                    >
                                        <p className="text-sm">
                                            {new Date(hour.dt * 1000).toLocaleTimeString([], {
                                                hour: '2-digit',
                                                minute: '2-digit',
                                            })}
                                        </p>
                                        <img
                                            src={allIcons[hour.weather[0].icon]}
                                            alt={hour.weather[0].description}
                                            className="w-12 h-12 mx-auto"
                                        />
                                        <p className="text-sm">{Math.floor(hour.main.temp)}°C</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>



                    {/* 7-Day Forecast Section */}
                    <div className="forecast flex flex-col gap-4 mt-6 w-full">
                        <h1 className='text-2xl'>7 Days Forecast</h1>
                        {weatherData.forecast.filter((item, index) => index % 8 === 0).map((day, index) => (
                            <div key={index} className="forecast-day bg-gray-700 rounded-md p-2 flex flex-row justify-around items-center h-18">
                                <p className="text-2xl md:text-base font-bold">{new Date(day.dt_txt).toLocaleDateString()}</p>
                                <img src={allIcons[day.weather[0].icon]} alt={day.weather[0].description} className="w-12 h-12 md:w-16 md:h-16" />
                                <p className="text-xl">{Math.floor(day.main.temp)}°C</p>
                            </div>
                        ))}
                    </div>

                </>
            ) : (
                <p>Loading weather data...</p>
            )}
        </div>
    );
};

export default Weather;