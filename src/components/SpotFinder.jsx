import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaSearch, FaMoneyBillWave, FaDirections, FaMapMarkerAlt, FaInfoCircle, FaRoute } from 'react-icons/fa';

const SpotFinder = () => {
  const [query, setQuery] = useState('');
  const [lat, setLat] = useState(22.5726);
  const [lon, setLon] = useState(88.3639);
  const [mapLayer, setMapLayer] = useState('mapnik');
  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [searchHistory, setSearchHistory] = useState([]);
  const [zoom, setZoom] = useState(15);
  const [directions, setDirections] = useState(null);
  const [showDirections, setShowDirections] = useState(false);

  // Get user's current location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lon: position.coords.longitude
          });
          setLat(position.coords.latitude);
          setLon(position.coords.longitude);
        },
        (error) => console.error('Geolocation error:', error)
      );
    }
  }, []);

  const handleSearch = async () => {
    if (!query.trim()) return;
    
    setLoading(true);
    try {
      const res = await axios.get(
        `https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1`
      );
      if (res.data && res.data.length > 0) {
        const location = res.data[0];
        setLat(parseFloat(location.lat));
        setLon(parseFloat(location.lon));
        setSearchHistory(prev => [...new Set([query, ...prev])].slice(0, 5));
      }
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  const findNearbyATMs = async () => {
    setLoading(true);
    try {
      const res = await axios.get(
        `https://overpass-api.de/api/interpreter?data=[out:json];node["amenity"="atm"](around:1000,${lat},${lon});out;`
      );
      setPlaces(res.data.elements);
    } catch (error) {
      console.error('ATM search error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDirections = async (place) => {
    if (!place || !userLocation) return;
    
    setLoading(true);
    try {
      const response = await axios.get(
        `https://router.project-osrm.org/route/v1/driving/${userLocation.lon},${userLocation.lat};${place.lon},${place.lat}?overview=false&steps=true`
      );
      
      if (response.data.routes && response.data.routes.length > 0) {
        const route = response.data.routes[0];
        setDirections({
          distance: (route.distance / 1000).toFixed(1) + ' km',
          duration: formatDuration(route.duration),
          steps: route.legs[0].steps.map(step => ({
            instruction: step.maneuver.instruction,
            distance: (step.distance).toFixed(0) + 'm',
            name: step.name || 'unnamed road'
          }))
        });
        setShowDirections(true);
      }
    } catch (error) {
      console.error('Directions error:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours > 0 ? hours + ':' : ''}${minutes.toString().padStart(2, '0')}`;
  };

  const handlePlaceClick = (place) => {
    setSelectedPlace(place);
    setLat(place.lat);
    setLon(place.lon);
    setZoom(18);
    setShowDirections(false);
  };

  const bbox = `${lon - 0.01}%2C${lat - 0.01}%2C${lon + 0.01}%2C${lat + 0.01}`;
  const mapSrc = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=${mapLayer}&marker=${lat}%2C${lon}&zoom=${zoom}`;

  return (
    <div className="w-full min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-8 transition-colors duration-200">
      <div className="max-w-6xl mx-auto">
        <header className="mb-8 text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-blue-600 dark:text-blue-400 mb-2">
            SpotFinder
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Find ATMs and navigate easily
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Search Panel */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4">
            <div className="flex flex-col gap-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder="Search location..."
                  className="flex-1 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  list="searchHistory"
                />
                <datalist id="searchHistory">
                  {searchHistory.map((item, i) => (
                    <option key={i} value={item} />
                  ))}
                </datalist>
                <button
                  onClick={handleSearch}
                  disabled={loading}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
                >
                  <FaSearch /> {loading ? 'Searching...' : 'Search'}
                </button>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  onClick={findNearbyATMs}
                  disabled={loading}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2"
                >
                  <FaMoneyBillWave /> Find ATMs
                </button>
                {userLocation && (
                  <button
                    onClick={() => {
                      setLat(userLocation.lat);
                      setLon(userLocation.lon);
                      setZoom(15);
                      setShowDirections(false);
                    }}
                    className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 flex items-center gap-2"
                  >
                    <FaMapMarkerAlt /> My Location
                  </button>
                )}
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Map Layer
                </label>
                <select
                  value={mapLayer}
                  onChange={(e) => setMapLayer(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="mapnik">Standard</option>
                  <option value="cyclemap">Cycle Map</option>
                  <option value="transportmap">Transport Map</option>
                  <option value="hot">Humanitarian</option>
                </select>
              </div>
            </div>

            {places.length > 0 && (
              <div className="mt-6">
                <h2 className="text-xl font-semibold mb-3 text-gray-800 dark:text-white flex items-center gap-2">
                  <FaMoneyBillWave /> Nearby ATMs
                </h2>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {places.map((place, idx) => (
                    <div
                      key={idx}
                      onClick={() => handlePlaceClick(place)}
                      className={`p-3 rounded-lg cursor-pointer transition-colors ${selectedPlace?.id === place.id ? 'bg-blue-100 dark:bg-blue-900' : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'}`}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-medium text-gray-800 dark:text-white">
                            {place.tags?.name || `ATM ${idx + 1}`}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-300">
                            {place.tags?.operator || 'ATM'}
                          </p>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            getDirections(place);
                          }}
                          className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 flex items-center gap-1"
                          title="Get directions"
                        >
                          <FaDirections />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Map View and Directions */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden h-full">
              <iframe
                title="OpenStreetMap"
                src={mapSrc}
                className="w-full h-96 border-0"
                allowFullScreen=""
                loading="lazy"
              ></iframe>
            </div>

            {showDirections && directions && (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold text-gray-800 dark:text-white flex items-center gap-2">
                    <FaRoute /> Directions
                  </h2>
                  <div className="text-gray-600 dark:text-gray-300">
                    <span className="font-medium">Distance:</span> {directions.distance} • 
                    <span className="font-medium ml-2">Time:</span> {directions.duration}
                  </div>
                </div>
                
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {directions.steps.map((step, index) => (
                    <div key={index} className="flex items-start gap-3 p-2 border-b border-gray-100 dark:border-gray-700 last:border-0">
                      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 flex items-center justify-center text-xs font-medium">
                        {index + 1}
                      </div>
                      <div>
                        <p className="text-gray-800 dark:text-gray-200">
                          {step.instruction.replace('Head', 'Start')}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {step.distance} • {step.name}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selectedPlace && !showDirections && (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4">
                <h2 className="text-xl font-semibold mb-2 text-gray-800 dark:text-white flex items-center gap-2">
                  <FaInfoCircle /> ATM Details
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-gray-600 dark:text-gray-300">
                      <span className="font-medium">Latitude:</span> {selectedPlace.lat.toFixed(6)}
                    </p>
                    <p className="text-gray-600 dark:text-gray-300">
                      <span className="font-medium">Longitude:</span> {selectedPlace.lon.toFixed(6)}
                    </p>
                    {selectedPlace.tags?.name && (
                      <p className="text-gray-600 dark:text-gray-300">
                        <span className="font-medium">Name:</span> {selectedPlace.tags.name}
                      </p>
                    )}
                    {selectedPlace.tags?.operator && (
                      <p className="text-gray-600 dark:text-gray-300">
                        <span className="font-medium">Operator:</span> {selectedPlace.tags.operator}
                      </p>
                    )}
                  </div>
                  <div className="flex items-end justify-end">
                    <button
                      onClick={() => getDirections(selectedPlace)}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
                    >
                      <FaDirections /> Get Directions
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SpotFinder;