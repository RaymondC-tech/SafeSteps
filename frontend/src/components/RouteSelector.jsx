import React, { useState, useEffect, useRef } from "react";
import LocationSearch from "./LocationSearch";
import Modal from "./Modal"; // Import your modal component

export default function RouteSelector({ hazards = [] }) {
  const [startLocation, setStartLocation] = useState(null);
  const [endLocation, setEndLocation] = useState(null);
  const [finalRoute, setFinalRoute] = useState(null);
  const [notice, setNotice] = useState("");
  const [useDetourColor, setUseDetourColor] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const routeRendererRef = useRef(null);
  const infoWindowRef = useRef(null);
  const directionsServiceRef = useRef(null);

  const hazardMarkersRef = useRef([]);
  const hazardCirclesRef = useRef([]);
  const detourMarkersRef = useRef([]);

  useEffect(() => {
    if (window.google && mapRef.current && !mapInstanceRef.current) {
      mapInstanceRef.current = new window.google.maps.Map(mapRef.current, {
        center: { lat: 43.47511, lng: -80.5295 },
        zoom: 14,
      });
      routeRendererRef.current = new window.google.maps.DirectionsRenderer({
        polylineOptions: { strokeColor: "blue", strokeWeight: 5 },
        preserveViewport: false,
      });
      routeRendererRef.current.setMap(mapInstanceRef.current);

      infoWindowRef.current = new window.google.maps.InfoWindow({
        content: "",
        position: mapInstanceRef.current.getCenter(),
      });

      directionsServiceRef.current = new window.google.maps.DirectionsService();
    }
  }, []);

  // ... Helpers and other logic omitted for brevity ...

  const handleGetDirections = async () => {
    if (!startLocation || !endLocation) {
      alert("Please select both a start and end location.");
      return;
    }
    // Clear old route & markers
    setFinalRoute(null);
    setUseDetourColor(false);
    setNotice("Finding safe route with circle approach...");
    detourMarkersRef.current.forEach((m) => m.setMap(null));
    detourMarkersRef.current = [];

    const baseRequest = {
      origin: startLocation.geometry.location,
      destination: endLocation.geometry.location,
      travelMode: window.google.maps.TravelMode.WALKING,
    };

    try {
      // ... your route logic ...
    } catch (err) {
      setNotice("");
      alert("No route found: " + err);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.controls}>
        {/* Header container with relative positioning */}
        <div style={styles.headerContainer}>
          {/* Absolutely positioned profile picture on the left */}
          <img
            src="/images/profile.png"
            alt="Profile"
            style={styles.profilePic}
            onClick={() => setIsModalOpen(true)}
          />
          {/* Absolutely centered heading */}
          <h2 style={styles.heading}>🚶‍♂️ SafeWalk</h2>
        </div>

        <LocationSearch
          label="Start Location"
          onPlaceSelected={setStartLocation}
        />
        <LocationSearch
          label="End Location"
          onPlaceSelected={setEndLocation}
        />
        <button onClick={handleGetDirections} style={styles.button}>
          Get Walking Directions
        </button>
      </div>

      <div ref={mapRef} style={styles.mapContainer} />
      {isModalOpen && <Modal onClose={() => setIsModalOpen(false)} />}
    </div>
  );
}

const styles = {
  container: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    marginTop: "10px",
    position: "relative",
  },
  controls: {
    backgroundColor: "rgba(50, 50, 50, 0.4)",
    backdropFilter: "blur(10px)",
    borderRadius: "10px",
    boxShadow: "0px 4px 8px rgba(0, 0, 0, 0.3)",
    zIndex: 1000,
    position: "absolute",
    top: "96px",
    left: "50%",
    transform: "translateX(-50%)",
    padding: "10px",
  },
  /* 
    This container will be the full width of the controls,
    so the heading can be centered within it.
  */
  headerContainer: {
    position: "relative",
    width: "100%",
    height: "50px", // Ensure enough height so the image & heading don't overlap
  },
  /* 
    Profile picture pinned to the left with absolute positioning.
    Center it vertically by using top: 50% & transform: translateY(-50%).
  */
  profilePic: {
    position: "absolute",
    left: 0,
    top: "50%",
    transform: "translateY(-50%)",
    width: "40px",
    height: "40px",
    borderRadius: "50%",
    cursor: "pointer",
  },
  /*
    Heading absolutely centered in the container.
    left: 50% & transform: translateX(-50%) horizontally center the text.
    top: 50% & translateY(-50%) vertically center it as well.
  */
  heading: {
    position: "absolute",
    left: "50%",
    top: "50%",
    transform: "translate(-50%, -50%)",
    fontSize: "14px",
    fontWeight: "bold",
    fontFamily: "Arial, sans-serif",
    color: "#000",
    textTransform: "uppercase",
    letterSpacing: "1px",
    textShadow: "1px 1px 2px rgba(0, 0, 0, 0.2)",
    borderBottom: "3px solid #007BFF",
    paddingBottom: "3px",
    margin: 0,
  },
  button: {
    padding: "8px 12px",
    fontSize: "12px",
    backgroundColor: "#007BFF",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    margin: "10px auto",
    display: "block",
    width: "50%",
    maxWidth: "250px",
  },
  mapContainer: {
    width: "100%",
    maxWidth: "500px",
    marginTop: "35px",
    height: "701px",
    position: "relative",
    zIndex: 1,
    borderTop: "2px solid #000",
    borderBottom: "2px solid #000",
  },
};
