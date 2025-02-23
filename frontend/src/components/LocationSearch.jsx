import React, { useRef, useEffect } from "react";
import { FaMapMarkerAlt } from "react-icons/fa";

export default function LocationSearch({ label, onPlaceSelected }) {
  const inputRef = useRef(null);

  useEffect(() => {
    if (!window.google) {
      console.error("Google Maps JavaScript API library must be loaded.");
      return;
    }

    const autocomplete = new window.google.maps.places.Autocomplete(
      inputRef.current,
      { types: ["establishment"] }
    );

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
    <div style={styles.inputContainer}>
      <FaMapMarkerAlt style={styles.icon} /> {/* Map Icon */}
      <input
        ref={inputRef}
        type="text"
        placeholder={`${label}`}
        style={styles.input}
      />
    </div>
  );
}

const styles = {
  inputContainer: {
    display: "flex",
    alignItems: "center",
    width: "340px",
    height: "28px",
    margin: "10px",
    padding: "8px",
    backgroundColor: "#fff",
    borderRadius: "8px",
    border: "1px solid #ccc",
  },
  icon: {
    marginRight: "8px",
    color: "#007BFF",
    fontSize: "16px",
  },
  input: {
    flex: 1,
    fontSize: "12px",
    border: "none",
    outline: "none",
    paddingLeft: "5px",
  },
};
