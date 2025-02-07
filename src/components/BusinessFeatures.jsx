import React, { useState, useEffect } from 'react';
import { saveAs } from 'file-saver';
import jsPDF from 'jspdf';
import { Bar } from 'react-chartjs-2';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
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
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const BusinessFeatures = () => {
    const [weatherData, setWeatherData] = useState(null);
    const [topCitiesWeather, setTopCitiesWeather] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [aiInsights, setAiInsights] = useState([]);
    const [map, setMap] = useState(null);

    const topCities = ["Mumbai", "Delhi", "Bangalore", "New York", "London", "Tokyo", "Paris", "Dubai", "Sydney", "Singapore"];

    // Fetch Weather Data for User's Current Location
    const fetchWeatherForLocation = async (lat, lon) => {
        try {
            const response = await fetch(
                `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${import.meta.env.VITE_APP_ID}`
            );
            if (!response.ok) throw new Error("Failed to fetch weather data.");
            const data = await response.json();
            setWeatherData(data);
            generateAiInsights(data);
        } catch (error) {
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
            setTopCitiesWeather(weatherData);
        } catch (error) {
            setError("Failed to fetch weather data for top cities.");
        }
    };

    // Get User's Location on Load
    useEffect(() => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => fetchWeatherForLocation(position.coords.latitude, position.coords.longitude),
                () => setError("Location access denied. Enable location to fetch weather.")
            );
        } else {
            setError("Geolocation is not supported.");
        }
    }, []);

    // Fetch Weather for Top Cities
    useEffect(() => {
        fetchWeatherForTopCities();
    }, []);

    // Initialize Real-Time Weather Map
    useEffect(() => {
        if (topCitiesWeather.length > 0 && !map) {
            const leafletMap = L.map('map').setView([20, 0], 2);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap contributors',
            }).addTo(leafletMap);

            topCitiesWeather.forEach((city) => {
                L.marker([city.coord.lat, city.coord.lon])
                    .addTo(leafletMap)
                    .bindPopup(`<b>${city.name}</b><br>Temp: ${city.main.temp}°C<br>Condition: ${city.weather[0].main}`);
            });

            setMap(leafletMap);
        }
    }, [topCitiesWeather, map]);

    // AI-Generated Insights (Using Google Gemini AI)
    const generateAiInsights = async (weather) => {
        const prompt = `Analyze the following weather data and provide business, travel, and health-related insights:\n
        City: ${weather.name}, Country: ${weather.sys.country}
        Temperature: ${weather.main.temp}°C
        Humidity: ${weather.main.humidity}%
        Weather Condition: ${weather.weather[0].main}`;

        try {
            const response = await fetch('https://gemini.googleapis.com/v1/models/gemini-pro:generateContent', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${import.meta.env.VITE_GEMINI_API_KEY}`,
                },
                body: JSON.stringify({ prompt }),
            });

            const aiResponse = await response.json();
            setAiInsights(aiResponse.candidates[0].content.split('\n'));
        } catch (error) {
            console.error("AI Insights Error:", error);
        }
    };

    // Export Data to CSV
    const exportCSV = () => {
        if (!weatherData) return;

        const csvData = [
            ["City", weatherData.name],
            ["Country", weatherData.sys.country],
            ["Temperature (°C)", weatherData.main.temp],
            ["Humidity (%)", weatherData.main.humidity],
            ["Condition", weatherData.weather[0].main]
        ];

        const csvContent = csvData.map((row) => row.join(",")).join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
        saveAs(blob, 'weather_report.csv');
    };

    // Export Data to PDF
    const exportPDF = () => {
        if (!weatherData) return;

        const doc = new jsPDF();
        doc.setFontSize(16);
        doc.text(`Weather Report: ${weatherData.name}, ${weatherData.sys.country}`, 10, 10);

        let y = 20;
        const addLine = (label, value) => {
            doc.text(`${label}: ${value}`, 10, y);
            y += 10;
        };

        addLine("Temperature", `${weatherData.main.temp}°C`);
        addLine("Humidity", `${weatherData.main.humidity}%`);
        addLine("Condition", weatherData.weather[0].main);
        doc.save("weather_report.pdf");
    };

    return (
        <div>
            <h1>Weather & Business Insights</h1>
            {loading ? <p>Loading weather data...</p> : error ? <p>{error}</p> : (
                <>
                    <p><strong>Current City:</strong> {weatherData?.name}</p>
                    <p><strong>Temperature:</strong> {weatherData?.main.temp}°C</p>
                    <p><strong>Condition:</strong> {weatherData?.weather[0].main}</p>

                    <h3>AI-Powered Insights</h3>
                    <ul>{aiInsights.map((insight, index) => <li key={index}>{insight}</li>)}</ul>

                    <button onClick={exportCSV}>Export CSV</button>
                    <button onClick={exportPDF}>Export PDF</button>

                    <h3>Real-Time Weather Map</h3>
                    <div id="map" style={{ height: "400px", width: "100%" }}></div>
                </>
            )}
        </div>
    );
};

export default BusinessFeatures;
