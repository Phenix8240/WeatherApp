import { useState, useEffect } from "react";
import {
    WiDaySunny,
    WiRain,
    WiSnow,
    WiThunderstorm,
    WiCloudy,
} from "react-icons/wi";
import { FaPlane } from "react-icons/fa";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const Insights = () => {
    const [weather, setWeather] = useState(null);
    const [travelInsights, setTravelInsights] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    // Gemini model discovery
    const [availableModel, setAvailableModel] = useState(null);
    const [modelStatus, setModelStatus] = useState("Checking API...");

    const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
    const WEATHER_API_KEY = import.meta.env.VITE_APP_ID;

    useEffect(() => {
        requestLocationPermission();
        findWorkingModel();
    }, []);

    // ----------------------------------------------------------
    // 🔍 STEP 1 — DISCOVER MODELS
    // ----------------------------------------------------------
    const findWorkingModel = async () => {
        try {
            const response = await fetch(
                "https://generativelanguage.googleapis.com/v1beta/models",
                {
                    headers: { "x-goog-api-key": API_KEY },
                }
            );

            if (!response.ok) {
                setModelStatus("API Key Error / Quota Reached");
                return;
            }

            const data = await response.json();
            const usable = (data.models || []).filter((m) =>
                m.supportedGenerationMethods?.includes("generateContent")
            );

            let best =
                usable.find((m) => m.name.includes("gemini-3-pro")) ||
                usable.find((m) => m.name.includes("gemini-2.0-pro")) ||
                usable.find((m) => m.name.includes("gemini-2.0-flash")) ||
                usable[0];

            if (best) {
                setAvailableModel(best.name);
                setModelStatus(`Ready (${best.displayName || best.name})`);
            } else setModelStatus("No usable models");
        } catch (e) {
            setModelStatus("Network Error");
        }
    };

    // ----------------------------------------------------------
    // 🌍 WEATHER SECTION
    // ----------------------------------------------------------
    const requestLocationPermission = () => {
        if (!navigator.geolocation) {
            toast.error("Geolocation not supported");
            return fetchWeather(40.7128, -74.0060);
        }

        navigator.geolocation.getCurrentPosition(
            (pos) =>
                fetchWeather(pos.coords.latitude, pos.coords.longitude),
            () => {
                toast.error("Location denied — Using New York");
                fetchWeather(40.7128, -74.0060);
            }
        );
    };

    const fetchWeather = async (lat, lon) => {
        try {
            setIsLoading(true);
            const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${WEATHER_API_KEY}`;
            const res = await fetch(url);

            if (!res.ok) throw new Error("Weather error");

            setWeather(await res.json());
        } catch (err) {
            toast.error("Weather fetch failed");
        } finally {
            setIsLoading(false);
        }
    };

    // ----------------------------------------------------------
    // 🤖 AI INSIGHTS — FIXED API
    // ----------------------------------------------------------
    const generateInsights = async (weatherData) => {
        if (!availableModel) {
            toast.error("No working model available");
            return findWorkingModel();
        }

        setIsLoading(true);

        const prompt = `
Act as a travel expert. Analyze:
${JSON.stringify(
    {
        location: `${weatherData.name}, ${weatherData.sys.country}`,
        temp: `${weatherData.main.temp}°C`,
        conditions: weatherData.weather[0].description,
        wind: `${weatherData.wind.speed} m/s`,
    },
    null,
    2
)}

Return:
• 3 destinations  
• Activities  
• Packing list  
• Budget  
        `;

        try {
            const res = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/${availableModel}:generateContent`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "x-goog-api-key": API_KEY,
                    },
                    body: JSON.stringify({
                        contents: [{ parts: [{ text: prompt }] }],
                    }),
                }
            );

            const result = await res.json();

            if (!res.ok) throw new Error(result.error?.message);

            const text =
                result.candidates?.[0]?.content?.parts?.[0]?.text || "";

            setTravelInsights(text.split(/\n\n+/).filter(Boolean));
            toast.success("Insights Ready!");
        } catch (err) {
            toast.error(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const formatInsights = (t) =>
        t.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");

    // ----------------------------------------------------------
    // UI HELPERS
    // ----------------------------------------------------------
    const getWeatherIcon = (condition) => {
        switch (condition?.toLowerCase()) {
            case "clear":
                return <WiDaySunny className="text-yellow-400" />;
            case "rain":
                return <WiRain className="text-blue-400" />;
            case "snow":
                return <WiSnow className="text-gray-400" />;
            case "thunderstorm":
                return <WiThunderstorm className="text-purple-500" />;
            case "clouds":
                return <WiCloudy className="text-gray-400" />;
            default:
                return <WiDaySunny className="text-yellow-300" />;
        }
    };

    // ----------------------------------------------------------
    // UI SECTION
    // ----------------------------------------------------------
    return (
        <div className="p-6 max-w-6xl mx-auto bg-gray-100 text-violet-900 rounded-xl shadow-lg space-y-6 flex flex-col items-center mt-10">

            {/* AI STATUS */}
            <div className="text-sm bg-gray-200 px-4 py-2 rounded-lg shadow">
                <b>AI Model:</b> {modelStatus}
            </div>

            {/* WEATHER CARDS */}
            {weather && (
                <>
                    <div className="text-center m-6">
                        <h2 className="text-2xl font-bold">🌤️ Weather Insights</h2>
                        <p className="text-lg">
                            {weather.name}, {weather?.sys?.country}
                        </p>
                        <p className="text-xl font-semibold">
                            {weather.main?.temp}°C
                        </p>
                        <div className="flex justify-center items-center text-4xl mt-2">
                            {getWeatherIcon(weather.weather?.[0]?.main)}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-4">
                        {[
                            {
                                title: "🌡️ Temperature",
                                value: `${weather.main.temp}°C`,
                                sub: `Feels Like: ${weather.main.feels_like}°C`,
                                colors: "from-blue-500 to-purple-600",
                            },
                            {
                                title: "💧 Humidity",
                                value: `${weather.main.humidity}%`,
                                sub: `Pressure: ${weather.main.pressure} hPa`,
                                colors: "from-green-400 to-blue-500",
                            },
                            {
                                title: "🌬️ Wind",
                                value: `${weather.wind.speed} m/s`,
                                sub: `Gusts: ${weather.wind.gust || "N/A"}`,
                                colors: "from-yellow-400 to-red-500",
                            },
                        ].map((c, i) => (
                            <div
                                key={i}
                                className={`bg-gradient-to-r ${c.colors} text-white p-6 rounded-lg shadow-lg`}
                            >
                                <h3 className="text-lg font-semibold">{c.title}</h3>
                                <p className="text-2xl font-bold">{c.value}</p>
                                {c.sub && <p className="text-sm">{c.sub}</p>}
                            </div>
                        ))}
                    </div>
                </>
            )}

            {/* EXPLORE NOW SECTION */}
            <div className="relative w-full h-[80vh] flex flex-col lg:flex-row items-center bg-gray-900 text-white rounded-xl">
                <div
                    className="relative w-full lg:w-1/2 h-full bg-cover bg-center rounded-lg"
                    style={{
                        backgroundImage:
                            "url('https://media.cntraveler.com/photos/5e260c21f19e560008df5148/master/pass/New-Zealand-adventure-GettyImages-585144798.jpg')",
                    }}
                >
                    <div className="absolute inset-0 bg-black opacity-50" />
                </div>

                <div className="w-full lg:w-1/2 p-10 text-center space-y-6">
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 via-purple-500 to-yellow-400 text-transparent bg-clip-text">
                        AI-Enabled Travel Suggestions
                    </h1>

                    <button
                        className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:scale-105 transition rounded-lg shadow-lg font-semibold"
                        onClick={() => generateInsights(weather)}
                        disabled={isLoading || !weather}
                    >
                        {isLoading ? "Thinking..." : "Explore Now"}
                    </button>
                </div>
            </div>

            {/* TRAVEL INSIGHTS */}
            {travelInsights.length > 0 && (
                <div className="bg-gray-900 text-white max-w-5xl p-6 rounded-lg">
                    <h2 className="text-2xl font-bold flex items-center">
                        <FaPlane className="mr-2" /> Travel Insights
                    </h2>

                    <ul className="list-disc list-inside mt-4 space-y-3 text-lg">
                        {travelInsights.map((ins, i) => (
                            <li
                                key={i}
                                dangerouslySetInnerHTML={{ __html: formatInsights(ins) }}
                            />
                        ))}
                    </ul>
                </div>
            )}

            <ToastContainer position="bottom-right" autoClose={3000} />
        </div>
    );
};

export default Insights;
