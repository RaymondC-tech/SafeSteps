import React, { useState, useEffect, useRef } from "react";
import LocationSearch from "./LocationSearch";
import Modal from "./Modal"; // <-- ADDED: import your modal component

/* ============ Helpers ============ */

/**
 * Return how many hazards the route's overview_path intersects.
 * We do a simple check: if any route point is within hazard.radius
 */
function countHazardIntersections(routePoints, hazards) {
  let total = 0;
  for (const hazard of hazards) {
    const hazardLatLng = new window.google.maps.LatLng(hazard.lat, hazard.lng);
    const radius = hazard.radius || 20;
    // If any route point is within 'radius' meters, we consider it an intersection
    const intersects = routePoints.some((pt) => {
      const dist = window.google.maps.geometry.spherical.computeDistanceBetween(
        new window.google.maps.LatLng(pt.lat(), pt.lng()),
        hazardLatLng
      );
      return dist < radius;
    });
    if (intersects) total++;
  }
  return total;
}

/**
 * Generate circle waypoints around a hazard center at a given radiusInMeters.
 * angleStep determines how many candidate points we produce (e.g. 30 -> 12 points).
 */
function generateCircleWaypoints(hazard, radiusInMeters, angleStep = 30) {
  const centerLat = hazard.lat;
  const centerLng = hazard.lng;
  const latConversion = 111111;
  const lngConversion = 111111 * Math.cos(centerLat * (Math.PI / 180));

  const candidates = [];
  for (let deg = 0; deg < 360; deg += angleStep) {
    const rad = (deg * Math.PI) / 180;
    const offsetLat = (radiusInMeters * Math.cos(rad)) / latConversion;
    const offsetLng = (radiusInMeters * Math.sin(rad)) / lngConversion;
    const lat = centerLat + offsetLat;
    const lng = centerLng + offsetLng;
    candidates.push({ lat, lng });
  }
  return candidates;
}

/* ============ End Helpers ============ */

