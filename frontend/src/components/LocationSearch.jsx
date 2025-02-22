import React, { useRef, useEffect } from "react";

/**
 * A reusable component that attaches Google Places Autocomplete
 * to an input field. When a user selects a place, it calls onPlaceSelected
 * with the full Place object.
 *
 * Props:
 *  - label: string (e.g., "Start Location" or "End Location")
 *  - onPlaceSelected: function(place) -> void
 */
export default function LocationSearch({ label, onPlaceSelected }) {
  const inputRef = useRef(null);

  useEffect(() => {
    // Ensure the Google Maps script is loaded
    if (!window.google) {
      console.error("Google Maps JavaScript API library must be loaded.");
      return;
    }

    // Create the autocomplete instance
    const autocomplete = new window.google.maps.places.Autocomplete(
      inputRef.current,
      { types: ["geocode"] } // or ['(cities)'] if you want city-level results
    );

    // When a user selects a place, retrieve the details
    autocomplete.addListener("place_changed", () => {
      const place = autocomplete.getPlace();
      if (!place.geometry) {
        console.error("No geometry details available for the selected place.");
        return;
      }
      if (onPlaceSelected) {
        onPlaceSelected(place);
      }
    });
  }, [onPlaceSelected]);

  return (
    <div style={styles.container}>
      <label style={styles.label}>{label}</label>
      <input
        ref={inputRef}
        type="text"
        placeholder={`Enter ${label}`}
        style={styles.input}
      />
    </div>
  );
}

const styles = {
  container: {
    marginBottom: "5px",
    marginTop: "4px",
    textAlign: "left",
  },
  label: {
    display: "block",
    marginBottom: "1px",
    fontWeight: "bold",
  },
  input: {
    width: "100%",
    maxWidth: "300px",
    padding: "5px",
    fontSize: "10px",
    border: "1px solid #ccc",
    borderRadius: "4px",
  },
};
