import React, { useState, useRef, useEffect } from 'react';
import search_icon from "../assets/search.png";

const SearchBar = ({ onSearch }) => {
    const [query, setQuery] = useState('');
    const [suggestions, setSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const inputRef = useRef();
    const suggestionRef = useRef();

    const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
    const GEOAPIFY_KEY = import.meta.env.VITE_GEOAPIFY_KEY;

    /* ---------------------------------------------------------
       🌟 Auto-Correct using Gemini (Fix Spelling / Spot Name)
    --------------------------------------------------------- */
    const autoCorrectPlace = async (text) => {
        try {
            const response = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        contents: [
                            {
                                parts: [
                                    {
                                        text: `Correct this place name to a real-world city, tourist spot, or landmark. 
Return ONLY the corrected name without extra text.

Input: "${text}"`
                                    }
                                ]
                            }
                        ]
                    })
                }
            );

            const result = await response.json();
            const corrected = result?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

            return corrected || text;
        } catch (error) {
            console.error("Gemini autocorrect failed:", error);
            return text; // fallback
        }
    };

    /* ---------------------------------------------------------
       🌟 Geoapify City Suggestion API
    --------------------------------------------------------- */
    const fetchSuggestions = async (input) => {
        if (!input.trim() || input.length < 2) {
            setSuggestions([]);
            return;
        }

        try {
            const response = await fetch(
                `https://api.geoapify.com/v1/geocode/autocomplete?text=${input}&type=city&format=json&apiKey=${GEOAPIFY_KEY}`
            );
            const data = await response.json();

            const formatted = data.results.map(place => ({
                city: place.city || place.name,
                country: place.country,
                state: place.state,
                formatted: `${place.city || place.name}${place.state ? `, ${place.state}` : ''}, ${place.country}`
            })).slice(0, 5);

            setSuggestions(formatted);
            setShowSuggestions(true);
        } catch (error) {
            console.error('Error fetching suggestions:', error);
        }
    };

    /* ---------------------------------------------------------
       🌟 Handle input change + suggestions
    --------------------------------------------------------- */
    const handleInputChange = (e) => {
        const value = e.target.value;
        setQuery(value);
        fetchSuggestions(value);
    };

    /* ---------------------------------------------------------
       🌟 On selecting suggestion
    --------------------------------------------------------- */
    const handleSuggestionClick = async (suggestion) => {
        setQuery(suggestion.formatted);
        setSuggestions([]);
        setShowSuggestions(false);
        onSearch(suggestion.city);
    };

    /* ---------------------------------------------------------
       🌟 Search button + Enter key triggers this
       Includes Auto-Correct (Gemini)
    --------------------------------------------------------- */
    const handleSearch = async () => {
        if (!query.trim()) return;

        const corrected = await autoCorrectPlace(query);

        setQuery(corrected);
        onSearch(corrected);
        setShowSuggestions(false);
    };

    /* ---------------------------------------------------------
       🌟 Enter Key = Search
    --------------------------------------------------------- */
    const handleKeyDown = (e) => {
        if (e.key === "Enter") {
            handleSearch();
        }
    };

    /* ---------------------------------------------------------
       Close suggestions on outside click
    --------------------------------------------------------- */
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (suggestionRef.current && !suggestionRef.current.contains(event.target)) {
                setShowSuggestions(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    /* ---------------------------------------------------------
       ⭐ UI STARTS HERE
    --------------------------------------------------------- */
    return (
        <div className="relative w-full max-w-xl mx-auto mt-4" ref={suggestionRef}>
            
            {/* Search Box */}
            <div className="flex items-center bg-white rounded-xl shadow-md border px-4 py-2 transition-all duration-200 hover:shadow-lg">

                <img
                    src={search_icon}
                    alt="search"
                    className="w-6 h-6 mr-3 cursor-pointer opacity-70 hover:opacity-100"
                    onClick={handleSearch}
                />

                <input
                    type="text"
                    value={query}
                    ref={inputRef}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    placeholder="Search city / landmark / tourist spot"
                    className="flex-1 text-gray-800 text-lg focus:outline-none"
                />
            </div>

            {/* Suggestions Dropdown */}
            {showSuggestions && suggestions.length > 0 && (
                <div className="absolute top-full mt-2 w-full bg-white rounded-lg shadow-xl z-50 border max-h-64 overflow-y-auto animate-fadeIn">

                    {suggestions.map((s, idx) => (
                        <div
                            key={idx}
                            onClick={() => handleSuggestionClick(s)}
                            className="px-4 py-3 cursor-pointer text-gray-800 hover:bg-gray-100"
                        >
                            {s.formatted}
                        </div>
                    ))}

                </div>
            )}
        </div>
    );
};

export default SearchBar;
