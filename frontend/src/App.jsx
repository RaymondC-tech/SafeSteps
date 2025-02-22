import React, { useState } from "react";
import MapComponent from "./components/MapComponent";
import { useJsApiLoader } from "@react-google-maps/api";
import FormComponent from "./components/FormComponent";
import HazardSelector from "./components/HazardSelector";

import FirstSearchBar from "./components/FirstSearchBar";
import SecondSearchBar from "./components/SecondSearchBar";

import RouteSelector from "./components/RouteSelector";

const App = () => {
  const [avoidSlippery, setAvoidSlippery] = useState(false);

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: "AIzaSyAHYFZVXwwXhEVEDj6uYOIRs21bNn6_FEE",
  });

  return (
    <div className="flex justify-center items-center h-screen bg-gray-100">
      <div className="w-[375px] h-[750px] bg-white rounded-[40px] shadow-lg border-4 border-black relative overflow-hidden">
        {/* Top bar for battery and Wi-Fi */}
        <div className="absolute top-0 left-0 right-0 h-10 bg-gray-800 flex justify-between items-center px-4 text-white">
          <div className="text-sm">Fido</div>
          <div className="flex space-x-2">
            <span className="text-white">🔋 100%</span> {/* Battery icon */}
            <span className="text-white">📶 5G</span> {/* Wi-Fi icon */}
          </div>
        </div>

        <RouteSelector />

        {/* <FirstSearchBar />
        <SecondSearchBar /> */}

        {/* Map takes up the top half */}
        <div className="h-1/2 mt-12">
          {" "}
          {/* Added margin-top to avoid overlap with the top bar */}
          {isLoaded ? (
            <MapComponent avoidSlippery={avoidSlippery} />
          ) : (
            <p>Loading map...</p>
          )}
        </div>

        {/* Form takes the bottom half */}
        <div className="h-1/2 p-4">
          {/* <FormComponent setAvoidSlippery={setAvoidSlippery} /> */}
          <HazardSelector />
        </div>
      </div>
    </div>
  );
};

export default App;
