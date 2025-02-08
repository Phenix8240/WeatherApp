import { useState, useEffect } from "react";
import { WiDaySunny, WiRain, WiSnow, WiThunderstorm, WiCloudy } from "react-icons/wi"; // Weather icons
import { FaBusinessTime, FaPlane, FaSeedling, FaUtensils } from "react-icons/fa"; // Business, Travel, Agriculture, Food icons

const Insights = () => {
    const [weather, setWeather] = useState(null);
    const [businessInsights, setBusinessInsights] = useState([]);
    const [travelInsights, setTravelInsights] = useState([]);
    const API_KEY = "AIzaSyCGaiXt_OsH8HD1D-H_P25dBMm9QBp0UgY"; // Replace with your Gemini API key

    useEffect(() => {
        getUserLocation();
    }, []);

    // 📌 Fetch user location
    const getUserLocation = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const { latitude, longitude } = position.coords;
                    console.log("User location:", latitude, longitude);
                    fetchWeather(latitude, longitude);
                },
                (error) => console.error("❌ Error getting location:", error)
            );
        } else {
            console.error("❌ Geolocation is not supported by this browser.");
        }
    };

    // 📌 Fetch weather data using OpenWeatherMap API
    const fetchWeather = async (lat, lon) => {
        try {
            console.log("🌍 Fetching weather for:", lat, lon);

            const response = await fetch(
                `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${import.meta.env.VITE_APP_ID}`
            );

            if (!response.ok) {
                throw new Error(`🌩️ Weather API failed with status ${response.status}`);
            }

            const data = await response.json();
            console.log("✅ Weather Data:", data);

            setWeather(data);
            generateInsights(data); // 🔹 Call insights function after getting weather
        } catch (error) {
            console.error("❌ Error fetching weather:", error);
        }
    };

    // 📌 Generate insights using Gemini API
    const generateInsights = async (weatherData) => {
        console.log("📝 Generating insights for weather:", weatherData);

        const prompt = `Act as an expert business analyst, economic strategist, Framer, Food reconmmander, Nutritionnist ,traveller and travel consultant. Analyze the following real-time weather data:  
${JSON.stringify(weatherData, null, 2)}.  

  

### Travel Insights:   
   - Assess how the current weather conditions affect transportation, tourism, and outdoor activities**.  
   - Recommend three several same or differnt locations within the country that are ideal for a two-day trip based on the weather.  
     - For each location:  
       - Suggest top tourist attractions that align with the weather (e.g., indoor museums for rainy days, beaches for sunny weather).  
       - Provide customized travel itineraries, including ideal activities for different traveler types (e.g., solo travelers, families, adventure seekers).  
       - Include local seasonal specialties (e.g., must-try foods, cultural events, festivals).  
   - Offer realistic budgeting tips for each location, considering factors like transportation costs, accommodation pricing, and local expenses. 

   - Provide **safety tips**, including:  
     - Health precautions for extreme temperatures (e.g., hydration strategies for heatwaves, layering tips for cold weather).  
     - Best times for safe travel (avoiding storms, floods, road closures).  
     - Emergency contacts or services to be aware of.  
   - Suggest **eco-friendly travel tips**, ensuring responsible tourism with minimal environmental impact.  
   - Include **packing recommendations** based on the weather (e.g., rain gear, sunscreen, warm clothing).  
   - Provide **transportation options** for each location (e.g., public transport, car rentals, flights).  
   - Highlight **local accommodations** that are highly rated and suitable for the weather conditions.  
   - Suggest **unique experiences** that travelers can enjoy based on the weather (e.g., hot springs in cold weather, water sports in warm weather).  



Ensure all insights are **realistic, location-specific, data-driven, and actionable** to provide practical value for businesses and travelers alike.`;

        try {
            console.log("🔄 Sending request to Gemini API...");

            const response = await fetch(
                `https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=${API_KEY}`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        contents: [
                            {
                                parts: [
                                    {
                                        text: prompt,
                                    },
                                ],
                            },
                        ],
                    }),
                }
            );

            if (!response.ok) {
                throw new Error(`🚨 Gemini API failed with status ${response.status}`);
            }

            const result = await response.json();
            console.log("📩 Gemini API Response:", result);

            // ✅ Ensure valid API response
            if (!result.candidates || result.candidates.length === 0) {
                throw new Error("❌ Invalid API response structure");
            }

            // 📌 Process and split insights
            const insights = result.candidates[0]?.content?.parts[0]?.text?.split("\n\n") || [];

            // setBusinessInsights(insights.slice(0, insights.length ));
            setTravelInsights(insights);
        } catch (error) {
            console.error("❌ Error generating insights:", error);
        }
    };

    const formatInsights = (text) => {
        return text
            .replace(/\*\*(.*?)\*\*/g, (_, match) => `<strong>${match}</strong>`) // Make text bold
            .replace(/^- /gm, "")
            .replace(/\s*\*\s*/g, ' ')   // Remove dashes at the beginning of lines
            .replace(/^• /gm, " "); // Remove bullets if already converted
    };




    return (
        <div className="p-6 w-auto mx-auto bg-gray-100 text-violet-900 rounded-xl shadow-lg space-y-6 flex flex-col items-center mt-10 ">
            {/* 📌 Weather Display */}
            {weather && (
                <>
                    <div className="text-center m-6">
                        <h2 className="text-2xl font-bold">🌤️ Weather Insights</h2>
                        <p className="text-lg">{weather.name}, {weather.sys.country}</p>
                        <p className="text-xl font-semibold">{weather.main.temp}°C</p>
                        <div className="flex justify-center items-center space-x-2 text-4xl mt-2">
                            {weather.weather[0].main === "Clear" && <WiDaySunny className="text-yellow-400" />}
                            {weather.weather[0].main === "Rain" && <WiRain className="text-blue-400" />}
                            {weather.weather[0].main === "Snow" && <WiSnow className="text-gray-400" />}
                            {weather.weather[0].main === "Thunderstorm" && <WiThunderstorm className="text-purple-500" />}
                            {weather.weather[0].main === "Clouds" && <WiCloudy className="text-gray-500" />}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-4">
                        {/* Temperature */}
                        <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-6 rounded-lg shadow-lg">
                            <h3 className="text-lg font-semibold">🌡️ Temperature</h3>
                            <p className="text-2xl font-bold">{weather.main.temp}°C</p>
                            <p className="text-sm">Feels Like: {weather.main.feels_like}°C</p>
                        </div>

                        {/* Humidity & Pressure */}
                        <div className="bg-gradient-to-r from-green-400 to-blue-500 text-white p-6 rounded-lg shadow-lg">
                            <h3 className="text-lg font-semibold">💧 Humidity & Pressure</h3>
                            <p className="text-xl">{weather.main.humidity}%</p>
                            <p className="text-sm">Pressure: {weather.main.pressure} hPa</p>
                        </div>

                        {/* Wind Speed */}
                        <div className="bg-gradient-to-r from-yellow-400 to-red-500 text-white p-6 rounded-lg shadow-lg">
                            <h3 className="text-lg font-semibold">🌬️ Wind</h3>
                            <p className="text-xl">{weather.wind.speed} m/s</p>
                            <p className="text-sm">Gusts: {weather.wind.gust} m/s</p>
                        </div>

                        {/* Sunrise & Sunset */}
                        <div className="bg-gradient-to-r from-indigo-500 to-pink-500 text-white p-6 rounded-lg shadow-lg">
                            <h3 className="text-lg font-semibold">🌅 Sunrise & Sunset</h3>
                            <p className="text-md">Sunrise: {new Date(weather.sys.sunrise * 1000).toLocaleTimeString()}</p>
                            <p className="text-md">Sunset: {new Date(weather.sys.sunset * 1000).toLocaleTimeString()}</p>
                        </div>

                        {/* Visibility */}
                        <div className="bg-gradient-to-r from-gray-600 to-black text-white p-6 rounded-lg shadow-lg">
                            <h3 className="text-lg font-semibold">👁️ Visibility</h3>
                            <p className="text-xl">{weather.visibility / 1000} km</p>
                        </div>
                    </div>
                </>


            )}






            <div className="relative w-full h-[80vh] flex flex-col lg:flex-row items-center justify-center bg-gray-900 text-white rounded-lg">
                {/* Left Side - Background Image */}
                <div className="relative w-full lg:w-1/2 h-full bg-cover bg-center rounded-lg"
                    style={{
                        backgroundImage: "url('https://media.cntraveler.com/photos/5e260c21f19e560008df5148/master/pass/New-Zealand-adventure-GettyImages-585144798.jpg')",
                    }}>
                    <div className="absolute inset-0 bg-black opacity-50"></div>
                </div>

                {/* Right Side - Text Content */}
                <div className="w-full lg:w-1/2 p-8 lg:p-12 text-center lg:text-left space-y-6">
                    <h1 className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-blue-400 via-purple-500 to-yellow-400 text-transparent bg-clip-text">
                        AI-Enabled Weather-Based Travel Suggestions
                    </h1>
                    <p className="text-xl font-semibold ">
                        🌍 Plan smarter with <span className="">AI-powered weather insights!</span>
                    </p>
                    <p className="text-lg ">
                        ☀️🌧️ Get personalized travel & lifestyle tips— sunny adventures or cozy rainy retreats!
                    </p>
                    <p className="text-md font-medium">
                        🌟 Plan smarter. Experience more. Start your journey today! ✈️🌎
                    </p>

                    <button className="px-6 py-3 mt-4 bg-gradient-to-r from-purple-500 to-pink-500 hover:scale-105 transition transform rounded-lg shadow-lg font-semibold">
                        Explore Now
                    </button>
                </div>
            </div>


            {/* 📌 Travel Insights */}
            <div className="bg-gray-900 text-white max-w-5xl p-4 rounded-lg  font-serif">
                <h2 className="text text-2xl  font-bold flex items-center">
                    ✈️Travel Insights
                </h2>
                <ul className="list-disc text-xl list-inside ">
                    {travelInsights.map((insight, index) => (
                        <li key={index} className="mt-2" dangerouslySetInnerHTML={{ __html: formatInsights(insight) }} />
                    ))}
                </ul>
            </div>


        </div>
    );
};

export default Insights;