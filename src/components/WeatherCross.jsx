import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for Leaflet's default icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const WeatherCross = ({ 
  defaultLocation = 'Kolkata', 
  apiKey = 'GKBUJQF7JQHYFVGTGMJF9XFDF',
  defaultTab = 'current'
}) => {
  const [weatherData, setWeatherData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [unitGroup, setUnitGroup] = useState('metric');
  const [mapCenter, setMapCenter] = useState([22.5726, 88.3639]);
  const [userLocation, setUserLocation] = useState(defaultLocation);
  const [locationName, setLocationName] = useState(defaultLocation);
  const [isGeoLocating, setIsGeoLocating] = useState(false);
  const mapRef = useRef(null);
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);
  const headerRef = useRef(null);

  // Auto-detect user location
  useEffect(() => {
    const detectLocation = () => {
      if (navigator.geolocation) {
        setIsGeoLocating(true);
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            try {
              const { latitude, longitude } = position.coords;
              setMapCenter([latitude, longitude]);
              
              // First try to get location name from VisualCrossing API
              try {
                const weatherResponse = await axios.get(
                  `https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/${latitude},${longitude}?unitGroup=${unitGroup}&key=${apiKey}&contentType=json`
                );
                setLocationName(weatherResponse.data.resolvedAddress);
                setUserLocation(`${latitude},${longitude}`);
              } catch {
                // Fallback to OpenStreetMap if VisualCrossing fails
                const response = await axios.get(
                  `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
                );
                const address = response.data.address;
                let name = '';
                
                if (address.city) name = address.city;
                else if (address.town) name = address.town;
                else if (address.village) name = address.village;
                else if (address.county) name = address.county;
                else name = `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
                
                setLocationName(name);
                setUserLocation(`${latitude},${longitude}`);
              }
            } catch (error) {
              console.error("Error getting location:", error);
              setLocationName(`${position.coords.latitude.toFixed(4)}, ${position.coords.longitude.toFixed(4)}`);
              setUserLocation(`${position.coords.latitude},${position.coords.longitude}`);
            } finally {
              setIsGeoLocating(false);
            }
          },
          (error) => {
            console.error("Geolocation error:", error);
            setIsGeoLocating(false);
            setError("Location access denied. Using default location.");
          },
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
          }
        );
      } else {
        setError("Geolocation not supported. Using default location.");
      }
    };

    detectLocation();
  }, []);

  // Fix header position
  useEffect(() => {
    if (headerRef.current) {
      const headerHeight = headerRef.current.offsetHeight;
      document.documentElement.style.setProperty('--header-height', `${headerHeight}px`);
    }
  }, [weatherData, locationName]);

  const fetchWeatherData = async () => {
    try {
      setLoading(true);
      let url;
      
      if (activeTab === 'current') {
        url = `https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/${userLocation}?unitGroup=${unitGroup}&key=${apiKey}&contentType=json`;
      } else if (activeTab === 'forecast') {
        url = `https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/${userLocation}?unitGroup=${unitGroup}&key=${apiKey}&contentType=json&include=days`;
      } else if (activeTab === 'alerts') {
        url = `https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/${userLocation}?unitGroup=${unitGroup}&key=${apiKey}&contentType=json&include=alerts`;
      }
      
      const response = await axios.get(url);
      setWeatherData(response.data);
      
      if (response.data.latitude && response.data.longitude) {
        setMapCenter([response.data.latitude, response.data.longitude]);
      }
      
      // Update location name from API response if available
      if (response.data.resolvedAddress && !response.data.resolvedAddress.includes(',')) {
        setLocationName(response.data.resolvedAddress);
      }
      
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Failed to fetch weather data");
      setWeatherData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userLocation) {
      fetchWeatherData();
    }
  }, [userLocation, activeTab, unitGroup]);

  useEffect(() => {
    if (mapRef.current && mapCenter) {
      mapRef.current.setView(mapCenter, activeTab === 'current' ? 12 : 10);
    }
  }, [mapCenter, activeTab]);

  const getUnitSymbol = (type) => {
    switch(type) {
      case 'temp': return unitGroup === 'us' ? '°F' : '°C';
      case 'speed': return unitGroup === 'us' ? 'mph' : 'km/h';
      case 'distance': return unitGroup === 'us' ? 'mi' : 'km';
      case 'pressure': return unitGroup === 'us' ? 'in' : 'mb';
      default: return '';
    }
  };

  const renderCurrentWeather = () => {
    if (!weatherData?.currentConditions) return null;
    
    const current = weatherData.currentConditions;
    const unitSymbol = getUnitSymbol('temp');
    const speedUnit = getUnitSymbol('speed');

    return (
      <div className="space-y-6 mt-3">
        {/* Current Conditions Card */}
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl shadow-lg">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center">
              <img 
                src={`https://raw.githubusercontent.com/visualcrossing/WeatherIcons/main/PNG/2nd%20Set%20-%20Color/${current.icon}.png`} 
                alt={current.conditions} 
                className="w-24 h-24"
                onError={(e) => e.target.src = 'https://via.placeholder.com/96?text=Weather'}
              />
              <div className="ml-4">
                <h2 className="text-4xl font-bold text-gray-800">
                  {Math.round(current.temp)}{unitSymbol}
                </h2>
                <p className="text-xl text-gray-600 capitalize">{current.conditions.toLowerCase()}</p>
                <p className="text-gray-500">Feels like {Math.round(current.feelslike)}{unitSymbol}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 w-full md:w-auto">
              <WeatherMetric 
                label="Humidity" 
                value={`${current.humidity}%`}
                icon="💧"
              />
              <WeatherMetric 
                label="Wind" 
                value={`${Math.round(current.windspeed)} ${speedUnit}`}
                subValue={`${current.winddir}°`}
                icon="🌬️"
              />
              <WeatherMetric 
                label="Pressure" 
                value={`${current.pressure} ${getUnitSymbol('pressure')}`}
                icon="📊"
              />
              <WeatherMetric 
                label="UV Index" 
                value={current.uvindex}
                icon="☀️"
              />
            </div>
          </div>
        </div>

        {/* Hourly Forecast */}
        {weatherData.days?.[0]?.hours && (
          <div className="bg-white p-6 rounded-xl shadow-lg">
            <h3 className="text-2xl font-bold text-gray-800 mb-4">Hourly Forecast</h3>
            <div className="flex overflow-x-auto pb-2 -mx-2 scrollbar-hide">
              {weatherData.days[0].hours.filter((_, i) => i % 2 === 0).map((hour, index) => (
                <div 
                  key={index} 
                  className="flex-shrink-0 w-20 mx-2 p-3 bg-gradient-to-b from-blue-50 to-white rounded-lg shadow text-center transition-all hover:scale-105"
                >
                  <p className="text-sm font-medium text-gray-600">
                    {new Date(hour.datetimeEpoch * 1000).toLocaleTimeString([], { hour: '2-digit' })}
                  </p>
                  <img 
                    src={`https://raw.githubusercontent.com/visualcrossing/WeatherIcons/main/PNG/2nd%20Set%20-%20Color/${hour.icon}.png`} 
                    alt={hour.conditions} 
                    className="w-12 h-12 mx-auto my-1"
                    onError={(e) => e.target.src = 'https://via.placeholder.com/48?text=Weather'}
                  />
                  <p className="font-bold text-gray-800">{Math.round(hour.temp)}{unitSymbol}</p>
                  <p className="text-xs text-gray-500 capitalize">{hour.conditions.toLowerCase()}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Map */}
        <div className="bg-white p-6 rounded-xl shadow-lg">
          <h3 className="text-2xl font-bold text-gray-800 mb-4">Location</h3>
          <div className="h-80 rounded-xl overflow-hidden border-2 border-gray-200">
            <MapContainer 
              center={mapCenter} 
              zoom={12} 
              style={{ height: '100%', width: '100%' }}
              ref={mapRef}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              />
              <Marker position={mapCenter}>
                <Popup className="font-sans">
                  <div>
                    <h4 className="font-bold text-lg">{locationName}</h4>
                    <p className="text-gray-700">
                      Current: {Math.round(current.temp)}{unitSymbol} | {current.conditions}
                    </p>
                    <p className="text-sm text-gray-500">
                      Lat: {weatherData.latitude?.toFixed(4)}, Long: {weatherData.longitude?.toFixed(4)}
                    </p>
                  </div>
                </Popup>
              </Marker>
              <Circle
                center={mapCenter}
                radius={current.windspeed * 100}
                color="#3b82f6"
                fillColor="#3b82f6"
                fillOpacity={0.1}
              >
                <Popup>Wind Speed: {current.windspeed} {speedUnit}</Popup>
              </Circle>
            </MapContainer>
          </div>
        </div>
      </div>
    );
  };

  const renderForecast = () => {
    if (!weatherData?.days) return null;
    
    const unitSymbol = getUnitSymbol('temp');
    const forecastDays = weatherData.days.slice(0, 15);

    return (
      <div className="space-y-6 mt-4">
        {/* 15-Day Forecast Summary */}
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl shadow-lg">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">15-Day Forecast</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-7 gap-3">
            {forecastDays.map((day, index) => (
              <div 
                key={index}
                onClick={() => setSelectedDayIndex(index)}
                className={`p-3 rounded-lg cursor-pointer transition-all ${selectedDayIndex === index ? 'bg-blue-500 text-white shadow-md' : 'bg-white/80 hover:bg-white'}`}
              >
                <p className="font-semibold">
                  {new Date(day.datetimeEpoch * 1000).toLocaleDateString('en-US', { 
                    weekday: 'short' 
                  })}
                </p>
                <p className="text-sm text-gray-500">
                  {new Date(day.datetimeEpoch * 1000).toLocaleDateString('en-US', { 
                    month: 'short', 
                    day: 'numeric' 
                  })}
                </p>
                <img 
                  src={`https://raw.githubusercontent.com/visualcrossing/WeatherIcons/main/PNG/2nd%20Set%20-%20Color/${day.icon}.png`} 
                  alt={day.conditions} 
                  className="w-12 h-12 mx-auto my-1"
                  onError={(e) => e.target.src = 'https://via.placeholder.com/48?text=Weather'}
                />
                <div className="flex justify-center space-x-2">
                  <span className="font-bold">{Math.round(day.tempmax)}{unitSymbol}</span>
                  <span className="text-gray-500">{Math.round(day.tempmin)}{unitSymbol}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Detailed Day Forecast */}
        {forecastDays[selectedDayIndex] && (
          <div className="bg-white p-6 rounded-xl shadow-lg">
            <h3 className="text-2xl font-bold text-gray-800 mb-4">
              {new Date(forecastDays[selectedDayIndex].datetimeEpoch * 1000).toLocaleDateString('en-US', { 
                weekday: 'long', 
                month: 'long', 
                day: 'numeric' 
              })}
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Day Overview */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-lg font-semibold">Day Overview</p>
                    <p className="text-gray-600 capitalize">{forecastDays[selectedDayIndex].conditions.toLowerCase()}</p>
                  </div>
                  <img 
                    src={`https://raw.githubusercontent.com/visualcrossing/WeatherIcons/main/PNG/2nd%20Set%20-%20Color/${forecastDays[selectedDayIndex].icon}.png`} 
                    alt={forecastDays[selectedDayIndex].conditions} 
                    className="w-16 h-16"
                    onError={(e) => e.target.src = 'https://via.placeholder.com/64?text=Weather'}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <WeatherMetric 
                    label="High" 
                    value={`${Math.round(forecastDays[selectedDayIndex].tempmax)}${unitSymbol}`}
                  />
                  <WeatherMetric 
                    label="Low" 
                    value={`${Math.round(forecastDays[selectedDayIndex].tempmin)}${unitSymbol}`}
                  />
                  <WeatherMetric 
                    label="Precip" 
                    value={`${forecastDays[selectedDayIndex].precip || 0} ${getUnitSymbol('distance')}`}
                  />
                  <WeatherMetric 
                    label="Humidity" 
                    value={`${forecastDays[selectedDayIndex].humidity}%`}
                  />
                  <WeatherMetric 
                    label="Wind Speed" 
                    value={`${Math.round(forecastDays[selectedDayIndex].windspeed)} ${getUnitSymbol('speed')}`}
                  />
                  <WeatherMetric 
                    label="UV Index" 
                    value={forecastDays[selectedDayIndex].uvindex}
                  />
                </div>
              </div>

              {/* Sun and Moon Info */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-lg font-semibold mb-3">Sun & Moon</p>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Sunrise</span>
                    <span className="font-medium">{forecastDays[selectedDayIndex].sunrise}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Sunset</span>
                    <span className="font-medium">{forecastDays[selectedDayIndex].sunset}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Moon Phase</span>
                    <span className="font-medium">
                      {getMoonPhaseName(forecastDays[selectedDayIndex].moonphase)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderAlerts = () => {
    if (!weatherData?.alerts?.length) {
      return (
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl shadow-lg text-center mt-4">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Weather Alerts</h2>
          <p className="text-gray-600">No active weather alerts for this location.</p>
        </div>
      );
    }

    return (
      <div className="space-y-4 mt-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl shadow-lg">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Weather Alerts</h2>
          <div className="space-y-3">
            {weatherData.alerts.map((alert, index) => (
              <div 
                key={index} 
                className="border-l-4 border-red-500 pl-4 py-3 bg-white rounded-lg shadow"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-bold text-lg capitalize">{alert.event.toLowerCase()}</h4>
                    <p className="text-sm text-gray-600">
                      {new Date(alert.onsetEpoch * 1000).toLocaleString()} - 
                      {new Date(alert.endsEpoch * 1000).toLocaleString()}
                    </p>
                  </div>
                  <span className={`px-2 py-1 rounded text-sm font-medium ${
                    alert.severity === 'Moderate' ? 'bg-yellow-100 text-yellow-800' :
                    alert.severity === 'Severe' ? 'bg-orange-100 text-orange-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {alert.severity}
                  </span>
                </div>
                <p className="mt-2 text-gray-700">{alert.description}</p>
                {alert.instruction && (
                  <div className="mt-3 p-3 bg-yellow-50 rounded-lg">
                    <p className="font-semibold text-yellow-800">Instructions:</p>
                    <p className="text-yellow-700">{alert.instruction}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6">
      {/* Header */}
      <div 
        ref={headerRef}
        className="mb-6 bg-gradient-to-r from-blue-600 to-blue-800 rounded-xl shadow-xl p-6 text-white sticky top-4 z-10"
      >
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
          <div>
            <h1 className="text-3xl font-bold">
              {locationName}
            </h1>
            <p className="text-blue-100">
              {weatherData?.description || 'Current weather conditions'}
              {isGeoLocating && (
                <span className="ml-2 text-sm flex items-center">
                  <span className="animate-spin rounded-full h-3 w-3 border-t-2 border-b-2 border-white mr-1"></span>
                  Detecting location...
                </span>
              )}
            </p>
          </div>
          <button
            onClick={() => {
              setUserLocation(defaultLocation);
              setMapCenter([22.5726, 88.3639]);
              setLocationName(defaultLocation);
            }}
            className="px-3 py-1 bg-white/20 rounded-lg text-sm hover:bg-white/30 transition-colors"
          >
            Reset Location
          </button>
        </div>
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex flex-wrap gap-2">
            <TabButton 
              active={activeTab === 'current'}
              onClick={() => setActiveTab('current')}
            >
              Current
            </TabButton>
            <TabButton 
              active={activeTab === 'forecast'}
              onClick={() => setActiveTab('forecast')}
            >
              15-Day Forecast
            </TabButton>
            <TabButton 
              active={activeTab === 'alerts'}
              onClick={() => setActiveTab('alerts')}
            >
              Alerts
            </TabButton>
          </div>
          <div>
            <select
              value={unitGroup}
              onChange={(e) => setUnitGroup(e.target.value)}
              className="bg-white/20 border border-white/30 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-white"
            >
              <option value="metric">Metric (°C, km/h)</option>
              <option value="us">Imperial (°F, mph)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-lg mb-6" role="alert">
          <div className="flex justify-between items-start">
            <div>
              <p className="font-bold">Error</p>
              <p>{error}</p>
            </div>
            <button 
              onClick={() => setError(null)}
              className="text-red-700 hover:text-red-900"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Content */}
      {!loading && !error && (
        <>
          {activeTab === 'current' && renderCurrentWeather()}
          {activeTab === 'forecast' && renderForecast()}
          {activeTab === 'alerts' && renderAlerts()}
        </>
      )}

      {/* Footer */}
      <div className="mt-8 text-center text-sm text-gray-500">
        <p>Powered by <a href="https://www.visualcrossing.com" className="text-blue-600 hover:underline">VisualCrossing Weather API</a></p>
        {weatherData?.currentConditions?.datetime && (
          <p className="mt-1">
            Last updated: {new Date(weatherData.currentConditions.datetimeEpoch * 1000).toLocaleTimeString()}
          </p>
        )}
      </div>
    </div>
  );
};

// Helper Components
const TabButton = ({ children, active, onClick }) => (
  <button
    onClick={onClick}
    className={`px-4 py-2 rounded-lg transition-all ${active ? 'bg-white text-blue-800 shadow-md' : 'bg-white/20 hover:bg-white/30'}`}
  >
    {children}
  </button>
);

const WeatherMetric = ({ label, value, subValue, icon }) => (
  <div className="bg-white p-3 rounded shadow">
    <div className="flex items-center gap-2">
      {icon && <span className="text-lg">{icon}</span>}
      <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p className="text-lg font-semibold">{value}</p>
        {subValue && <p className="text-xs text-gray-500">{subValue}</p>}
      </div>
    </div>
  </div>
);

// Helper Functions
const getMoonPhaseName = (phase) => {
  if (phase === 0) return 'New Moon';
  if (phase > 0 && phase < 0.25) return 'Waxing Crescent';
  if (phase === 0.25) return 'First Quarter';
  if (phase > 0.25 && phase < 0.5) return 'Waxing Gibbous';
  if (phase === 0.5) return 'Full Moon';
  if (phase > 0.5 && phase < 0.75) return 'Waning Gibbous';
  if (phase === 0.75) return 'Last Quarter';
  return 'Waning Crescent';
};

export default WeatherCross;