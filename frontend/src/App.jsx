import React, { useState } from "react";
import { useJsApiLoader } from "@react-google-maps/api";
import RouteSelector from "./components/RouteSelector";
import HazardSelector from "./components/HazardSelector";

const App = () => {
  // State to store an array of hazards
  const [hazards, setHazards] = useState([]);

  // Example function to handle reported hazards
  const handleReportHazard = (hazard) => {
    // Add the new hazard to our hazards array
    setHazards((prev) => [...prev, hazard]);
    console.log("New hazard reported:", hazard);
  };

  const { isLoaded } = useJsApiLoader({
    // Replace with your own API key
    googleMapsApiKey: "YOUR_API_KEY",
  });

  return (
    <div className="flex justify-center items-center h-screen bg-gray-100">
      <div className="w-[375px] h-[750px] bg-white rounded-[40px] shadow-lg border-4 border-black relative overflow-hidden">
        <div className="absolute top-3 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-100 rounded-full w-24 h-6 flex justify-center items-center shadow-lg text-white text-xs z-50">
          <span></span>
        </div>
        {/* Top bar for battery and Wi-Fi */}
        <div className="absolute top-0 left-0 right-0 h-12 bg-gray-800 bg-opacity-80 flex justify-between items-center px-4 text-white z-40">
          <div className="text-sm"> Hack Canada</div>
          <div className="flex space-x-2">
            <span className="text-white ">🔋 100%</span> {/* Battery icon */}
            <span className="text-white">📶 5G</span> {/* Wi-Fi icon */}
          </div>
        </div>

        {/* Render the RouteSelector, passing in hazards */}
        {/* The RouteSelector can now use hazards to avoid them when computing routes */}
        {isLoaded ? (
          <RouteSelector hazards={hazards} />
        ) : (
          <p className="p-4">Loading map...</p>
        )}

        {/* Bottom half: Hazard selector form */}
        <div className="h-1/2 p-4">
          {/* Pass the handleReportHazard function so HazardSelector can call it */}
          <HazardSelector onReportHazard={handleReportHazard} />
        </div>
      </div>
    </div>
  );
};

export default App;
