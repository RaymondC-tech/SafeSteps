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

    
    const route1 = {
      origin: { lat: 43.70011, lng: -79.4163 }, 
      destination: { lat: 43.6532, lng: -79.3832 }, 
      travelMode: window.google.maps.TravelMode.WALKING,
    };

    
    const route2 = {
      origin: { lat: 43.70011, lng: -79.4163 },
      destination: { lat: 43.6532, lng: -79.3832 },
      waypoints: [{ location: { lat: 43.6800, lng: -79.4000 } }], 
      travelMode: window.google.maps.TravelMode.WALKING,
    };

    
    directionsService.route(avoidSlippery ? route2 : route1, (result, status) => {
      if (status === "OK") {
        setDirections(result);
      }
    });

    
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