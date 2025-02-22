import React, { useEffect, useState } from "react";
import { GoogleMap, DirectionsRenderer, Marker } from "@react-google-maps/api";

const containerStyle = {
  width: "100%",
  height: "100%", // Full height for the map
};

const center = { lat: 43.70011, lng: -79.4163 }; // Toronto

const MapComponent = ({ avoidSlippery }) => {
  const [directions, setDirections] = useState(null);
  const [markers, setMarkers] = useState([]);

  useEffect(() => {
    const directionsService = new window.google.maps.DirectionsService();

    // Hardcoded Route 1 (Normal Route)
    const route1 = {
      origin: { lat: 43.70011, lng: -79.4163 }, // Toronto Start
      destination: { lat: 43.6532, lng: -79.3832 }, // Toronto End
      travelMode: window.google.maps.TravelMode.WALKING,
    };

    // Hardcoded Route 2 (Alternative Route if Slippery)
    const route2 = {
      origin: { lat: 43.70011, lng: -79.4163 },
      destination: { lat: 43.6532, lng: -79.3832 },
      waypoints: [{ location: { lat: 43.6800, lng: -79.4000 } }], // Simulating alternative path
      travelMode: window.google.maps.TravelMode.WALKING,
    };

    // Choose route based on `avoidSlippery` state
    directionsService.route(avoidSlippery ? route2 : route1, (result, status) => {
      if (status === "OK") {
        setDirections(result);
      }
    });

    // If user submits slippery road, add a warning marker
    if (avoidSlippery) {
      setMarkers([{ lat: 43.690, lng: -79.405, label: "⚠️ Slippery Road" }]);
    } else {
      setMarkers([]);
    }
  }, [avoidSlippery]);

  return (
    <GoogleMap
      mapContainerStyle={containerStyle}
      center={center}
      zoom={14} // Zoom level to see street names
      options={{ disableDefaultUI: false, gestureHandling: "auto" }} // Allow interactions
    >
      {directions && <DirectionsRenderer directions={directions} options={{ polylineOptions: { strokeColor: avoidSlippery ? "red" : "blue" } }} />}
      {markers.map((marker, index) => (
        <Marker key={index} position={marker} label={marker.label} />
      ))}
    </GoogleMap>
  );
};

export default MapComponent; 