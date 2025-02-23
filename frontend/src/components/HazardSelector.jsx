import React, { useState } from "react";
import LocationSearch from "./LocationSearch"; // Import the LocationSearch component

const HazardSelector = () => {
  const [hazardType, setHazardType] = useState("");
  const [location, setLocation] = useState(null); // State for selected location

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!hazardType || !location) {
      alert("Please select a hazard and enter a location.");
      return;
    }

    // Ensure location has geometry data
    if (!location.geometry || !location.geometry.location) {
      console.error("Invalid location object:", location);
      alert("Invalid location. Please try again.");
      return;
    }

    // Convert address to coordinates
    const lat = location.geometry.location.lat();
    const lng = location.geometry.location.lng();

    // Send data to the backend
    const response = await fetch("http://127.0.0.1:8000/report-condition/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        lat: lat,
        lng: lng,
        condition: hazardType,
      }),
    });

    if (response.ok) {
      const data = await response.json();
      console.log("Condition reported with ID:", data.id);
      // Optionally, you can reset the form or show a success message
    } else {
      console.error("Error reporting condition");
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="p-4 bg-gray-100 rounded-lg shadow-md flex flex-col"
    >
      <h2 className="mb-2">Report a Hazard</h2>
      <select
        id="hazard"
        value={hazardType}
        onChange={(e) => setHazardType(e.target.value)}
        className="mb-2 p-2 border rounded"
      >
        <option value="">-- Please choose a hazard --</option>
        <option value="Icey">Icey</option>
        <option value="Blockage">Blockage</option>
        <option value="Other">Other</option>
      </select>

      <LocationSearch label="Enter location" onPlaceSelected={setLocation} />

      <button type="submit" className="bg-blue-500 text-white p-2 rounded">
        Submit
      </button>
    </form>
  );
};

export default HazardSelector;
