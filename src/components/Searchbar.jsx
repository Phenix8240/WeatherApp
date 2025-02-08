import React, { useState, useRef, useEffect } from 'react';
import search_icon from "../assets/search.png";

const SearchBar = ({ onSearch }) => {
    const [query, setQuery] = useState('');
    const [suggestions, setSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const inputRef = useRef();
    const suggestionRef = useRef();

    // Function to fetch city suggestions
    const fetchSuggestions = async (input) => {
        if (!input.trim() || input.length < 2) {
            setSuggestions([]);
            return;
        }

        try {
            // Using Geoapify API (free tier)
            const response = await fetch(
                `https://api.geoapify.com/v1/geocode/autocomplete?text=${input}&type=city&format=json&apiKey=YOUR_GEOAPIFY_API_KEY`
            );
            const data = await response.json();

            // Format suggestions
            const formattedSuggestions = data.results.map(place => ({
                city: place.city || place.name,
                country: place.country,
                state: place.state,
                formatted: `${place.city || place.name}${place.state ? `, ${place.state}` : ''}, ${place.country}`
            })).slice(0, 5); // Limit to 5 suggestions

            setSuggestions(formattedSuggestions);
            setShowSuggestions(true);
        } catch (error) {
            console.error('Error fetching suggestions:', error);
        }
    };

    // Handle input change
    const handleInputChange = (e) => {
        const value = e.target.value;
        setQuery(value);
        fetchSuggestions(value);
    };

    // Handle suggestion click
    const handleSuggestionClick = (suggestion) => {
        setQuery(suggestion.formatted);
        setSuggestions([]);
        setShowSuggestions(false);
        onSearch(suggestion.city);
    };

    // Close suggestions when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (suggestionRef.current && !suggestionRef.current.contains(event.target)) {
                setShowSuggestions(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    return (
        <div className="search_bar relative" ref={suggestionRef}>
            <input
                type="text"
                ref={inputRef}
                value={query}
                onChange={handleInputChange}
                placeholder='Enter City for Search'
                className="w-full p-2 rounded-lg"
            />
            <img
                src={search_icon}
                alt="search"
                onClick={() => onSearch(query)}
                className="cursor-pointer"
            />
            
            {/* Suggestions Dropdown */}
            {showSuggestions && suggestions.length > 0 && (
                <div className="absolute top-full left-0 w-full mt-1 bg-white rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
                    {suggestions.map((suggestion, index) => (
                        <div
                            key={index}
                            className="p-3 hover:bg-gray-100 cursor-pointer text-gray-800"
                            onClick={() => handleSuggestionClick(suggestion)}
                        >
                            {suggestion.formatted}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default SearchBar;