import React, { useState } from "react";
import { Link } from "react-router-dom";

const Navbar = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const toggleMenu = () => {
        setIsMenuOpen(!isMenuOpen);
    };

    return (
        <nav
            className="p-4 shadow-lg fixed top-0 w-full z-50 bg-slate-50"

        >
            <div className="container mx-auto flex justify-between items-center">
                {/* Logo */}
                <Link
                    to="/"
                    className="font-serif text-2xl font-bold"
                    style={{
                        background: "linear-gradient(43deg, #4158D0 0%, #C850C0 46%, #FFCC70 100%)",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                        display: "inline-block",
                    }}
                >
                    WeatherApp
                </Link>

                {/* Hamburger Menu (Mobile) */}
                <button
                    onClick={toggleMenu}
                    className="text-black font-serif  lg:hidden focus:outline-none"
                >
                    <svg
                        className="w-6 h-6"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M4 6h16M4 12h16m-7 6h7"
                        ></path>
                    </svg>
                </button>

                {/* Nav Links (Desktop) */}
                <div className="hidden lg:flex space-x-6">
                    <Link to="/" className="text-black font-serif  hover:text-gray-800 font-semibold">
                        Weather
                    </Link>
                    <Link to="/location" className="text-black font-serif  hover:text-gray-800 font-semibold">
                        Location Intelligence
                    </Link>
                    <Link to="/business" className="text-black font-serif  hover:text-gray-800 font-semibold">
                        Business Insights
                    </Link>
                </div>
            </div>

            {/* Mobile Menu (Collapsible) */}
            <div className={`${isMenuOpen ? "block" : "hidden"} lg:hidden mt-4`}>
                <Link
                    to="/"
                    className="block text-black font-serif  py-2 hover:bg-opacity-50"
                    onClick={toggleMenu}
                >
                    Weather
                </Link>
                <Link
                    to="/location"
                    className="block text-black font-serif  py-2 hover:bg-opacity-50"
                    onClick={toggleMenu}
                >
                    Location Intelligence
                </Link>
                <Link
                    to="/business"
                    className="block text-black font-serif  py-2 hover:bg-opacity-50"
                    onClick={toggleMenu}
                >
                    Business Insights
                </Link>
            </div>
        </nav>
    );
};

export default Navbar;
