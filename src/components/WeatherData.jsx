import React, { useState, useEffect } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { WiDaySunny, WiRain, WiSnow, WiCloudy, WiThunderstorm } from "react-icons/wi";
import { FaLocationArrow, FaTemperatureHigh, FaWater, FaWind } from "react-icons/fa";

const WeatherData = () => {
    const [coords, setCoords] = useState(null);
    const [data, setData] = useState({
        currentWeather: null,
        forecast: null,
        airPollution: null,
        uvi: null
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [geminiResponse, setGeminiResponse] = useState(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [locationDenied, setLocationDenied] = useState(false);

    const API_KEY = import.meta.env.VITE_APP_ID;
    const GEMINI_API_KEY = "AIzaSyCGaiXt_OsH8HD1D-H_P25dBMm9QBp0UgY";

    useEffect(() => {
        const getLocation = () => {
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        setCoords({
                            lat: position.coords.latitude,
                            lon: position.coords.longitude
                        });
                        setLocationDenied(false);
                    },
                    (err) => {
                        console.error("Geolocation error:", err);
                        setLocationDenied(true);
                        setError("Location access denied. Using default location (New York).");
                        setCoords({ lat: 40.7128, lon: -74.0060 });
                    }
                );
            } else {
                setError("Geolocation is not supported by your browser. Using default location.");
                setCoords({ lat: 40.7128, lon: -74.0060 });
            }
        };

        getLocation();
    }, []);

    useEffect(() => {
        if (!coords) return;

        const fetchWeatherData = async () => {
            setLoading(true);
            try {
                const { lat, lon } = coords;

                const endpoints = [
                    `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`,
                    `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`,
                    `https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${API_KEY}`,
                    `https://api.openweathermap.org/data/2.5/uvi?lat=${lat}&lon=${lon}&appid=${API_KEY}`
                ];

                const responses = await Promise.all(
                    endpoints.map(url => fetch(url).then(res => res.json()))
                );

                if (responses.some(res => res.cod && res.cod >= 400)) {
                    throw new Error("Weather API error. Please check your API key.");
                }

                setData({
                    currentWeather: responses[0],
                    forecast: responses[1],
                    airPollution: responses[2],
                    uvi: responses[3]
                });
                setError(null);
            } catch (err) {
                console.error("Fetch error:", err);
                setError(err.message || "Failed to fetch weather data.");
            } finally {
                setLoading(false);
            }
        };

        fetchWeatherData();
    }, [coords, API_KEY]);

    const generatePrompt = () => {
        const { currentWeather, airPollution, uvi } = data;
        const airComponents = airPollution?.list[0]?.components || {};

        return `
        Act as an expert meteorologist, environmental scientist, and travel consultant. Analyze the following real-time weather and environmental data:

        ### Weather Data:
        - Location: ${currentWeather?.name}, ${currentWeather?.sys?.country}
        - Temperature: ${currentWeather?.main?.temp}°C
        - Feels Like: ${currentWeather?.main?.feels_like}°C
        - Humidity: ${currentWeather?.main?.humidity}%
        - Condition: ${currentWeather?.weather[0]?.description}
        - Wind Speed: ${currentWeather?.wind?.speed} m/s
        - UV Index: ${uvi?.value}

        ### Air Quality Data:
        - CO: ${airComponents.co} µg/m³
        - NO2: ${airComponents.no2} µg/m³
        - O3: ${airComponents.o3} µg/m³
        - SO2: ${airComponents.so2} µg/m³
        - PM2.5: ${airComponents.pm2_5} µg/m³
        - PM10: ${airComponents.pm10} µg/m³

        ### Tasks:
        1. Provide a detailed analysis of the current weather and its impact on daily activities.
        2. Assess the air quality and suggest health precautions.
        3. Recommend travel and outdoor activity plans based on the weather and air quality.
        4. Provide eco-friendly tips to reduce environmental impact.
        5. Suggest unique experiences or activities that align with the current conditions.

        Ensure the response is detailed, actionable, and tailored to the provided data.
        `;
    };

    const generateInsights = async () => {
        if (!data.currentWeather) {
            toast.error("Weather data not available yet. Please wait.");
            return;
        }

        setIsGenerating(true);
        toast.info("Generating insights. Please wait...");

        try {
            const response = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        contents: [{
                            parts: [{ text: generatePrompt() }]
                        }]
                    }),
                }
            );

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error?.message || `API failed with status ${response.status}`);
            }

            const result = await response.json();
            const insights = result.candidates?.[0]?.content?.parts?.[0]?.text || "No insights generated.";
            setGeminiResponse(insights);
            toast.success("Insights generated successfully!");
        } catch (error) {
            console.error("API Error:", error);
            toast.error(`Failed to generate insights: ${error.message}`);
        } finally {
            setIsGenerating(false);
        }
    };

    const getWeatherIcon = (condition) => {
        switch (condition?.toLowerCase()) {
            case 'clear': return <WiDaySunny className="text-yellow-400 text-4xl" />;
            case 'rain': return <WiRain className="text-blue-400 text-4xl" />;
            case 'snow': return <WiSnow className="text-gray-200 text-4xl" />;
            case 'clouds': return <WiCloudy className="text-gray-400 text-4xl" />;
            case 'thunderstorm': return <WiThunderstorm className="text-purple-500 text-4xl" />;
            default: return <WiDaySunny className="text-yellow-300 text-4xl" />;
        }
    };

    if (loading) return (
        <div className="flex justify-center items-center h-screen">
            <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-500"></div>
        </div>
    );

    if (error) return (
        <div className="max-w-5xl mx-auto p-6">
            <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4" role="alert">
                <p className="font-bold">Error</p>
                <p>{error}</p>
                {locationDenied && (
                    <button 
                        onClick={() => window.location.reload()}
                        className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                    >
                        Retry Location Access
                    </button>
                )}
            </div>
        </div>
    );

    const airComponents = data.airPollution?.list[0]?.components || {};
    const airData = [
        { name: 'CO', value: airComponents.co },
        { name: 'NO2', value: airComponents.no2 },
        { name: 'O3', value: airComponents.o3 },
        { name: 'SO2', value: airComponents.so2 },
        { name: 'PM2.5', value: airComponents.pm2_5 },
        { name: 'PM10', value: airComponents.pm10 }
    ].filter(item => item.value !== undefined);

    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

    return (
        <div className="max-w-6xl mx-auto p-4 md:p-6 grid grid-cols-1 md:grid-cols-2 gap-6 my-10">
            {/* Banner Section */}
            <div className="col-span-1 md:col-span-2 bg-gradient-to-r from-blue-800 to-purple-800 text-white rounded-xl shadow-lg flex flex-col md:flex-row items-center overflow-hidden">
                <div className="w-full md:w-1/2 h-64 md:h-80 bg-cover bg-center relative">
                    <img 
                        src="https://images.unsplash.com/photo-1561484930-974554019ade?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80" 
                        alt="Weather Banner" 
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black opacity-40"></div>
                </div>

                <div className="w-full md:w-1/2 p-6 md:p-8 text-center md:text-left space-y-4 relative z-10">
                    <h1 className="text-3xl lg:text-4xl font-bold text-white">
                        AI-Powered Weather Insights
                    </h1>
                    <p className="text-lg text-blue-100">
                        Get personalized weather analysis, travel recommendations, and eco-friendly tips!
                    </p>
                    <button
                        className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 transition-all rounded-lg shadow-lg font-semibold text-white"
                        onClick={generateInsights}
                        disabled={isGenerating || !data.currentWeather}
                    >
                        {isGenerating ? (
                            <span className="flex items-center justify-center">
                                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Generating...
                            </span>
                        ) : "Generate Insights"}
                    </button>
                </div>
            </div>

            {/* Gemini API Response */}
            {geminiResponse && (
                <div className="col-span-1 md:col-span-2 bg-white p-6 rounded-xl shadow-lg border border-gray-200">
                    <h3 className="text-xl font-bold mb-4 text-gray-800">📝 AI-Generated Insights</h3>
                    <div className="prose max-w-none text-gray-700 whitespace-pre-line">
                        {geminiResponse}
                    </div>
                </div>
            )}

            {/* Current Weather - Gradient Card */}
            <div className="bg-gradient-to-br from-blue-500 to-purple-600 text-white p-6 rounded-xl shadow-lg">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold">Current Weather</h3>
                    {getWeatherIcon(data.currentWeather?.weather[0]?.main)}
                </div>
                <div className="space-y-3">
                    <div className="flex items-center">
                        <FaLocationArrow className="text-blue-200 mr-2" />
                        <span className="font-medium">Location: </span>
                        <span className="ml-2">{data.currentWeather?.name}, {data.currentWeather?.sys?.country}</span>
                    </div>
                    <div className="flex items-center">
                        <FaTemperatureHigh className="text-red-200 mr-2" />
                        <span className="font-medium">Temperature: </span>
                        <span className="ml-2">{data.currentWeather?.main?.temp}°C (Feels like {data.currentWeather?.main?.feels_like}°C)</span>
                    </div>
                    <div className="flex items-center">
                        <FaWater className="text-blue-200 mr-2" />
                        <span className="font-medium">Humidity: </span>
                        <span className="ml-2">{data.currentWeather?.main?.humidity}%</span>
                    </div>
                    <div className="flex items-center">
                        <FaWind className="text-gray-200 mr-2" />
                        <span className="font-medium">Wind: </span>
                        <span className="ml-2">{data.currentWeather?.wind?.speed} m/s</span>
                    </div>
                    <div className="pt-2">
                        <span className="font-medium">Conditions: </span>
                        <span className="capitalize">{data.currentWeather?.weather[0]?.description}</span>
                    </div>
                </div>
            </div>

            {/* UV Index - Gradient Card */}
            <div className="bg-gradient-to-br from-orange-500 to-pink-600 text-white p-6 rounded-xl shadow-lg">
                <h3 className="text-xl font-bold mb-4">☀ UV Index</h3>
                <div className="flex flex-col items-center justify-center h-full">
                    <div className={`text-5xl font-bold mb-2 ${
                        data.uvi?.value < 3 ? 'text-green-200' : 
                        data.uvi?.value < 6 ? 'text-yellow-200' : 
                        data.uvi?.value < 8 ? 'text-orange-200' : 
                        'text-red-200'
                    }`}>
                        {data.uvi?.value || 'N/A'}
                    </div>
                    <p className="text-center text-white">
                        {data.uvi?.value < 3 ? 'Low' : 
                         data.uvi?.value < 6 ? 'Moderate' : 
                         data.uvi?.value < 8 ? 'High' : 
                         'Very High'} risk
                    </p>
                </div>
            </div>

            {/* Air Quality - Gradient Card with Fixed Pie Chart */}
            <div className="col-span-1 md:col-span-2 bg-gradient-to-br from-green-600 to-teal-700 text-white p-6 rounded-xl shadow-lg">
                <h3 className="text-xl font-bold mb-4">📊 Air Quality Index</h3>
                <div className="flex flex-col md:flex-row items-center">
                    <div className="w-full md:w-1/2 h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={airData}
                                    cx="50%"
                                    cy="50%"
                                    outerRadius={80}
                                    dataKey="value"
                                    label={({ name, value }) => `${name}: ${value.toFixed(1)}`}
                                    labelLine={false}
                                >
                                    {airData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip 
                                    formatter={(value) => [`${value.toFixed(1)} µg/m³`, 'Value']}
                                    contentStyle={{
                                        background: 'rgba(0, 0, 0, 0.8)',
                                        border: 'none',
                                        borderRadius: '8px',
                                        color: 'white'
                                    }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="w-full md:w-1/2 mt-4 md:mt-0 md:pl-6">
                        <div className="grid grid-cols-2 gap-2">
                            {airData.map((item, index) => (
                                <div key={index} className="bg-white bg-opacity-20 p-2 rounded-lg">
                                    <p className="font-semibold">{item.name}</p>
                                    <p>{item.value.toFixed(1)} µg/m³</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* 5-Day Forecast - Gradient Cards */}
            <div className="col-span-1 md:col-span-2">
                <h3 className="text-xl font-bold mb-4 text-gray-800">5-Day Forecast</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                    {data.forecast?.list?.filter((_, index) => index % 8 === 0).slice(0, 5).map((item, index) => {
                        const gradientColors = [
                            'from-blue-400 to-blue-600',
                            'from-purple-400 to-purple-600',
                            'from-pink-400 to-pink-600',
                            'from-indigo-400 to-indigo-600',
                            'from-teal-400 to-teal-600'
                        ];
                        return (
                            <div 
                                key={index} 
                                className={`bg-gradient-to-br ${gradientColors[index]} text-white p-4 rounded-lg shadow-md hover:shadow-lg transition-shadow`}
                            >
                                <p className="font-bold text-center">
                                    {new Date(item.dt * 1000).toLocaleDateString('en-US', { weekday: 'short' })}
                                </p>
                                <div className="flex justify-center my-2">
                                    {getWeatherIcon(item.weather[0]?.main)}
                                </div>
                                <div className="text-center space-y-1">
                                    <p className="text-lg font-semibold">{Math.round(item.main.temp)}°C</p>
                                    <p className="text-sm text-white text-opacity-80 capitalize">{item.weather[0]?.description}</p>
                                    <p className="text-sm">Humidity: {item.main.humidity}%</p>
                                    <p className="text-sm">Wind: {item.wind.speed} m/s</p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Toast Container */}
            <ToastContainer 
                position="bottom-right" 
                autoClose={3000}
                hideProgressBar={false}
                newestOnTop={false}
                closeOnClick
                rtl={false}
                pauseOnFocusLoss
                draggable
                pauseOnHover
            />
        </div>
    );
};

export default WeatherData;