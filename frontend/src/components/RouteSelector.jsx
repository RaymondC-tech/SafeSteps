import React, { useState, useEffect, useRef } from "react";
import LocationSearch from "./LocationSearch";

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
  const [startLocation, setStartLocation] = useState(null);
  const [endLocation, setEndLocation] = useState(null);
  const [finalRoute, setFinalRoute] = useState(null);
  const [notice, setNotice] = useState("");
  const [useDetourColor, setUseDetourColor] = useState(false);

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
      routeRendererRef.current.setDirections(finalRoute);
      routeRendererRef.current.setOptions({
        polylineOptions: {
          strokeColor: useDetourColor ? "red" : "blue",
          strokeWeight: 5,
        },
      });
      // Fit map to route
      const bounds = new window.google.maps.LatLngBounds();
      finalRoute.routes[0].overview_path.forEach((pt) => bounds.extend(pt));
      mapInstanceRef.current.fitBounds(bounds);
    }
  }, [finalRoute, useDetourColor]);

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

  /**
   * For each hazard that intersects, we do the "circle approach":
   * - Start at radius=30, try all angles => pick best route
   * - If still intersects, radius=40, 50, etc. until we reduce intersections or get 0
   */
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
      setNotice(`Trying circle radius = ${radius} for hazard ${hazard.type}`);
      // Generate candidate waypoints
      const candidates = generateCircleWaypoints(hazard, radius, 30); // 12 points around the circle
      for (let i = 0; i < candidates.length; i++) {
        const candidate = candidates[i];
        const testRequest = {
          ...baseRequest,
          waypoints: [
            ...(baseRequest.waypoints || []),
            { location: candidate },
          ],
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
              break; // fully safe
            }
          }
        } catch {
          // ignore
        }
      }
      if (bestRoute && bestIntersections === 0) {
        // Found a hazard-free route with this circle radius
        break;
      }
      radius += 10; // increase circle radius
    }

    if (!bestRoute) return null; // no route found at all
    return {
      route: bestRoute,
      waypoint: bestWaypoint,
      intersections: bestIntersections,
    };
  }

  // Master function: For each hazard that intersects, fix it with a circle approach, then proceed
  async function getSafeRouteCircleApproach(
    request,
    hazards,
    maxIterations = 8
  ) {
    let iterationCount = 0;
    let currentRequest = { ...request };
    let currentRoute = null;

    while (iterationCount < maxIterations) {
      iterationCount++;
      // 1) Get route
      const result = await getRoute(currentRequest);
      const routePoints = result.routes[0].overview_path;
      const intersectCount = countHazardIntersections(routePoints, hazards);
      if (intersectCount === 0) {
        // no hazards => done
        return result;
      }
      setNotice(
        `Iteration ${iterationCount}: ${intersectCount} hazard(s) intersect. Fixing...`
      );

      // 2) Find one hazard that definitely intersects
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
        // Possibly we have intersections but can't identify which hazard? Edge case
        return result;
      }

      // 3) Try the circle approach on that hazard
      const fix = await fixHazardWithCircle(
        foundHazard,
        currentRequest,
        30,
        300
      );
      if (!fix) {
        // no route found at all
        return null;
      }
      // Add a marker for the chosen waypoint
      if (fix.waypoint) {
        const marker = new window.google.maps.Marker({
          position: fix.waypoint,
          map: mapInstanceRef.current,
          label: `R${iterationCount}`, // or something
        });
        detourMarkersRef.current.push(marker);
      }

      currentRoute = fix.route;
      // If we found a route that is fully safe => done
      if (fix.intersections === 0) {
        return fix.route;
      }

      // Otherwise, we keep that route as "best so far" but we do want to keep the chosen waypoint
      currentRequest = {
        ...request,
        waypoints: [...(request.waypoints || []), { location: fix.waypoint }],
      };
    }
    return currentRoute; // best we got
  }

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
      const route = await getSafeRouteCircleApproach(baseRequest, hazards, 8);
      if (!route) {
        setNotice("");
        alert("No fully safe route found. Sorry!");
        return;
      }
      // Check if we used any waypoints
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
      // Fit bounds
      const bounds = new window.google.maps.LatLngBounds();
      finalRoute.routes[0].overview_path.forEach((pt) => bounds.extend(pt));
      mapInstanceRef.current.fitBounds(bounds);
    }
  }, [finalRoute, useDetourColor]);

  return (
    <div style={styles.container}>
      <div style={styles.controls}>
        <h2 className="text-2xl font-extrabold text-center text-gray-800 mt-8">
          Circle Waypoints
        </h2>
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
    marginTop: "-10px",
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
    maxWidth: "500px",
    height: "300px",
    marginTop: "-10px",
  },
};
