import React, { useState } from "react";

const RouteInputComponent = ({ setRouteData }) => {
  const [startLocation, setStartLocation] = useState("");
  const [endLocation, setEndLocation] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    // Pass the start and end locations to the parent component
    setRouteData({ start: startLocation, end: endLocation });
    // Clear the input fields
    setStartLocation("");
    setEndLocation("");
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-center p-4 bg-gray-200 rounded-lg shadow-md">
      <input
        type="text"
        className="flex-grow p-2 border rounded mr-2"
        placeholder="Starting Location"
        value={startLocation}
        onChange={(e) => setStartLocation(e.target.value)}
      />
      <input
        type="text"
        className="flex-grow p-2 border rounded mr-2"
        placeholder="Destination Location"
        value={endLocation}
        onChange={(e) => setEndLocation(e.target.value)}
      />
      <button type="submit" className="bg-blue-500 text-white p-2 rounded">
        Get Route
      </button>
    </form>
  );
};

export default RouteInputComponent; 