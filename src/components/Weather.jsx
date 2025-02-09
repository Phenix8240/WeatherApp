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
import timeZones from '../api/timeZones.json';


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
import SearchBar from './Searchbar';

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
    const [currentTime, setCurrentTime] = useState(""); // Indian Time
    const [localTime, setLocalTime] = useState(""); // Searched City's Local Time
    const [isIndianLocation, setIsIndianLocation] = useState(true);
    const [timeInterval, setTimeInterval] = useState(null);
    const [timeDiff,setTimeDiff]=useState(null)
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

    const getWeatherVideo = (weather, hour) => {
        if (weather.includes("clear")) {
            if (hour >= 6 && hour < 12) return weatherVideos.clear_morning;
            if (hour >= 12 && hour < 18) return weatherVideos.clear_afternoon;
            if (hour >= 18 && hour < 20) return weatherVideos.clear_evening;
            return weatherVideos.clear_night;
        } else if (weather.includes("cloud")) {
            if (hour >= 6 && hour < 12) return weatherVideos.clouds_morning;
            if (hour >= 12 && hour < 18) return weatherVideos.clouds_afternoon;
            if (hour >= 18 && hour < 20) return weatherVideos.clouds_evening;
            return weatherVideos.clouds_night;
        } else if (weather.includes("rain")) {
            return weatherVideos.rain;
        } else if (weather.includes("snow")) {
            return weatherVideos.snow;
        }
        return weatherVideos.default;
    };
    const getTimeOfDay = () => {
        const hour = new Date().getHours();

        if (hour >= 4 && hour < 6) return "Dawn 🌅";
        if (hour >= 6 && hour < 9) return "Morning ☀️";
        if (hour >= 9 && hour < 12) return "Late morning 🌞";
        if (hour >= 12 && hour < 15) return "Afternoon ☀️🔥";
        if (hour >= 15 && hour < 18) return "Late afternoon 🌇";
        if (hour >= 18 && hour < 20) return "Evening 🌆";
        if (hour >= 20 && hour < 22) return "Dusk 🌙";
        if (hour >= 22 && hour < 24) return "Night 💫";
        return "Midnight 😴";
    };

    const getCountryInfo = (countryCode) => {
        return countryList[countryCode] || { 
            name: "Unknown Country", 
            countryCode: "unknown", 
            continent: "unknown", 
            population: "unknown" 
        };
    };

    const getFlagURL = (countryCode) => {
        return `https://flagcdn.com/w320/${countryCode.toLowerCase()}.png`;
    };

    const fetchAirQuality = async (lat, lon) => {
        const url = `https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${import.meta.env.VITE_APP_ID}`;
        const response = await fetch(url);
        const data = await response.json();
        console.log(data);
        
        return data.list[0]?.main?.aqi || "N/A";
    };

    const fetchForecast = async (city) => {
        const url = `https://api.openweathermap.org/data/2.5/forecast?q=${city}&units=metric&appid=${import.meta.env.VITE_APP_ID}`;
        const response = await fetch(url);
        const data = await response.json();
        return data.list;
    };

    const fetchLocalTime = (countryCode) => {
        try {
            if (countryCode === 'IN') {
                setIsIndianLocation(true);
                setLocalTime(""); // Reset local time for India
                return;
            }
    
            setIsIndianLocation(false);
            const timeZone = timeZones[countryCode] || 'UTC';
    
            // Clear any existing interval to avoid multiple updates
            if (timeInterval) {
                clearInterval(timeInterval);
            }
    
            const updateTime = () => {
                const time = new Date().toLocaleTimeString("en-GB", {
                    hour12: false,
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                    timeZone: timeZone
                });
    
                setLocalTime(time);
            };
    
            // Update time immediately and set interval to update every second
            updateTime();
            const interval = setInterval(updateTime, 1000);
            setTimeInterval(interval); // Store interval ID
    
        } catch (error) {
            console.error("Error getting local time:", error);
            setLocalTime("N/A");
        }
    };
    
    // Clean up interval when component unmounts or countryCode changes
    useEffect(() => {
        return () => {
            if (timeInterval) {
                clearInterval(timeInterval);
            }
        };
    }, [timeInterval]);
    
    // Add this to your Weather component's state
   
    const calculateTimeDifference = (countryCode) => {
        try {
            const indianTimeZone = "Asia/Kolkata"; // IST (UTC+5:30)
            const targetTimeZone = timeZones[countryCode] || "UTC"; // Default to UTC if unknown
    
            // Get the current time in IST and target time zone
            const indianDate = new Date(new Date().toLocaleString("en-US", { timeZone: indianTimeZone }));
            const targetDate = new Date(new Date().toLocaleString("en-US", { timeZone: targetTimeZone }));
    
            // Calculate time difference in minutes
            let diffMinutes = Math.abs(Math.floor((targetDate - indianDate) / (1000 * 60))); // Always positive
            let diffHours = Math.floor(diffMinutes / 60);
            let remainingMinutes = diffMinutes % 60;
    
            // Format time difference as absolute value
            return `${diffHours}h ${remainingMinutes}m`;
        } catch (error) {
            console.error("Error calculating time difference:", error);
            return "N/A";
        }
    };
    

    // Modify your search function
    const searchTime = async (city) => {
        if (!city.trim()) {
            alert("Enter a valid city name");
            return;
        }
        
        // Clear existing interval if any
        if (timeInterval) {
            clearInterval(timeInterval);
        }
        
        try {
            const url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&appid=${import.meta.env.VITE_APP_ID}`;
            const response = await fetch(url);
            const data = await response.json();
    
            if (data.cod !== 200) {
                alert(data.message || "City not found");
                return;
            }
    
            const countryCode = data.sys.country;
            console.log(countryCode);
            
            
            // Set up continuous time updates
            const newInterval = setInterval(async () => {
                const localTimeValue = await fetchLocalTime(countryCode);
                

                setLocalTime(localTimeValue);
            }, 1000);
            
            setTimeInterval(newInterval);
            
            // Rest of your existing code...
        } catch (error) {
            console.error("Error fetching weather data:", error);
        }
    };
    
    // Add cleanup in useEffect
    useEffect(() => {
        return () => {
            if (timeInterval) {
                clearInterval(timeInterval);
            }
        };
    }, [timeInterval]);

    const search = async (city) => {
        if (!city.trim()) {
            alert("Enter a valid city name");
            return;
        }
        try {
            const url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&appid=${import.meta.env.VITE_APP_ID}`;
            const response = await fetch(url);
            const data = await response.json();

            if (data.cod !== 200) {
                alert(data.message || "City not found");
                return;
            }

            const countryCode = data.sys.country;
            const countryDetails = getCountryInfo(countryCode);
            const flagURL = getFlagURL(countryCode);
            const timeDiff =await calculateTimeDifference(countryCode); // Example: USA
            console.log("Time Difference from IST:", timeDiff);
            setTimeDiff(timeDiff)

            // Fetch local time only for non-Indian locations
            const timezone = data.timezone / 3600; // Convert seconds to hours offset
            const localTimeValue = await fetchLocalTime(countryCode, `Etc/GMT${timezone >= 0 ? "-" : "+"}${Math.abs(timezone)}`);
            setLocalTime(localTimeValue);

            // Fetch air quality and forecast
            const aqi = await fetchAirQuality(data.coord.lat, data.coord.lon);
            const forecast = await fetchForecast(city);
            

            const weatherDescription = data.weather[0].description.toLowerCase();
            const hour = new Date().getHours();
            setVideoSrc(getWeatherVideo(weatherDescription, hour));
            setVideoKey(Date.now()); // Force video refresh
            setWeatherData({
                humidity: data.main.humidity,
                windSpeed: data.wind.speed,
                temp: Math.floor(data.main.temp),
                country: countryDetails.name || countryCode,
                continent: countryDetails.continent,
                flag: flagURL,
                location: data.name,
                description: data.weather[0].description,
                visibility: (data.visibility / 1000).toFixed(1) + " km",
                sunrise: new Date(data.sys.sunrise * 1000).toLocaleTimeString(),
                sunset: new Date(data.sys.sunset * 1000).toLocaleTimeString(),
                icon: allIcons[data.weather[0].icon] || clear_icon,
                aqi: aqi,
                forecast: forecast,
                pressure: data.main.pressure,
                countryCode: countryCode,
            });
        } catch (error) {
            console.error("Error fetching weather data:", error);
        }
    };

    useEffect(() => {
        const updateIndianTime = () => {
            const time = new Date().toLocaleTimeString("en-GB", { 
                hour12: false, 
                timeZone: "Asia/Kolkata" 
            });
            setCurrentTime(time);
        };
        updateIndianTime();
        const intervalId = setInterval(updateIndianTime, 1000);
        return () => clearInterval(intervalId);
    }, []);

    useEffect(() => {
        search("Kolkata");
    }, []);

    return (
        <div className="weather mt-12 flex flex-col items-center justify-center gap-6 p-6 bg-gray-800 text-white rounded-2xl shadow-lg w-full max-w-5xl mx-auto">
            <video key={videoKey} autoPlay loop muted className="bg-video">
                <source src={videoSrc} type="video/mp4" />
                Your browser does not support the video tag.
            </video>

            <SearchBar onSearch={search}/>

            {weatherData ? (
                <>
                    <div className="flex flex-col items-center text-center">
                        <img
                            src={weatherData.icon}
                            alt=""
                            className="weather_icon w-20 h-20 sm:w-24 sm:h-24 md:w-24 md:h-24 lg:w-32 lg:h-32 transition-all"
                        />
                        <p className="temp text-3xl sm:text-4xl md:text-4xl lg:text-5xl font-bold text-blue-300 drop-shadow-lg">
                            {weatherData.temp}°C
                        </p>

                        <div className="location flex flex-wrap items-center justify-center text-lg mt-2">
                            <p className="font-semibold text-white bg-gray-700 px-3 py-1 rounded-lg">
                                {weatherData.location},
                                <span className="text-gray-300">
                                    <span> {weatherData.country}</span> , {weatherData.continent}
                                </span>
                            </p>
                            <img
                                src={weatherData.flag}
                                alt={`${weatherData.country} flag`}
                                className="flag_icon w-10 h-8 ml-2 md:w-10 md:h-8 border border-gray-300 rounded-md"
                            />
                        </div>

                        <div className="time_of_day text-lg text-center my-3 bg-blue-500 text-white px-4 py-2 rounded-lg shadow-md">
                            {isIndianLocation ? (
                                <p className="font-semibold">
                                    🕒 Time: <span className="font-bold ml-2">{currentTime}</span> {getTimeOfDay()}
                                </p>
                            ) : (
                                <>
                                    <p className="font-semibold">
                                        🕒 India Time: <span className="font-bold ml-2">{currentTime}</span> {getTimeOfDay()}
                                    </p>
                                    <p className="font-semibold">
                                        🌎 {weatherData.location} Time: <span className="font-bold ml-2">{localTime}</span>
                                    </p>
                                    <p className="font-semibold">
                                        ⌛Time Difference: <span className="font-bold ml-2">{timeDiff}</span>
                                    </p>
                                </>
                            )}
                        </div>
                    </div>

                    <div className="weather-data flex flex-wrap justify-center gap-4 mt-4">
                        {[
                            { icon: humidity_icon, value: `${weatherData.humidity} %`, label: "Humidity" },
                            { icon: wind_icon, value: `${weatherData.windSpeed} Km/h`, label: "Wind Speed" },
                            { icon: wind_pressure_icon, value: `${weatherData.pressure} mb`, label: "Wind Pressure" },
                            { icon: sealevel_icon, value: `${weatherData.pressure} MSL`, label: "Sea Level" },
                            { icon: visibility_icon, value: weatherData.visibility, label: "Visibility" },
                            { icon: airQualityIcon, value: weatherData.aqi, label: "Air Quality" },
                            { icon: sunrise_icon, value: weatherData.sunrise, label: "Sunrise" },
                            { icon: sunrise_icon, value: weatherData.sunset, label: "Sunset" }
                        ].map((data, index) => (
                            <div key={index} className="bg-slate-400 rounded-md flex items-center p-3 w-40 sm:w-48 md:w-56">
                                <img src={data.icon} alt={data.label} className="w-10 h-10 mr-2" />
                                <div className="text-center">
                                    <p className="font-semibold">{data.value}</p>
                                    <span className="text-sm">{data.label}</span>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="hourly-forecast mt-6">
                        <h1 className="text-2xl mb-4">Hourly Forecast</h1>
                        <div className="flex flex-wrap justify-center gap-4">
                            {weatherData.forecast.slice(0, 12).map((hour, index) => (
                                <div
                                    key={index}
                                    className="hourly-card bg-gray-700 rounded-md w-24 sm:w-28 md:w-32 flex flex-col items-center p-3"
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
                                        className="w-12 h-12"
                                    />
                                    <p className="text-sm font-semibold">{Math.floor(hour.main.temp)}°C</p>
                                </div>
                            ))}
                        </div>
                    </div>


                    {/* 7-Day Forecast Section */}
                    <div className="forecast flex flex-col items-center gap-4 mt-6 w-full">
                        <h1 className="text-2xl">Next 5 Days Forecast🧐</h1>
                        {weatherData.forecast.filter((_, index) => index % 8 === 0).map((day, index) => (
                            <div
                                key={index}
                                className="forecast-day bg-gray-700 rounded-md p-4 flex justify-between items-center w-full max-w-lg"
                            >
                                <p className="text-lg md:text-base font-bold">
                                    {new Date(day.dt_txt).toLocaleDateString()}
                                </p>
                                <img
                                    src={allIcons[day.weather[0].icon]}
                                    alt={day.weather[0].description}
                                    className="w-12 h-12 md:w-16 md:h-16"
                                />
                                <p className="text-xl font-semibold">{Math.floor(day.main.temp)}°C</p>
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