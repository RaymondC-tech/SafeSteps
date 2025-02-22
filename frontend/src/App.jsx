import React, { useState } from "react";
import MapComponent from "./components/MapComponent";
import { useJsApiLoader } from "@react-google-maps/api";

const App = () => {
  const [avoidSlippery, setAvoidSlippery] = useState(false);

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: "AIzaSyAHYFZVXwwXhEVEDj6uYOIRs21bNn6_FEE",
  });

  return (
    <div className="flex justify-center items-center h-screen bg-gray-100">
      <div className="w-[375px] h-[700px] bg-white rounded-[40px] shadow-lg border-4 border-black relative overflow-hidden">
        {/* Map takes up the top half */}
        <div className="h-1/2">
          {isLoaded ? (
            <MapComponent avoidSlippery={avoidSlippery} />
          ) : (
            <p>Loading map...</p>
          )}
        </div>

        {/* Form takes the bottom half */}
        <div className="h-1/2 p-4">
        </div>
      </div>
    </div>
  );
};

export default App;
