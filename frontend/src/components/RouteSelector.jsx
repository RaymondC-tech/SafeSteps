import React, { useState, useEffect, useRef } from "react";
import LocationSearch from "./LocationSearch";

/* ============ Geometry Helpers ============ */

/**
 * Return the { closestPoint, paramT } on segment AB that’s closest to H.
 */
function getClosestPointOnSegment(A, B, H) {
  const Ax = A.lat();
  const Ay = A.lng();
  const Bx = B.lat();
  const By = B.lng();
  const Hx = H.lat();
  const Hy = H.lng();

  const ABx = Bx - Ax;
  const ABy = By - Ay;
  const AHx = Hx - Ax;
  const AHy = Hy - Ay;

  const ab2 = ABx * ABx + ABy * ABy;
  if (ab2 === 0) {
    // A and B are the same point
    return { closestPoint: A, paramT: 0 };
  }

  const ahDotAb = AHx * ABx + AHy * ABy;
  let t = ahDotAb / ab2;
  t = Math.max(0, Math.min(1, t));

  const closestLat = Ax + t * ABx;
  const closestLng = Ay + t * ABy;
  const closestPoint = new window.google.maps.LatLng(closestLat, closestLng);

  return { closestPoint, paramT: t };
}

/**
 * Distance from hazard center to the line segment [startPt, endPt].
 */
function getDistanceToSegment(startPt, endPt, hazardLatLng) {
  const { closestPoint } = getClosestPointOnSegment(
    startPt,
    endPt,
    hazardLatLng
  );
  return window.google.maps.geometry.spherical.computeDistanceBetween(
    closestPoint,
    hazardLatLng
  );
}

/**
 * Count how many times a route intersects any hazard circle.
 * Returns the total number of intersecting segments.
 */
function countHazardIntersections(routePoints, hazards) {
  let count = 0;
  for (let i = 0; i < routePoints.length - 1; i++) {
    const startPt = routePoints[i];
    const endPt = routePoints[i + 1];
    hazards.forEach((hazard) => {
      const hazardLatLng = new window.google.maps.LatLng(
        hazard.lat,
        hazard.lng
      );
      const dist = getDistanceToSegment(startPt, endPt, hazardLatLng);
      const radius = hazard.radius || 20;
      if (dist < radius) {
        count++;
      }
    });
  }
  return count;
}

/**
 * Find the first intersection on a route.
 * Returns { hazard, segmentIndex, paramT, closestPoint } or null if none.
 */
function findFirstIntersection(routePoints, hazards) {
  for (let i = 0; i < routePoints.length - 1; i++) {
    const startPt = routePoints[i];
    const endPt = routePoints[i + 1];
    for (let hazard of hazards) {
      const hazardLatLng = new window.google.maps.LatLng(
        hazard.lat,
        hazard.lng
      );
      const dist = getDistanceToSegment(startPt, endPt, hazardLatLng);
      const radius = hazard.radius || 20;
      if (dist < radius) {
        const { closestPoint, paramT } = getClosestPointOnSegment(
          startPt,
          endPt,
          hazardLatLng
        );
        return { hazard, segmentIndex: i, paramT, closestPoint };
      }
    }
  }
  return null;
}

/**
 * Shift a point outward by hazard radius + margin to "push" the route away.
 */
function computeWaypointOutsideHazard(closestPoint, hazard, margin = 50) {
  const clearance = (hazard.radius || 20) + margin;

  const hazardLat = hazard.lat;
  const hazardLng = hazard.lng;
  const routeLat = closestPoint.lat();
  const routeLng = closestPoint.lng();

  const dx = routeLat - hazardLat;
  const dy = routeLng - hazardLng;
  const dist = Math.sqrt(dx * dx + dy * dy);
  if (dist === 0) {
    // If the route point is exactly at hazard center, offset a bit
    return new window.google.maps.LatLng(
      hazardLat + 0.0005,
      hazardLng + 0.0005
    );
  }

  const ndx = dx / dist;
  const ndy = dy / dist;

  // Approx conversions for lat/lng
  const latConversion = 111111;
  const lngConversion = 111111 * Math.cos(hazardLat * (Math.PI / 180));

  const offsetLat = (clearance * ndx) / latConversion;
  const offsetLng = (clearance * ndy) / lngConversion;

  return new window.google.maps.LatLng(
    hazardLat + offsetLat,
    hazardLng + offsetLng
  );
}