export default function RouteSelector({ hazards = [] }) {
  // ADDED: state for modal visibility
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [startLocation, setStartLocation] = useState(null);
  const [endLocation, setEndLocation] = useState(null);
  const [finalRoute, setFinalRoute] = useState(null);
  const [notice, setNotice] = useState("");
  const [useDetourColor, setUseDetourColor] = useState(false);

  const startMarkerRef = useRef(null);
  const endMarkerRef = useRef(null);

  // Map references
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const routeRendererRef = useRef(null);
  const infoWindowRef = useRef(null);
  const directionsServiceRef = useRef(null);

  // Hazard markers/circles
  const hazardMarkersRef = useRef([]);
  const hazardCirclesRef = useRef([]);

  // Markers for each chosen waypoint
  const detourMarkersRef = useRef([]);

  // Initialize map, DirectionsRenderer, InfoWindow, DirectionsService
  useEffect(() => {
    if (window.google && mapRef.current && !mapInstanceRef.current) {
      mapInstanceRef.current = new window.google.maps.Map(mapRef.current, {
        center: { lat: 43.47511, lng: -80.5295 },
        zoom: 14,
      });
      routeRendererRef.current = new window.google.maps.DirectionsRenderer({
        polylineOptions: { strokeColor: "blue", strokeWeight: 5 },
        preserveViewport: false,
        suppressMarkers: true,
      });
      routeRendererRef.current.setMap(mapInstanceRef.current);

      infoWindowRef.current = new window.google.maps.InfoWindow({
        content: "",
        position: mapInstanceRef.current.getCenter(),
      });

      directionsServiceRef.current = new window.google.maps.DirectionsService();
    }
  }, []);

  // Render final route
  useEffect(() => {
    if (finalRoute && routeRendererRef.current) {

      if (
        finalRoute &&
        routeRendererRef.current &&
        startLocation &&
        endLocation
      ) {
        // Clear old custom markers
        if (startMarkerRef.current) {
          startMarkerRef.current.setMap(null);
        }
        if (endMarkerRef.current) {
          endMarkerRef.current.setMap(null);
        }
        // Create new markers and save them in refs
        startMarkerRef.current = new window.google.maps.Marker({
          position: startLocation.geometry.location,
          map: mapInstanceRef.current,
          label: "A",
        });
        endMarkerRef.current = new window.google.maps.Marker({
          position: endLocation.geometry.location,
          map: mapInstanceRef.current,
          label: "B",
        });

        // Render route and fit map
        routeRendererRef.current.setDirections(finalRoute);
        routeRendererRef.current.setOptions({
          polylineOptions: {
            strokeColor: useDetourColor ? "red" : "blue",
            strokeWeight: 5,
          },
        });
        const bounds = new window.google.maps.LatLngBounds();
        finalRoute.routes[0].overview_path.forEach((pt) => bounds.extend(pt));
        mapInstanceRef.current.fitBounds(bounds);
      }

    }
  }, [finalRoute, startLocation, endLocation, useDetourColor]);

  // Show/hide notice
  useEffect(() => {
    if (!infoWindowRef.current || !mapInstanceRef.current) return;
    if (notice) {
      infoWindowRef.current.setContent(
        `<div style="padding:8px;font-weight:bold;">${notice}</div>`
      );
      infoWindowRef.current.setPosition(mapInstanceRef.current.getCenter());
      infoWindowRef.current.open(mapInstanceRef.current);
    } else {
      infoWindowRef.current.close();
    }
  }, [notice]);

  // Draw hazard markers & circles
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    hazardMarkersRef.current.forEach((m) => m.setMap(null));
    hazardMarkersRef.current = [];
    hazardCirclesRef.current.forEach((c) => c.setMap(null));
    hazardCirclesRef.current = [];

    hazards.forEach((hazard) => {
      const marker = new window.google.maps.Marker({
        position: { lat: hazard.lat, lng: hazard.lng },
        map: mapInstanceRef.current,
        label: hazard.type,
      });
      hazardMarkersRef.current.push(marker);

      const circle = new window.google.maps.Circle({
        map: mapInstanceRef.current,
        center: { lat: hazard.lat, lng: hazard.lng },
        radius: hazard.radius || 20,
        fillColor: "#FF0000",
        fillOpacity: 0.2,
        strokeColor: "#FF0000",
        strokeOpacity: 0.8,
        strokeWeight: 2,
      });
      hazardCirclesRef.current.push(circle);
    });
  }, [hazards]);

  // Promisify route call
  function getRoute(request) {
    return new Promise((resolve, reject) => {
      directionsServiceRef.current.route(request, (result, status) => {
        if (status === window.google.maps.DirectionsStatus.OK) {
          resolve(result);
        } else {
          reject("Directions request failed");
        }
      });
    });
  }

  async function fixHazardWithCircle(
    hazard,
    baseRequest,
    minRadius = 30,
    maxRadius = 200
  ) {
    let radius = minRadius;
    let bestRoute = null;
    let bestIntersections = Infinity;
    let bestWaypoint = null;

    while (radius <= maxRadius) {

      setNotice(`Loading...`);
      // Generate candidate waypoints
      const candidates = generateCircleWaypoints(hazard, radius, 30); // 12 points around the circle

      for (let i = 0; i < candidates.length; i++) {
        const candidate = candidates[i];
        const testRequest = {
          ...baseRequest,
          waypoints: [...(baseRequest.waypoints || []), { location: candidate }],
        };
        try {
          const result = await getRoute(testRequest);
          const routePoints = result.routes[0].overview_path;
          const intersections = countHazardIntersections(routePoints, hazards);
          if (intersections < bestIntersections) {
            bestIntersections = intersections;
            bestRoute = result;
            bestWaypoint = candidate;
            if (bestIntersections === 0) {
              break;
            }
          }
        } catch {
          // ignore
        }
      }
      if (bestRoute && bestIntersections === 0) {
        break;
      }
      radius += 10;
    }

    if (!bestRoute) return null;
    return {
      route: bestRoute,
      waypoint: bestWaypoint,
      intersections: bestIntersections,
    };
  }

  async function getSafeRouteCircleApproach(request, hazards, maxIterations = 8) {
    let iterationCount = 0;
    let currentRequest = { ...request };
    let currentRoute = null;

    while (iterationCount < maxIterations) {
      iterationCount++;
      const result = await getRoute(currentRequest);
      const routePoints = result.routes[0].overview_path;
      const intersectCount = countHazardIntersections(routePoints, hazards);
      if (intersectCount === 0) {
        return result;
      }

      let foundHazard = null;
      for (const hazard of hazards) {
        const hazardLatLng = new window.google.maps.LatLng(
          hazard.lat,
          hazard.lng
        );
        const crosses = routePoints.some((pt) => {
          const dist =
            window.google.maps.geometry.spherical.computeDistanceBetween(
              new window.google.maps.LatLng(pt.lat(), pt.lng()),
              hazardLatLng
            );
          return dist < (hazard.radius || 20);
        });
        if (crosses) {
          foundHazard = hazard;
          break;
        }
      }
      if (!foundHazard) {
        return result;
      }

      const fix = await fixHazardWithCircle(foundHazard, currentRequest, 30, 300);
      if (!fix) {
        return null;
      }
      currentRoute = fix.route;
      if (fix.intersections === 0) {
        return fix.route;
      }

      currentRequest = {
        ...request,
        waypoints: [...(request.waypoints || []), { location: fix.waypoint }],
      };
    }
    return currentRoute;
  }

  const handleGetDirections = async () => {
    if (!startLocation || !endLocation) {
      alert("Please select both a start and end location.");
      return;
    }
    setFinalRoute(null);
    setUseDetourColor(false);
    detourMarkersRef.current.forEach((m) => m.setMap(null));
    detourMarkersRef.current = [];

    const baseRequest = {
      origin: startLocation.geometry.location,
      destination: endLocation.geometry.location,
      travelMode: window.google.maps.TravelMode.WALKING,
    };

    try {
      const route = await getSafeRouteCircleApproach(baseRequest, hazards, 8);
      if (!route) {
        setNotice("");
        alert("No fully safe route found. Sorry!");
        return;
      }
      setUseDetourColor((baseRequest.waypoints || []).length > 0);
      setFinalRoute(route);
      setNotice("Safe route found!");
      setTimeout(() => setNotice(""), 3000);
    } catch (err) {
      setNotice("");
      alert("No route found: " + err);
    }
  };

  // Draw hazards
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    hazardMarkersRef.current.forEach((m) => m.setMap(null));
    hazardMarkersRef.current = [];
    hazardCirclesRef.current.forEach((c) => c.setMap(null));
    hazardCirclesRef.current = [];

    hazards.forEach((hazard) => {
      const marker = new window.google.maps.Marker({
        position: { lat: hazard.lat, lng: hazard.lng },
        map: mapInstanceRef.current,
        label: hazard.type,
      });
      hazardMarkersRef.current.push(marker);

      const circle = new window.google.maps.Circle({
        map: mapInstanceRef.current,
        center: { lat: hazard.lat, lng: hazard.lng },
        radius: hazard.radius || 20,
        fillColor: "#FF0000",
        fillOpacity: 0.2,
        strokeColor: "#FF0000",
        strokeOpacity: 0.8,
        strokeWeight: 2,
      });
      hazardCirclesRef.current.push(circle);
    });
  }, [hazards]);

  // Show/hide notice
  useEffect(() => {
    if (!infoWindowRef.current || !mapInstanceRef.current) return;
    if (notice) {
      infoWindowRef.current.setContent(
        `<div style="padding:8px;font-weight:bold;">${notice}</div>`
      );
      infoWindowRef.current.setPosition(mapInstanceRef.current.getCenter());
      infoWindowRef.current.open(mapInstanceRef.current);
    } else {
      infoWindowRef.current.close();
    }
  }, [notice]);

  // Render final route
  useEffect(() => {
    if (finalRoute && routeRendererRef.current) {
      routeRendererRef.current.setDirections(finalRoute);
      routeRendererRef.current.setOptions({
        polylineOptions: {
          strokeColor: useDetourColor ? "red" : "blue",
          strokeWeight: 5,
        },
      });
      const bounds = new window.google.maps.LatLngBounds();
      finalRoute.routes[0].overview_path.forEach((pt) => bounds.extend(pt));
      mapInstanceRef.current.fitBounds(bounds);
    }
  }, [finalRoute, useDetourColor]);

  return (
    <div style={styles.container}>
      <div style={styles.controls}>
        {/* Absolutely position the image on the left, center the heading. */}
        <div style={styles.headerRow}>
          <img
            src="/images/profile.png" // <-- your profile image
            alt="Profile"
            style={styles.profilePic}
            onClick={() => setIsModalOpen(true)} // opens modal
          />
          <h2 style={styles.heading}>🚶‍♂️ SafeSteps</h2>
        </div>

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

      {/* Conditionally render the modal */}
      {isModalOpen && <Modal onClose={() => setIsModalOpen(false)} />}
    </div>
  );
}

