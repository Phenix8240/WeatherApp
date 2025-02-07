import React, { useState, useEffect } from 'react';
import { saveAs } from 'file-saver'; // For exporting CSV
import jsPDF from 'jspdf'; // For exporting PDF
import { Bar } from 'react-chartjs-2'; // For graphical visualization
import L from 'leaflet'; // For interactive maps
import 'leaflet/dist/leaflet.css'; // Leaflet CSS
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';

// Register Chart.js components
ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
);

const BusinessFeatures = () => {
    const [weatherData, setWeatherData] = useState(null);
    const [reportData, setReportData] = useState(null);
    const [topCitiesWeather, setTopCitiesWeather] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [businessInsights, setBusinessInsights] = useState([]);
    const [travelInsights, setTravelInsights] = useState([]);
    const [comfortIndex, setComfortIndex] = useState([]);
    const [map, setMap] = useState(null);

    // List of top cities in India and the world
    const topCities = [
        "Mumbai", "Delhi", "Bangalore", "New York", "London", "Tokyo", "Paris", "Dubai", "Sydney", "Singapore"
    ];

    // Fetch Weather Data for Current Location
    const fetchWeatherForLocation = async (lat, lon) => {
        try {
            const response = await fetch(
                `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${import.meta.env.VITE_APP_ID}`
            );
            if (!response.ok) throw new Error("Failed to fetch weather data.");
            const data = await response.json();
            setWeatherData(data);
        } catch (error) {
            console.error("Error fetching weather data:", error);
            setError("Failed to fetch weather data. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    // Fetch Weather Data for Top Cities
    const fetchWeatherForTopCities = async () => {
        try {
            const weatherPromises = topCities.map(async (city) => {
                const response = await fetch(
                    `https://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&appid=${import.meta.env.VITE_APP_ID}`
                );
                if (!response.ok) throw new Error(`Failed to fetch data for ${city}`);
                return response.json();
            });
            const weatherData = await Promise.all(weatherPromises);
            const formattedData = weatherData.map((data) => ({
                city: data.name,
                country: data.sys.country,
                temperature: data.main.temp,
                condition: data.weather[0].main,
                humidity: data.main.humidity,
                windSpeed: data.wind.speed,
                lat: data.coord.lat,
                lon: data.coord.lon,
            }));
            setTopCitiesWeather(formattedData);
            calculateComfortIndex(formattedData);
        } catch (error) {
            console.error("Error fetching weather data for top cities:", error);
            setError("Failed to fetch weather data for top cities.");
        }
    };

    // Calculate Comfort Index for Each City
    const calculateComfortIndex = (citiesData) => {
        const comfortData = citiesData.map((city) => {
            const { temperature, humidity, windSpeed } = city;
            // Comfort index formula (can be customized)
            const index = (100 - Math.abs(22 - temperature)) * 0.6 + (100 - humidity) * 0.3 + (100 - windSpeed) * 0.1;
            return { ...city, comfortIndex: Math.round(index) };
        });
        setComfortIndex(comfortData);
    };

    // Get User's Current Location
    useEffect(() => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const { latitude, longitude } = position.coords;
                    fetchWeatherForLocation(latitude, longitude);
                },
                (error) => {
                    console.error("Error fetching location:", error);
                    setError("Failed to fetch your location. Please enable location access.");
                }
            );
        } else {
            setError("Geolocation is not supported by this browser.");
        }
    }, []);

    // Fetch Weather for Top Cities on Component Mount
    useEffect(() => {
        fetchWeatherForTopCities();
    }, []);

    // Initialize Map
    useEffect(() => {
        if (topCitiesWeather.length > 0 && !map) {
            const leafletMap = L.map('map').setView([20, 0], 2);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap contributors',
            }).addTo(leafletMap);

            topCitiesWeather.forEach((city) => {
                L.marker([city.lat, city.lon])
                    .addTo(leafletMap)
                    .bindPopup(`<b>${city.city}</b><br>Temp: ${city.temperature}°C<br>Condition: ${city.condition}`);
            });

            setMap(leafletMap);
        }
    }, [topCitiesWeather, map]);

    // Extract and format weather data for the report
    useEffect(() => {
        if (weatherData) {
            const {
                name,
                main: { temp, feels_like, temp_min, temp_max, humidity, pressure, sea_level, grnd_level },
                wind: { speed, deg, gust },
                visibility,
                weather,
                sys: { sunrise, sunset, country },
                timezone,
            } = weatherData;

            const formattedData = {
                city: name,
                country,
                temperature: {
                    current: temp,
                    feelsLike: feels_like,
                    min: temp_min,
                    max: temp_max,
                },
                humidity,
                pressure: {
                    seaLevel: sea_level,
                    groundLevel: grnd_level,
                },
                wind: {
                    speed,
                    direction: deg,
                    gust,
                },
                visibility,
                condition: {
                    main: weather[0].main,
                    description: weather[0].description,
                    icon: weather[0].icon,
                },
                sunrise: new Date(sunrise * 1000).toLocaleTimeString(),
                sunset: new Date(sunset * 1000).toLocaleTimeString(),
                timezone: `UTC${timezone >= 0 ? '+' : ''}${timezone / 3600}`,
            };
            setReportData(formattedData);

            // Calculate Business and Travel Insights
            calculateBusinessInsights(formattedData);
            calculateTravelInsights(formattedData);
        }
    }, [weatherData]);

    // Calculate Business Insights
    const calculateBusinessInsights = (data) => {
        const insights = [];

        if (data.humidity > 70) {
            insights.push("High humidity may delay crop harvests.");
        }
        if (data.condition.main === "Rain") {
            insights.push("Rain may cause outdoor event cancellations.");
        }
        if (data.wind.speed > 10) {
            insights.push("Strong winds may disrupt logistics and transportation.");
        }
        if (data.temperature.current > 35) {
            insights.push("Extreme heat may affect outdoor work and productivity.");
        }

        setBusinessInsights(insights);
    };

    // Calculate Travel Insights
    const calculateTravelInsights = (data) => {
        const insights = [];

        if (data.condition.main === "Clear") {
            insights.push("Clear skies are ideal for sightseeing and outdoor activities.");
        }
        if (data.condition.main === "Rain") {
            insights.push("Rain may disrupt travel plans. Carry an umbrella.");
        }
        if (data.temperature.current < 10) {
            insights.push("Cold weather may require warm clothing for travel.");
        }
        if (data.wind.speed > 15) {
            insights.push("Strong winds may cause travel delays.");
        }

        setTravelInsights(insights);
    };

    // Export Report as CSV
    const exportCSV = () => {
        if (!reportData) return;

        const csvData = [
            ["City", reportData.city],
            ["Country", reportData.country],
            ["Temperature (°C)", reportData.temperature.current],
            ["Feels Like (°C)", reportData.temperature.feelsLike],
            ["Min Temperature (°C)", reportData.temperature.min],
            ["Max Temperature (°C)", reportData.temperature.max],
            ["Humidity (%)", reportData.humidity],
            ["Pressure (hPa)", reportData.pressure.seaLevel],
            ["Wind Speed (m/s)", reportData.wind.speed],
            ["Wind Direction (°)", reportData.wind.direction],
            ["Wind Gust (m/s)", reportData.wind.gust],
            ["Visibility (m)", reportData.visibility],
            ["Condition", reportData.condition.main],
            ["Description", reportData.condition.description],
            ["Sunrise", reportData.sunrise],
            ["Sunset", reportData.sunset],
            ["Timezone", reportData.timezone],
        ];

        const csvContent = csvData.map((row) => row.join(",")).join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
        saveAs(blob, 'weather_report.csv');
    };

    // Export Report as PDF
    const exportPDF = () => {
        if (!reportData) return;

        const doc = new jsPDF();
        doc.setFontSize(16);
        doc.text(`Weather Report for ${reportData.city}, ${reportData.country}`, 10, 10);

        doc.setFontSize(12);
        let y = 20;
        const addLine = (label, value) => {
            doc.text(`${label}: ${value}`, 10, y);
            y += 10;
        };

        addLine("Temperature (°C)", reportData.temperature.current);
        addLine("Feels Like (°C)", reportData.temperature.feelsLike);
        addLine("Min Temperature (°C)", reportData.temperature.min);
        addLine("Max Temperature (°C)", reportData.temperature.max);
        addLine("Humidity (%)", reportData.humidity);
        addLine("Pressure (hPa)", reportData.pressure.seaLevel);
        addLine("Wind Speed (m/s)", reportData.wind.speed);
        addLine("Wind Direction (°)", reportData.wind.direction);
        addLine("Wind Gust (m/s)", reportData.wind.gust);
        addLine("Visibility (m)", reportData.visibility);
        addLine("Condition", reportData.condition.main);
        addLine("Description", reportData.condition.description);
        addLine("Sunrise", reportData.sunrise);
        addLine("Sunset", reportData.sunset);
        addLine("Timezone", reportData.timezone);

        doc.save('weather_report.pdf');
    };

    // Data for Bar Chart (Temperature Comparison)
    const chartData = {
        labels: [reportData?.city, ...topCitiesWeather.map((city) => city.city)],
        datasets: [
            {
                label: 'Temperature (°C)',
                data: [reportData?.temperature.current, ...topCitiesWeather.map((city) => city.temperature)],
                backgroundColor: 'rgba(75, 192, 192, 0.6)',
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 1,
            },
        ],
    };

    const chartOptions = {
        responsive: true,
        plugins: {
            legend: {
                position: 'top',
            },
            title: {
                display: true,
                text: 'Temperature Comparison Across Cities',
            },
        },
    };

    if (loading) {
        return <p>Loading weather data...</p>;
    }

    if (error) {
        return <p className="text-red-500">{error}</p>;
    }

    if (!reportData) {
        return <p>No weather data available.</p>;
    }

    return (
        <div className="city-weather-report p-4">
            <h1 className="text-2xl font-bold mb-4">Weather Report for {reportData.city}, {reportData.country}</h1>

            {/* Interactive Map */}
            <div id="map" style={{ height: '400px', marginBottom: '20px' }}></div>

            {/* Weather Details */}
            <div className="weather-details mb-6">
                <h2 className="text-xl font-semibold mb-2">Weather Details</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-slate-100 p-4 rounded">
                        <p><strong>Temperature:</strong> {reportData.temperature.current}°C</p>
                        <p><strong>Feels Like:</strong> {reportData.temperature.feelsLike}°C</p>
                        <p><strong>Min Temperature:</strong> {reportData.temperature.min}°C</p>
                        <p><strong>Max Temperature:</strong> {reportData.temperature.max}°C</p>
                    </div>
                    <div className="bg-slate-100 p-4 rounded">
                        <p><strong>Humidity:</strong> {reportData.humidity}%</p>
                        <p><strong>Pressure:</strong> {reportData.pressure.seaLevel} hPa</p>
                        <p><strong>Wind Speed:</strong> {reportData.wind.speed} m/s</p>
                        <p><strong>Wind Direction:</strong> {reportData.wind.direction}°</p>
                        <p><strong>Wind Gust:</strong> {reportData.wind.gust} m/s</p>
                    </div>
                    <div className="bg-slate-100 p-4 rounded">
                        <p><strong>Visibility:</strong> {reportData.visibility} meters</p>
                        <p><strong>Condition:</strong> {reportData.condition.main}</p>
                        <p><strong>Description:</strong> {reportData.condition.description}</p>
                    </div>
                    <div className="bg-slate-100 p-4 rounded">
                        <p><strong>Sunrise:</strong> {reportData.sunrise}</p>
                        <p><strong>Sunset:</strong> {reportData.sunset}</p>
                        <p><strong>Timezone:</strong> {reportData.timezone}</p>
                    </div>
                </div>
            </div>

            {/* Business Insights */}
            <div className="business-insights mb-6">
                <h2 className="text-xl font-semibold mb-2">Business Insights</h2>
                <div className="bg-slate-100 p-4 rounded">
                    {businessInsights.length > 0 ? (
                        <ul className="list-disc pl-5">
                            {businessInsights.map((insight, index) => (
                                <li key={index}>{insight}</li>
                            ))}
                        </ul>
                    ) : (
                        <p>No significant business insights for the current weather.</p>
                    )}
                </div>
            </div>

            {/* Travel Insights */}
            <div className="travel-insights mb-6">
                <h2 className="text-xl font-semibold mb-2">Travel Insights</h2>
                <div className="bg-slate-100 p-4 rounded">
                    {travelInsights.length > 0 ? (
                        <ul className="list-disc pl-5">
                            {travelInsights.map((insight, index) => (
                                <li key={index}>{insight}</li>
                            ))}
                        </ul>
                    ) : (
                        <p>No significant travel insights for the current weather.</p>
                    )}
                </div>
            </div>

            {/* City Weather Cards */}
            <div className="city-cards mb-6">
                <h2 className="text-xl font-semibold mb-2">Weather in Top Cities</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* Current Location Card */}
                    <div className="bg-slate-100 p-4 rounded">
                        <h3 className="font-semibold">{reportData.city}, {reportData.country}</h3>
                        <p><strong>Temperature:</strong> {reportData.temperature.current}°C</p>
                        <p><strong>Condition:</strong> {reportData.condition.main}</p>
                        <p><strong>Humidity:</strong> {reportData.humidity}%</p>
                        <p><strong>Wind Speed:</strong> {reportData.wind.speed} m/s</p>
                    </div>
                    {/* Top Cities Cards */}
                    {topCitiesWeather.map((city, index) => (
                        <div key={index} className="bg-slate-100 p-4 rounded">
                            <h3 className="font-semibold">{city.city}, {city.country}</h3>
                            <p><strong>Temperature:</strong> {city.temperature}°C</p>
                            <p><strong>Condition:</strong> {city.condition}</p>
                            <p><strong>Humidity:</strong> {city.humidity}%</p>
                            <p><strong>Wind Speed:</strong> {city.windSpeed} m/s</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Graphical Visualization */}
            <div className="graphical-visualization mb-6">
                <h2 className="text-xl font-semibold mb-2">Temperature Comparison Across Cities</h2>
                <div className="bg-white p-4 rounded">
                    <Bar data={chartData} options={chartOptions} />
                </div>
            </div>

            {/* Export Buttons */}
            <div className="export-buttons">
                <button onClick={exportPDF} className="bg-green-500 text-white p-2 mr-2 rounded">
                    Export as PDF
                </button>
                <button onClick={exportCSV} className="bg-green-500 text-white p-2 rounded">
                    Export as CSV
                </button>
            </div>
        </div>
    );
};

export default BusinessFeatures;