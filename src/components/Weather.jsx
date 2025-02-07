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
    const [currentTime, setCurrentTime] = useState("");

    const allIcons = {
        // "01d": clear_icon,  // Sunny (Day)
        // "01n": clear_night_icon, // Clear Night
        // "02d": cloud_icon,  // Few Clouds (Day)
        // "02n": cloud_night_icon, // Few Clouds (Night)
        // "03d": cloud_icon,  // Scattered Clouds
        // "03n": cloud_night_icon,
        // "04d": drizzle_icon,  // Broken Clouds
        // "04n": drizzle_night_icon,
        // "09d": drizzle_icon,  // Shower Rain
        // "09n": rain_night_icon,
        // "10d": rain_icon,  // Rain (Day)
        // "10n": rain_night_icon, // Rain (Night)
        // "11d": thunderstorm_icon,  // Thunderstorm
        // "11n": thunderstorm_night_icon,
        // "13d": snow_icon,  // Snow
        // "13n": snow_night_icon
        // ,
        // "50d": mist_icon,  // Mist
        // "50n": mist_night_icon,
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

        if (hour >= 4 && hour < 6) return "Dawn 🌅";       // Early morning, before sunrise
        if (hour >= 6 && hour < 9) return "Morning ☀️";    // Morning
        if (hour >= 9 && hour < 12) return "Late morning 🌞"; // Late morning before noon
        if (hour >= 12 && hour < 15) return "Afternoon ☀️🔥";  // Early afternoon
        if (hour >= 15 && hour < 18) return "Late afternoon 🌇"; // Late afternoon
        if (hour >= 18 && hour < 20) return "Evening 🌆";   // Evening
        if (hour >= 20 && hour < 22) return "Dusk 🌙";      // Dusk, after sunset
        if (hour >= 22 && hour < 24) return "Night 💫";     // Nighttime
        return "Midnight 😴";  // Midnight (0 - 4 AM)
    };



    const getCountryInfo = (countryCode) => {
        return countryList[countryCode] || { name: "Unknown Country", countryCode: "unknown", continent: "unknown", population: "unknown" };
    };

    const getFlagURL = (countryCode) => {
        return `https://flagcdn.com/w320/${countryCode.toLowerCase()}.png`;
    };

    const fetchAirQuality = async (lat, lon) => {
        const url = `https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${import.meta.env.VITE_APP_ID}`;
        const response = await fetch(url);
        const data = await response.json();
        return data.list[0]?.main?.aqi || "N/A";
    };

    const fetchForecast = async (city) => {
        const url = `https://api.openweathermap.org/data/2.5/forecast?q=${city}&units=metric&appid=${import.meta.env.VITE_APP_ID}`;
        const response = await fetch(url);
        const data = await response.json();
        return data.list;
    };

    const search = async (city) => {
        if (!city.trim()) {
            alert("Enter a valid city name");
            return;
        }
        try {
            const url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&appid=${import.meta.env.VITE_APP_ID}`;
            const response = await fetch(url);
            const data = await response.json();
            console.log(data);

            if (data.cod !== 200) {
                alert(data.message || "City not found");
                return;
            }

            const icon = allIcons[data.weather[0].icon] || clear_icon;
            const countryCode = data.sys.country;
            const countryDetails = getCountryInfo(countryCode);
            const flagURL = getFlagURL(countryCode);

            // Determine background video based on weather description and time of day
            const weatherDesc = data.weather[0].main.toLowerCase().trim();
            const timeOfDay = getTimeOfDay();
            const video = weatherVideos[`${weatherDesc}_${timeOfDay}`] || weatherVideos.default;

            setVideoSrc(video);
            setVideoKey(Date.now());

            // Fetch air quality data
            const aqi = await fetchAirQuality(data.coord.lat, data.coord.lon);

            // Fetch forecast data
            const forecast = await fetchForecast(city);

            setWeatherData({
                humidity: data.main.humidity,
                windSpeed: data.wind.speed,
                temp: Math.floor(data.main.temp),
                pressure: data.main.sea_level ? Math.floor(data.main.sea_level) : "N/A",
                country: countryDetails.name || countryCode,
                continent: countryDetails.continent,
                flag: flagURL,
                location: data.name,
                description: data.weather[0].description,
                visibility: (data.visibility / 1000).toFixed(1) + " km",
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
            const time = new Date().toLocaleTimeString("en-GB", { hour12: false }); // 24-hour format
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
        <div className="weather mt-6 flex flex-col  items-center justify-center gap-6 p-6 bg-gray-800 text-white rounded-2xl shadow-lg w-full max-w-5xl mx-auto">


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
                    <div className="flex flex-col items-center text-center">
                        <img
                            src={weatherData.icon}
                            alt=""
                            className="
          weather_icon w-20 h-20 
          sm:w-24 sm:h-24 md:w-24 md:h-24 
          lg:w-32 lg:h-32 transition-all
        "
                        />
                        <p className="
        temp text-3xl sm:text-4xl 
        md:text-4xl lg:text-5xl font-bold 
        text-blue-300 drop-shadow-lg
      ">
                            {weatherData.temp}°C
                        </p>

                        <div className="location flex flex-wrap items-center justify-center text-lg mt-2">
                            <p className="font-semibold text-white bg-gray-700 px-3 py-1 rounded-lg">
                                {weatherData.location},
                                <span className="text-gray-300">
                                    <span>  {weatherData.country}</span> ,  {weatherData.continent}
                                </span>
                            </p>
                            <img
                                src={weatherData.flag}
                                alt={`${weatherData.country} flag`}
                                className="flag_icon w-10 h-8 ml-2 md:w-10 md:h-8 border border-gray-300 rounded-md"
                            />
                        </div>

                        <div className="time_of_day text-lg text-center my-3 bg-blue-500 text-white px-4 py-2 rounded-lg shadow-md">
                            <p className="font-semibold">
                                Current Time:
                                <span className="font-bold ml-2">{currentTime}</span>
                                <span className="italic ml-1">{getTimeOfDay()}</span>
                            </p>
                        </div>
                    </div>
                    <div className="weather-data flex flex-wrap justify-center gap-4 mt-4">
                        {[
                            { icon: humidity_icon, value: `${weatherData.humidity} %`, label: "Humidity" },
                            { icon: wind_icon, value: `${weatherData.windSpeed} Km/h`, label: "Wind Speed" },
                            { icon: wind_pressure_icon, value: `${weatherData.pressure} mb`, label: "Wind Pressure" },
                            { icon: sealevel_icon, value: `${weatherData.pressure} MSL`, label: "Sea Level" },
                            { icon: visibility_icon, value: `${weatherData.visibility} Km`, label: "Visibility" },
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


                    {/* Hourly Forecast Section */}
                    {/* Hourly Forecast Section */}
                    {/* Hourly Forecast Section */}
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
                        <h1 className="text-2xl">7 Days Forecast</h1>
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