const styles = {
  // The heading is absolutely centered in its parent
  heading: {
    position: "absolute",
    left: "50%",
    top: "50%",
    transform: "translate(-50%, -50%)",
    fontSize: "14px",
    fontWeight: "bold",
    textAlign: "center",
    fontFamily: "Arial, sans-serif",
    color: "#000",
    textTransform: "uppercase",
    letterSpacing: "1px",
    textShadow: "1px 1px 2px rgba(0, 0, 0, 0.2)",
    borderBottom: "3px solid #007BFF",
    paddingBottom: "3px",
    margin: 0, // remove default margins for absolute positioning
  },
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
    zIndex: "1000",
    position: "absolute",
    top: "96px",
    left: "50%",
    transform: "translateX(-50%)",
  },
  /**
   * This container is relative so the heading can be absolutely centered
   * while the image is pinned on the left edge.
   */
  headerRow: {
    position: "relative",
    width: "100%",
    height: "50px", // Enough height for the image & heading
  },
  /**
   * The profile picture is absolutely placed on the left,
   * vertically centered by top: 50% + translateY(-50%).
   */
  profilePic: {
    position: "absolute",
    left: "10px",
    top: "50%",
    transform: "translateY(-50%)",
    width: "40px",
    height: "40px",
    borderRadius: "50%",
    cursor: "pointer",
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
    zIndex: "1",
    borderTop: "2px solid #000",
    borderBottom: "2px solid #000",
  },
};