export default function RouteSelector({ hazards = [] }) {
  const [startLocation, setStartLocation] = useState(null);
  const [endLocation, setEndLocation] = useState(null);

  const [finalDirections, setFinalDirections] = useState(null);
  const [notice, setNotice] = useState("");

  // Map & DirectionsRenderer
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const routeRendererRef = useRef(null);
  const infoWindowRef = useRef(null);

  // Hazard markers & circles
  const hazardMarkersRef = useRef([]);
  const hazardCirclesRef = useRef([]);

  // DirectionsService
  const directionsService = useRef(null);

  // Initialize the map & single DirectionsRenderer
  useEffect(() => {
    if (window.google && mapRef.current && !mapInstanceRef.current) {
      mapInstanceRef.current = new window.google.maps.Map(mapRef.current, {
        center: { lat: 43.47511, lng: -80.5295 },
        zoom: 14,
      });

      infoWindowRef.current = new window.google.maps.InfoWindow({
        content: "",
        position: mapInstanceRef.current.getCenter(),
      });

      routeRendererRef.current = new window.google.maps.DirectionsRenderer({
        polylineOptions: { strokeColor: "red", strokeWeight: 5 },
        preserveViewport: false,
        suppressMarkers: false, // Show A/B markers
      });
      routeRendererRef.current.setMap(mapInstanceRef.current);

      directionsService.current = new window.google.maps.DirectionsService();
    }
  }, []);

  // Render finalDirections
  useEffect(() => {
    if (routeRendererRef.current && finalDirections) {
      routeRendererRef.current.setDirections(finalDirections);
    }
  }, [finalDirections]);

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

  /**
   * Tries multiple times (maxIterations) to add a single waypoint at each step.
   * Each iteration, we increase the margin used for the detour waypoint.
   * If we find a hazard-free route, we return it. Otherwise, we return null.
   */
  function iterativeSingleWaypointSearch(
    baseRequest,
    hazards,
    maxIterations = 8
  ) {
    return new Promise((resolve) => {
      let iterationCount = 0;
      let currentRequest = { ...baseRequest };

      const tryNext = () => {
        if (!directionsService.current) {
          resolve(null);
          return;
        }

        // Always request alternatives
        currentRequest.provideRouteAlternatives = true;

        directionsService.current.route(currentRequest, (result, status) => {
          if (status !== window.google.maps.DirectionsStatus.OK) {
            // If we fail to get directions, stop.
            resolve(null);
            return;
          }

          const { routes } = result;
          if (!routes || routes.length === 0) {
            resolve(null);
            return;
          }

          // Check if any route is hazard-free
          let hazardFreeRoute = null;
          let bestRoute = null;
          let bestIntersections = Infinity;

          routes.forEach((r) => {
            const rp = r.overview_path;
            const count = countHazardIntersections(rp, hazards);
            if (count === 0 && !hazardFreeRoute) {
              hazardFreeRoute = r; // found a fully safe route
            }
            if (count < bestIntersections) {
              bestRoute = r;
              bestIntersections = count;
            }
          });

          if (hazardFreeRoute) {
            // We found a safe route
            resolve({ ...result, routes: [hazardFreeRoute] });
            return;
          }

          // No hazard-free route in this attempt, so we add 1 waypoint for the first intersection
          if (iterationCount < maxIterations) {
            iterationCount++;

            // We'll make the margin bigger each time we fail
            const margin = 50 + iterationCount * 50;
            // e.g. iteration 1 => margin=100, iteration 2 => 150, etc.

            // Use the best route so far
            const points = bestRoute.overview_path;
            const firstInt = findFirstIntersection(points, hazards);
            if (!firstInt) {
              // If for some reason there's no intersection, it might be effectively safe
              resolve({ ...result, routes: [bestRoute] });
              return;
            }
            // Create 1 detour waypoint with a bigger margin
            const detour = computeWaypointOutsideHazard(
              firstInt.closestPoint,
              firstInt.hazard,
              margin
            );

            // Add that waypoint to the request
            currentRequest = {
              ...baseRequest,
              waypoints: [{ location: detour }],
              optimizeWaypoints: false,
            };

            tryNext();
          } else {
            // We exhausted attempts, no safe route found
            resolve(null);
          }
        });
      };

      tryNext();
    });
  }

  const handleGetDirections = async () => {
    if (!startLocation || !endLocation) {
      alert("Please select both a start and an end location.");
      return;
    }
    if (!directionsService.current) {
      alert("Directions Service not ready.");
      return;
    }

    setNotice("Attempting to find a hazard-free route...");
    setFinalDirections(null);

    const baseRequest = {
      origin: startLocation.geometry.location,
      destination: endLocation.geometry.location,
      travelMode: window.google.maps.TravelMode.WALKING,
      provideRouteAlternatives: true,
    };

    // 1) Single request with route alternatives
    directionsService.current.route(baseRequest, (result, status) => {
      if (status !== window.google.maps.DirectionsStatus.OK) {
        setNotice("");
        alert("Could not fetch directions. Try again.");
        return;
      }

      const { routes } = result;
      if (!routes || routes.length === 0) {
        setNotice("");
        alert("No routes found at all.");
        return;
      }

      // Check for hazard-free among these alternatives
      let hazardFreeRoute = null;
      let bestRoute = null;
      let bestIntersections = Infinity;

      routes.forEach((r) => {
        const rp = r.overview_path;
        const count = countHazardIntersections(rp, hazards);
        if (count === 0 && !hazardFreeRoute) {
          hazardFreeRoute = r;
        }
        if (count < bestIntersections) {
          bestRoute = r;
          bestIntersections = count;
        }
      });

      if (hazardFreeRoute) {
        // We found a safe route right away
        setNotice("Hazard-free route found!");
        setFinalDirections({ ...result, routes: [hazardFreeRoute] });
        return;
      }

      // Otherwise, no hazard-free route in the first attempt.
      // We'll do iterative single-waypoint approach with an increasing margin:
      setNotice("No hazard-free route. Trying single-waypoint detours...");

      iterativeSingleWaypointSearch(baseRequest, hazards, 8).then(
        (finalRoute) => {
          if (finalRoute) {
            // Check if it's truly hazard-free
            const routePoints = finalRoute.routes[0].overview_path;
            const c = countHazardIntersections(routePoints, hazards);
            if (c === 0) {
              setNotice(
                "Hazard-free route found with single-waypoint & bigger margin!"
              );
            } else {
              setNotice(
                "Still no fully hazard-free route. Showing best found."
              );
            }
            setFinalDirections(finalRoute);
          } else {
            setNotice("No hazard-free route found after increasing margins.");
          }
        }
      );
    });
  };

  return (
    <div style={styles.container}>
      <div style={styles.controls}>
        <h2 className="text-2xl font-extrabold text-center text-gray-800 mt-8">
          Iterative Single
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
