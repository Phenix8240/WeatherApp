import { useState, useEffect } from "react";
import { WiDaySunny, WiRain, WiSnow, WiThunderstorm, WiCloudy } from "react-icons/wi";
import { FaPlane } from "react-icons/fa";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const Insights = () => {
    const [weather, setWeather] = useState(null);
    const [travelInsights, setTravelInsights] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [locationDenied, setLocationDenied] = useState(false);
    const API_KEY = "AIzaSyCGaiXt_OsH8HD1D-H_P25dBMm9QBp0UgY"; // Debug: API key visible
    const WEATHER_API_KEY = import.meta.env.VITE_APP_ID;

    useEffect(() => {
        console.debug("Component mounted - requesting location");
        requestLocationPermission();
    }, []);

    const requestLocationPermission = () => {
        console.debug("Attempting to get location permission");
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const { latitude, longitude } = position.coords;
                    console.debug("Location obtained:", latitude, longitude);
                    fetchWeather(latitude, longitude);
                    setLocationDenied(false);
                },
                (error) => {
                    console.error("Location error:", error);
                    setLocationDenied(true);
                    toast.error("Location access denied. Using default location (New York).");
                    console.debug("Falling back to default location");
                    fetchWeather(40.7128, -74.0060); // New York fallback
                },
                { timeout: 10000 } // 10 second timeout
            );
        } else {
            console.error("Geolocation not supported");
            toast.error("Geolocation not supported. Using default location.");
            fetchWeather(40.7128, -74.0060); // New York fallback
        }
    };

    const fetchWeather = async (lat, lon) => {
        console.debug(`Fetching weather for coordinates: ${lat}, ${lon}`);
        try {
            setIsLoading(true);
            const response = await fetch(
                `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${WEATHER_API_KEY}`
            );

            console.debug("Weather API response status:", response.status);
            
            if (!response.ok) {
                throw new Error(`Weather API failed with status ${response.status}`);
            }

            const data = await response.json();
            console.debug("Weather data received:", data);
            setWeather(data);
        } catch (error) {
            console.error("Weather fetch error:", error);
            toast.error("Failed to fetch weather data. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    const generateInsights = async (weatherData) => {
        console.debug("Generating insights with weather data:", weatherData);
        if (!weatherData) {
            console.error("No weather data available");
            toast.error("Weather data not available. Please try again.");
            return;
        }

        setIsLoading(true);
        toast.info("Generating travel insights. Please wait...");

        const prompt = `Act as an expert travel consultant. Analyze this weather data:
${JSON.stringify({
    location: `${weatherData.name}, ${weatherData.sys?.country}`,
    temp: `${weatherData.main?.temp}°C`,
    feelsLike: `${weatherData.main?.feels_like}°C`,
    humidity: `${weatherData.main?.humidity}%`,
    conditions: weatherData.weather?.[0]?.description,
    wind: `${weatherData.wind?.speed} m/s`
}, null, 2)}

Provide specific travel recommendations including:
- 3 ideal destinations matching current weather
- Activity suggestions for each
- Packing recommendations
- Safety tips
- Budget estimates`;

        try {
            console.debug("Sending request to Gemini API");
            const response = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        contents: [{
                            parts: [{ text: prompt }]
                        }]
                    }),
                }
            );

            console.debug("Gemini API response status:", response.status);
            
            if (!response.ok) {
                const errorData = await response.json();
                console.error("Gemini API error:", errorData);
                throw new Error(errorData.error?.message || `API failed with status ${response.status}`);
            }

            const result = await response.json();
            console.debug("Gemini API full response:", result);

            if (!result.candidates || result.candidates.length === 0) {
                throw new Error("Invalid API response structure");
            }

            const textResponse = result.candidates[0]?.content?.parts[0]?.text;
            console.debug("Gemini text response:", textResponse);
            
            const insights = textResponse?.split("\n\n").filter(Boolean) || [];
            setTravelInsights(insights);
            toast.success("Travel insights generated!");
        } catch (error) {
            console.error("Insights generation error:", error);
            toast.error(`Failed to generate insights: ${error.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    const formatInsights = (text) => {
        if (!text) return "";
        console.debug("Formatting insight text:", text);
        return text
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/^-\s*/gm, "")
            .replace(/^\*\s*/gm, "")
            .replace(/^•\s*/gm, "");
    };

    const getWeatherIcon = (condition) => {
        console.debug("Getting icon for condition:", condition);
        switch (condition?.toLowerCase()) {
            case 'clear': return <WiDaySunny className="text-yellow-400" />;
            case 'rain': return <WiRain className="text-blue-400" />;
            case 'snow': return <WiSnow className="text-gray-400" />;
            case 'thunderstorm': return <WiThunderstorm className="text-purple-500" />;
            case 'clouds': return <WiCloudy className="text-gray-500" />;
            default: return <WiDaySunny className="text-yellow-300" />;
        }
    };

    return (
        <div className="p-6 w-auto mx-auto bg-gray-100 text-violet-900 rounded-xl shadow-lg space-y-6 flex flex-col items-center mt-10">
            {/* Debug info panel */}
            
            {/* Weather Display */}
            {weather && (
                <>
                    <div className="text-center m-6">
                        <h2 className="text-2xl font-bold">🌤️ Weather Insights</h2>
                        <p className="text-lg">{weather.name}, {weather.sys?.country}</p>
                        <p className="text-xl font-semibold">{weather.main?.temp}°C</p>
                        <div className="flex justify-center items-center space-x-2 text-4xl mt-2">
                            {getWeatherIcon(weather.weather?.[0]?.main)}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-4">
                        {/* Weather cards with fallbacks */}
                        {[
                            { 
                                title: "🌡️ Temperature", 
                                value: `${weather.main?.temp}°C`, 
                                sub: `Feels Like: ${weather.main?.feels_like}°C`,
                                colors: "from-blue-500 to-purple-600"
                            },
                            { 
                                title: "💧 Humidity & Pressure", 
                                value: `${weather.main?.humidity}%`, 
                                sub: `Pressure: ${weather.main?.pressure} hPa`,
                                colors: "from-green-400 to-blue-500"
                            },
                            { 
                                title: "🌬️ Wind", 
                                value: `${weather.wind?.speed} m/s`, 
                                sub: `Gusts: ${weather.wind?.gust || 'N/A'} m/s`,
                                colors: "from-yellow-400 to-red-500"
                            },
                            { 
                                title: "🌅 Sunrise & Sunset", 
                                value: weather.sys?.sunrise ? new Date(weather.sys.sunrise * 1000).toLocaleTimeString() : 'N/A', 
                                sub: `Sunset: ${weather.sys?.sunset ? new Date(weather.sys.sunset * 1000).toLocaleTimeString() : 'N/A'}`,
                                colors: "from-indigo-500 to-pink-500"
                            },
                            { 
                                title: "👁️ Visibility", 
                                value: weather.visibility ? `${(weather.visibility / 1000).toFixed(1)} km` : 'N/A',
                                sub: '',
                                colors: "from-gray-600 to-black"
                            }
                        ].map((card, index) => (
                            <div key={index} className={`bg-gradient-to-r ${card.colors} text-white p-6 rounded-lg shadow-lg`}>
                                <h3 className="text-lg font-semibold">{card.title}</h3>
                                <p className="text-2xl font-bold">{card.value}</p>
                                {card.sub && <p className="text-sm">{card.sub}</p>}
                            </div>
                        ))}
                    </div>
                </>
            )}

            {/* Explore Now Section */}
            <div className="relative w-full h-[80vh] flex flex-col lg:flex-row items-center justify-center bg-gray-900 text-white rounded-xl">
                <div className="relative w-full lg:w-1/2 h-full bg-cover bg-center rounded-lg"
                    style={{
                        backgroundImage: "url('https://media.cntraveler.com/photos/5e260c21f19e560008df5148/master/pass/New-Zealand-adventure-GettyImages-585144798.jpg')",
                    }}>
                    <div className="absolute inset-0 bg-black opacity-50"></div>
                </div>

                <div className="w-full lg:w-1/2 p-8 lg:p-12 text-center lg:text-left space-y-6">
                    <h1 className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-blue-400 via-purple-500 to-yellow-400 text-transparent bg-clip-text">
                        AI-Enabled Weather-Based Travel Suggestions
                    </h1>
                    <button
                        className="px-6 py-3 mt-4 bg-gradient-to-r from-purple-500 to-pink-500 hover:scale-105 transition transform rounded-lg shadow-lg font-semibold"
                        onClick={() => generateInsights(weather)}
                        disabled={isLoading || !weather}
                    >
                        {isLoading ? (
                            <span className="flex items-center justify-center">
                                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Generating...
                            </span>
                        ) : "Explore Now"}
                    </button>
                </div>
            </div>

            {/* Travel Insights */}
            {travelInsights.length > 0 && (
                <div className="bg-gray-900 text-white max-w-5xl p-4 rounded-lg font-serif">
                    <h2 className="text-2xl font-bold flex items-center">
                        <FaPlane className="mr-2" /> Travel Insights
                    </h2>
                    <ul className="list-disc text-xl list-inside">
                        {travelInsights.map((insight, index) => (
                            <li key={index} className="mt-2" dangerouslySetInnerHTML={{ __html: formatInsights(insight) }} />
                        ))}
                    </ul>
                </div>
            )}

            <ToastContainer position="bottom-right" autoClose={3000} />
        </div>
    );
};

export default Insights;