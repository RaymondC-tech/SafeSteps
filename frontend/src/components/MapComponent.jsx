import React, { useEffect, useState } from "react";
import { GoogleMap, DirectionsRenderer, Marker } from "@react-google-maps/api";

const containerStyle = {
  width: "100%",
  height: "100%", // Full height for the map
};

const center = { lat: 43.70011, lng: -79.4163 }; // Toronto

const MapComponent = ({ routeData, avoidSlippery, hazardLocation }) => {
  const [directions, setDirections] = useState(null);
  const [markers, setMarkers] = useState([]);

  useEffect(() => {
    const directionsService = new window.google.maps.DirectionsService();

    if (routeData.start && routeData.end) {
      const request = {
        origin: routeData.start,
        destination: routeData.end,
        travelMode: window.google.maps.TravelMode.DRIVING,
        waypoints: [],
        avoidTolls: true, // Avoid toll roads
      };

      directionsService.route(request, (result, status) => {
        if (status === "OK") {
          setDirections(result);
        } else {
          console.error("Error fetching directions: ", status);
        }
      });
    }

    // Add hazard marker if hazardLocation is provided
    if (hazardLocation) {
      setMarkers([{ lat: hazardLocation.lat, lng: hazardLocation.lng, label: "⚠️ Hazard" }]);
    }
  }, [routeData, avoidSlippery, hazardLocation]);

  return (
    <GoogleMap
      mapContainerStyle={containerStyle}
      center={center}
      zoom={14} 
      options={{ disableDefaultUI: false, gestureHandling: "auto" }} 
    >
      {directions && <DirectionsRenderer directions={directions} options={{ polylineOptions: { strokeColor: avoidSlippery ? "red" : "blue" } }} />}
      {markers.map((marker, index) => (
        <Marker key={index} position={marker} label={marker.label} />
      ))}
    </GoogleMap>
  );
};

export default MapComponent; 