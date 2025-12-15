import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  FaSearch,
  FaMapMarkerAlt,
  FaCity,
  FaUmbrellaBeach,
  FaHotel,
  FaUtensils,
} from "react-icons/fa";

/**
 * SpotFinder
 * - Modern Travel App layout:
 *   [Search Bar]
 *   [Large Image of place]
 *   [Weather Summary] [Travel Summary]
 *   [Nearby Places Grid]
 *   [Map]
 *
 * Requires env:
 *  - import.meta.env.VITE_PEXELS_KEY
 *  - import.meta.env.VITE_VISUALCROSSING_KEY
 *
 * Notes:
 *  - Uses Nominatim for geocoding (no key)
 *  - Uses Overpass for nearby POIs (no key)
 *  - Uses VisualCrossing for weather (key needed)
 *  - Uses Pexels for images (key needed)
 */

const SpotFinder = ({ defaultLocation = "Kolkata" }) => {
  const PEXELS_KEY = import.meta.env.VITE_PEXELS_KEY;
  const VISUAL_KEY = import.meta.env.VITE_VISUALCROSSING_KEY;

  // UI state
  const [query, setQuery] = useState(defaultLocation);
  const [lat, setLat] = useState(22.5726);
  const [lon, setLon] = useState(88.3639);
  const [zoom, setZoom] = useState(13);

  // data
  const [placeImage, setPlaceImage] = useState(null);
  const [imageLoading, setImageLoading] = useState(false);

  const [weather, setWeather] = useState(null);
  const [weatherLoading, setWeatherLoading] = useState(false);

  const [nearby, setNearby] = useState({
    airports: [],
    restaurants: [],
    hotels: [],
    attractions: [],
  });
  const [nearbyLoading, setNearbyLoading] = useState(false);

  const [searchHistory, setSearchHistory] = useState([]);
  const [loadingSearch, setLoadingSearch] = useState(false);

  // Map embed src computed
  const bbox = `${lon - 0.02}%2C${lat - 0.02}%2C${lon + 0.02}%2C${lat + 0.02}`;
  const mapSrc = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat}%2C${lon}&zoom=${zoom}`;

  useEffect(() => {
    // initial load
    handleSearch(defaultLocation);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // -------------------------
  // Helpers
  // -------------------------
  const safeSetHistory = (q) => {
    if (!q || !q.trim()) return;
    setSearchHistory((prev) => {
      const arr = [q, ...prev.filter((p) => p !== q)].slice(0, 6);
      return arr;
    });
  };

  // -------------------------
  // Pexels Image Fetch
  // -------------------------
  const fetchPlaceImage = async (queryName) => {
    if (!PEXELS_KEY) {
      setPlaceImage(null);
      return;
    }
    try {
      setImageLoading(true);
      const res = await axios.get(
        `https://api.pexels.com/v1/search?query=${encodeURIComponent(
          queryName
        )}&per_page=1`,
        {
          headers: {
            Authorization: PEXELS_KEY,
          },
        }
      );
      const photo = res.data?.photos?.[0];
      if (photo) setPlaceImage(photo.src.landscape || photo.src.large);
      else setPlaceImage(null);
    } catch (e) {
      console.error("Pexels error:", e);
      setPlaceImage(null);
    } finally {
      setImageLoading(false);
    }
  };

  // -------------------------
  // VisualCrossing Weather Fetch
  // -------------------------
  const fetchWeather = async (latVal, lonVal) => {
    if (!VISUAL_KEY) {
      setWeather(null);
      return;
    }
    try {
      setWeatherLoading(true);
      // request a few days for summary (timeline endpoint)
      const url = `https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/${latVal},${lonVal}?unitGroup=metric&key=${VISUAL_KEY}&include=days%2Chours&contentType=json`;
      const res = await axios.get(url);
      setWeather(res.data || null);
    } catch (e) {
      console.error("Weather fetch error:", e);
      setWeather(null);
    } finally {
      setWeatherLoading(false);
    }
  };

  // -------------------------
  // Overpass Nearby POIs
  // -------------------------
  const fetchNearbyPlaces = async (latVal, lonVal, radius = 2000) => {
    try {
      setNearbyLoading(true);
      // We will query several amenity types in separate calls for clarity.
      const overpassBase = "https://overpass-api.de/api/interpreter?data=";

      // helper to run a query and map results
      const runQuery = async (q) => {
        const encoded = encodeURIComponent(q);
        const res = await axios.get(overpassBase + encoded);
        return res.data?.elements || [];
      };

      // airports
      const qAir = `[out:json];node(around:${radius},${latVal},${lonVal})[aeroway~"aerodrome|aerodrome_secondary|aerodrome_private|airport"];out;`;
      const airports = await runQuery(qAir);

      // restaurants
      const qRest = `[out:json];node(around:${radius},${latVal},${lonVal})[amenity=restaurant];out;`;
      const restaurants = await runQuery(qRest);

      // hotels (tourism=hotel or tourist accommodation)
      const qHotels = `[out:json];node(around:${radius},${latVal},${lonVal})[tourism~"hotel|guest_house|motel|hostel"];out;`;
      const hotels = await runQuery(qHotels);

      // attractions (tourism=attraction OR historic=*)
      const qAttract = `[out:json];node(around:${radius},${latVal},${lonVal})[tourism~"attraction|museum|zoo|theme_park"] ; node(around:${radius},${latVal},${lonVal})[historic];out;`;
      const attractions = await runQuery(qAttract);

      setNearby({
        airports,
        restaurants,
        hotels,
        attractions,
      });
    } catch (e) {
      console.error("Overpass error:", e);
      setNearby({
        airports: [],
        restaurants: [],
        hotels: [],
        attractions: [],
      });
    } finally {
      setNearbyLoading(false);
    }
  };

  // -------------------------
  // High-level search: geocode -> image -> weather -> nearby
  // -------------------------
  const handleSearch = async (qParam) => {
    const q = typeof qParam === "string" ? qParam : query;
    if (!q || !q.trim()) return;
    setLoadingSearch(true);
    safeSetHistory(q);

    try {
      // Geocode using Nominatim
      const geoRes = await axios.get(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=1`
      );
      const place = geoRes.data?.[0];
      if (!place) {
        alert("Location not found");
        setLoadingSearch(false);
        return;
      }

      const latVal = parseFloat(place.lat);
      const lonVal = parseFloat(place.lon);
      setLat(latVal);
      setLon(lonVal);
      setZoom(13);

      // fetch image, weather and nearby in parallel
      fetchPlaceImage(place.display_name || q);
      fetchWeather(latVal, lonVal);
      fetchNearbyPlaces(latVal, lonVal, 2500);
    } catch (e) {
      console.error("Search error:", e);
      alert("Search failed. Check console.");
    } finally {
      setLoadingSearch(false);
    }
  };

  // -------------------------
  // Click to center on a nearby place
  // -------------------------
  const handleNearbyClick = (elem) => {
    if (!elem) return;
    setLat(elem.lat);
    setLon(elem.lon);
    setZoom(17);
    window.scrollTo({ top: 300, behavior: "smooth" });
  };

  // -------------------------
  // Travel Summary helpers
  // -------------------------
  const travelSummary = () => {
    // counts
    const aCnt = nearby.airports.length;
    const rCnt = nearby.restaurants.length;
    const hCnt = nearby.hotels.length;
    const tCnt = nearby.attractions.length;

    // best time heuristic (if weather has days)
    let best = "All year";
    if (weather?.days?.length) {
      // average upcoming day temps
      const temps = weather.days.slice(0, 7).map((d) => (d.tempmax + d.tempmin) / 2);
      const avg = temps.reduce((s, x) => s + x, 0) / temps.length;
      if (avg >= 26) best = "Nov → Feb (cooler)";
      else if (avg >= 18) best = "Oct → Mar";
      else best = "Apr → Sep (mild)";
    }

    // simple safety heuristic (based on number of attractions vs hotels)
    let safety = "Moderate";
    if (rCnt + hCnt + tCnt > 80) safety = "Good - well-served";
    if (rCnt + hCnt + tCnt < 10) safety = "Limited amenities";

    return {
      airports: aCnt,
      restaurants: rCnt,
      hotels: hCnt,
      attractions: tCnt,
      bestTime: best,
      safety,
    };
  };

  // -------------------------
  // Render helpers
  // -------------------------
  const WeatherCard = () => {
    if (!weather || !weather.currentConditions) return null;
    const cur = weather.currentConditions;
    const temp = Math.round(cur.temp);
    const cond = cur.conditions || cur.icon || "-";
    return (
      <div className="bg-white/90 dark:bg-gray-800 backdrop-blur rounded-xl p-4 shadow-md">
        <div className="flex flex-col sm:flex-row gap-4 items-center">
          <div className="flex items-center gap-4">
            <img
              src={`https://raw.githubusercontent.com/visualcrossing/WeatherIcons/main/PNG/2nd%20Set%20-%20Color/${cur.icon}.png`}
              alt="icon"
              onError={(e) => {
                e.target.style.display = "none";
              }}
              className="w-20 h-20"
            />
            <div>
              <div className="text-3xl font-bold">{temp}°C</div>
              <div className="text-sm text-gray-600 dark:text-gray-300 capitalize">{cond}</div>
            </div>
          </div>

          <div className="ml-auto grid grid-cols-2 gap-2 sm:grid-cols-3">
            <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg text-center">
              <div className="text-sm text-gray-600 dark:text-gray-300">Humidity</div>
              <div className="font-semibold">{cur.humidity}%</div>
            </div>
            <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg text-center">
              <div className="text-sm text-gray-600 dark:text-gray-300">Wind</div>
              <div className="font-semibold">{cur.windspeed} km/h</div>
            </div>
            <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg text-center">
              <div className="text-sm text-gray-600 dark:text-gray-300">UV</div>
              <div className="font-semibold">{cur.uvindex ?? "-"}</div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const SummaryCard = () => {
    const s = travelSummary();
    return (
      <div className="bg-white/90 dark:bg-gray-800 backdrop-blur rounded-xl p-4 shadow-md">
        <h3 className="text-lg font-bold mb-2">Travel Summary</h3>
        <div className="grid grid-cols-2 gap-2">
          <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded">
            <div className="text-sm text-gray-600 dark:text-gray-300">Airports</div>
            <div className="font-semibold">{s.airports}</div>
          </div>
          <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded">
            <div className="text-sm text-gray-600 dark:text-gray-300">Restaurants</div>
            <div className="font-semibold">{s.restaurants}</div>
          </div>
          <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded">
            <div className="text-sm text-gray-600 dark:text-gray-300">Hotels</div>
            <div className="font-semibold">{s.hotels}</div>
          </div>
          <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded">
            <div className="text-sm text-gray-600 dark:text-gray-300">Attractions</div>
            <div className="font-semibold">{s.attractions}</div>
          </div>
        </div>

        <div className="mt-3">
          <div className="text-sm text-gray-600 dark:text-gray-300">Best time to visit</div>
          <div className="font-semibold">{s.bestTime}</div>
          <div className="text-sm text-gray-600 dark:text-gray-300 mt-2">Amenities / Safety</div>
          <div className="font-semibold">{s.safety}</div>
        </div>
      </div>
    );
  };

  // -------------------------
  // UI
  // -------------------------
  return (
    <div className="pt-24 min-h-screen bg-gradient-to-b from-slate-100 to-white dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Search */}
        <div className="flex justify-center">
          <div className="w-full max-w-3xl">
            <div className="bg-white dark:bg-gray-800 p-3 rounded-full shadow-md flex items-center gap-2">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                placeholder="Search city, landmark or place (e.g. 'Eiffel Tower', 'Kolkata')"
                className="flex-1 bg-transparent px-4 py-3 outline-none text-gray-900 dark:text-gray-100 rounded-full"
              />
              <button
                onClick={() => handleSearch()}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-full flex items-center gap-2"
                aria-label="Search"
                disabled={loadingSearch}
              >
                <FaSearch />
                <span className="hidden sm:inline">Search</span>
              </button>
            </div>

            {/* history */}
            {searchHistory.length > 0 && (
              <div className="flex gap-2 mt-3 flex-wrap justify-center">
                {searchHistory.map((h, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setQuery(h);
                      handleSearch(h);
                    }}
                    className="px-3 py-1 bg-white/80 dark:bg-gray-700 rounded-full text-sm"
                  >
                    {h}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* IMAGE */}
        <div className="mt-6 rounded-xl overflow-hidden shadow-lg">
          {imageLoading ? (
            <div className="w-full h-64 md:h-[56vh] bg-gray-200 animate-pulse" />
          ) : placeImage ? (
            // responsive height: tall on desktop, moderate on small screens
            <img
              src={placeImage}
              alt={query}
              className="w-full h-64 md:h-[56vh] object-cover"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-64 md:h-[40vh] bg-gradient-to-r from-gray-200 to-gray-300 flex items-center justify-center text-gray-600">
              No image available
            </div>
          )}
        </div>

        {/* Two-column: Weather + Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
          <div>{weatherLoading ? <div className="p-4">Loading weather...</div> : <WeatherCard />}</div>
          <div><SummaryCard /></div>
        </div>

        {/* Nearby Places Grid */}
        <div className="mt-6">
          <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
            Nearby Places
          </h2>

          {nearbyLoading ? (
            <div className="p-4 bg-white/80 rounded-lg shadow">Searching nearby...</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Airports */}
              <div className="bg-white/90 dark:bg-gray-800 p-4 rounded-lg shadow">
                <div className="flex items-center gap-3 mb-2">
                  <FaUmbrellaBeach className="text-xl" />
                  <div>
                    <div className="text-sm text-gray-500">Airports</div>
                    <div className="font-semibold">{nearby.airports.length}</div>
                  </div>
                </div>
                <div className="space-y-2 max-h-44 overflow-auto">
                  {nearby.airports.slice(0, 6).map((p, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleNearbyClick(p)}
                      className="w-full text-left p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      <div className="text-sm font-medium">{p.tags?.name || "Airport"}</div>
                      <div className="text-xs text-gray-500">{(p.lat).toFixed(4)}, {(p.lon).toFixed(4)}</div>
                    </button>
                  ))}
                  {nearby.airports.length === 0 && <div className="text-sm text-gray-500">No airports found in radius.</div>}
                </div>
              </div>

              {/* Restaurants */}
              <div className="bg-white/90 dark:bg-gray-800 p-4 rounded-lg shadow">
                <div className="flex items-center gap-3 mb-2">
                  <FaUtensils className="text-xl" />
                  <div>
                    <div className="text-sm text-gray-500">Restaurants</div>
                    <div className="font-semibold">{nearby.restaurants.length}</div>
                  </div>
                </div>
                <div className="space-y-2 max-h-44 overflow-auto">
                  {nearby.restaurants.slice(0, 8).map((p, idx) => (
                    <button key={idx} onClick={() => handleNearbyClick(p)} className="w-full text-left p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700">
                      <div className="text-sm font-medium">{p.tags?.name || "Restaurant"}</div>
                      <div className="text-xs text-gray-500">{p.tags?.cuisine || ""}</div>
                    </button>
                  ))}
                  {nearby.restaurants.length === 0 && <div className="text-sm text-gray-500">No restaurants found in radius.</div>}
                </div>
              </div>

              {/* Hotels */}
              <div className="bg-white/90 dark:bg-gray-800 p-4 rounded-lg shadow">
                <div className="flex items-center gap-3 mb-2">
                  <FaHotel className="text-xl" />
                  <div>
                    <div className="text-sm text-gray-500">Hotels</div>
                    <div className="font-semibold">{nearby.hotels.length}</div>
                  </div>
                </div>
                <div className="space-y-2 max-h-44 overflow-auto">
                  {nearby.hotels.slice(0, 6).map((p, idx) => (
                    <button key={idx} onClick={() => handleNearbyClick(p)} className="w-full text-left p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700">
                      <div className="text-sm font-medium">{p.tags?.name || "Hotel"}</div>
                      <div className="text-xs text-gray-500">{p.tags?.stars ? `${p.tags.stars}★` : ""}</div>
                    </button>
                  ))}
                  {nearby.hotels.length === 0 && <div className="text-sm text-gray-500">No hotels found in radius.</div>}
                </div>
              </div>

              {/* Attractions */}
              <div className="bg-white/90 dark:bg-gray-800 p-4 rounded-lg shadow">
                <div className="flex items-center gap-3 mb-2">
                  <FaCity className="text-xl" />
                  <div>
                    <div className="text-sm text-gray-500">Attractions</div>
                    <div className="font-semibold">{nearby.attractions.length}</div>
                  </div>
                </div>
                <div className="space-y-2 max-h-44 overflow-auto">
                  {nearby.attractions.slice(0, 8).map((p, idx) => (
                    <button key={idx} onClick={() => handleNearbyClick(p)} className="w-full text-left p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700">
                      <div className="text-sm font-medium">{p.tags?.name || p.tags?.historic || "Attraction"}</div>
                      <div className="text-xs text-gray-500">{p.tags?.tourism || ""}</div>
                    </button>
                  ))}
                  {nearby.attractions.length === 0 && <div className="text-sm text-gray-500">No attractions found in radius.</div>}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Map */}
        <div className="mt-6">
          <h2 className="text-lg font-bold mb-3">Map</h2>
          <div className="rounded-xl overflow-hidden border">
            <iframe
              title="osm-map"
              src={mapSrc}
              className="w-full h-80 sm:h-[52vh] md:h-[62vh]"
              loading="lazy"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default SpotFinder;
