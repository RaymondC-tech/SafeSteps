import React, { useState } from "react";
import MapComponent from "./components/MapComponent";
import RouteInputComponent from "./components/RouteInputComponent";
import FormComponent from "./components/FormComponent";
import { useJsApiLoader } from "@react-google-maps/api";

const libraries = ["places"]; // Define libraries as a constant

const App = () => {
  const [routeData, setRouteData] = useState({ start: "", end: "" });
  const [hazardLocation, setHazardLocation] = useState(null);
  const [avoidSlippery, setAvoidSlippery] = useState(false);

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: "AIzaSyAHYFZVXwwXhEVEDj6uYOIRs21bNn6_FEE", // Replace with your actual API key
    libraries, // Use the constant here
  });

  return (
    <div className="flex justify-center items-center h-screen bg-gray-100">
      <div className="w-[375px] h-[700px] bg-white rounded-[40px] shadow-lg border-4 border-black relative overflow-hidden">
        {/* Top bar for battery and Wi-Fi */}
        <div className="absolute top-0 left-0 right-0 h-12 bg-gray-800 flex justify-between items-center px-4 text-white">
          <div className="text-sm">Fido</div>
          <div className="flex space-x-2">
            <span className="text-white">🔋 100%</span> {/* Battery icon */}
            <span className="text-white">📶 5G</span> {/* Wi-Fi icon */}
          </div>
        </div>

        {/* Form Component - Takes up 1/3 of the top */}
        <div className="h-1/3 p-4">
          <FormComponent setHazardLocation={setHazardLocation} />
        </div>

        {/* Route Input Component - Takes up 1/4 of the space */}
        <div className="h-1/4 p-4">
          <RouteInputComponent setRouteData={setRouteData} />
        </div>

        {/* Map Component - Takes up the remaining space */}
        <div className="h-1/2 mt-2">
          {isLoaded ? (
            <MapComponent routeData={routeData} avoidSlippery={avoidSlippery} hazardLocation={hazardLocation} />
          ) : (
            <p>Loading map...</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default App;