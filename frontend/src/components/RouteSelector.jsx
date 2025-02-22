import React, { useState, useEffect, useRef } from "react";
import LocationSearch from "./LocationSearch";

/**
 * Renders a map and allows users to select a start and end location
 * via the LocationSearch component. On "Get Directions," displays
 * a walking route on the map.
 */
export default function RouteSelector() {
  const [startLocation, setStartLocation] = useState(null);
  const [endLocation, setEndLocation] = useState(null);

  const mapRef = useRef(null); // DOM reference for the map container
  const mapInstanceRef = useRef(null); // Holds the Google Map instance
  const directionsRendererRef = useRef(null); // Holds the DirectionsRenderer instance

  // Initialize the map and directions renderer once the component mounts
  useEffect(() => {
    if (window.google && mapRef.current) {
      // Create a new map instance centered at an arbitrary location (e.g., Times Square)
      mapInstanceRef.current = new window.google.maps.Map(mapRef.current, {
        center: { lat: 43.47511, lng: -80.5295 },
        zoom: 14,
      });

      // Create a DirectionsRenderer and attach it to our map
      directionsRendererRef.current =
        new window.google.maps.DirectionsRenderer();
      directionsRendererRef.current.setMap(mapInstanceRef.current);
    }
  }, []);

  const handleGetDirections = () => {
    if (!startLocation || !endLocation) {
      alert("Please select both a start and an end location.");
      return;
    }

    // Create a DirectionsService instance to fetch the route
    const directionsService = new window.google.maps.DirectionsService();

    directionsService.route(
      {
        origin: startLocation.geometry.location,
        destination: endLocation.geometry.location,
        travelMode: window.google.maps.TravelMode.WALKING, // <--- Use walking mode
      },
      (result, status) => {
        if (status === window.google.maps.DirectionsStatus.OK) {
          // Render the route on the map
          directionsRendererRef.current.setDirections(result);
          console.log("Directions result:", result);
        } else {
          console.error("Error fetching directions", result);
          alert("Could not fetch walking directions.");
        }
      }
    );
  };

  return (
    <div style={styles.container}>
      <div style={styles.controls}>
        <h2>Walking Route Planner</h2>
        <LocationSearch
          label="Start Location"
          onPlaceSelected={setStartLocation}
        />
        <LocationSearch label="End Location" onPlaceSelected={setEndLocation} />
        <button onClick={handleGetDirections} style={styles.button}>
          Get Walking Directions
        </button>
      </div>
      <div ref={mapRef} style={styles.mapContainer} />
    </div>
  );
}

const styles = {
  container: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },
  controls: {
    width: "100%",
    maxWidth: "500px",
    padding: "20px",
    textAlign: "center",
  },
  button: {
    padding: "10px 20px",
    fontSize: "16px",
    backgroundColor: "#007BFF",
    color: "#fff",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    marginTop: "10px",
  },
  mapContainer: {
    width: "100%",
    maxWidth: "800px",
    height: "500px",
    marginTop: "20px",
  },
};
