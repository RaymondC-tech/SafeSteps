import React, { useState, useRef, useEffect } from "react";
import { Autocomplete } from "@react-google-maps/api";

// Define your hazard options.
const hazardOptions = [
  { label: "Icey", value: "Slippery" },
  { label: "Blockage", value: "Blockage" },
  { label: "Other", value: "Other" },
];

const CustomSelect = ({ value, onChange, options, placeholder }) => {
  const [open, setOpen] = useState(false);
  const selectRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (selectRef.current && !selectRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleOptionClick = (optionValue) => {
    onChange(optionValue);
    setOpen(false);
  };

  return (
    <div ref={selectRef} style={{ position: "relative", width: "100%" }}>
      <div
        onClick={() => setOpen(!open)}
        style={{
          border: "1px solid #ccc",
          padding: "3px",
          cursor: "pointer",
          background: "#fff",
          fontSize: "9px",
          userSelect: "none",
          width: "100%",
          maxWidth: "180px", // Smaller width
          borderRadius: "5px",
        }}
      >
        {value ? options.find((opt) => opt.value === value)?.label : placeholder}
      </div>
      {open && (
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            maxHeight: "40px",
            overflowY: "auto",
            border: "1px solid #ccc",
            background: "#fff",
            zIndex: 1000,
            fontSize: "9px",
          }}
        >
          {options.map((option, index) => (
            <div
              key={index}
              onClick={() => handleOptionClick(option.value)}
              style={{
                padding: "3px",
                borderBottom: "1px solid #eee",
                cursor: "pointer",
              }}
            >
              {option.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const HazardForm = ({ onReportHazard }) => {
  const [hazardType, setHazardType] = useState("");
  const [hazardAddress, setHazardAddress] = useState(null);
  const autocompleteRef = useRef(null);

  const handleLoad = (autocomplete) => {
    autocompleteRef.current = autocomplete;
  };

  const handlePlaceChanged = () => {
    if (autocompleteRef.current) {
      const place = autocompleteRef.current.getPlace();
      if (place.geometry) {
        setHazardAddress(place);
      } else {
        alert("No details available for the selected location.");
      }
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!hazardType) {
      alert("Please select a hazard type.");
      return;
    }
    if (!hazardAddress) {
      alert("Please enter and select a hazard location.");
      return;
    }
    const hazard = {
      lat: hazardAddress.geometry.location.lat(),
      lng: hazardAddress.geometry.location.lng(),
      type: hazardType,
      radius: 50,
      address: hazardAddress.formatted_address,
    };
    onReportHazard(hazard);
    setHazardType("");
    setHazardAddress(null);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="p-2 rounded"
      style={{
        backgroundColor: "rgba(50, 50, 50, 0.4)", // More transparent
        borderRadius: "8px",
        backdropFilter: "blur(4px)",
        padding: "10px",
        position: "absolute",
        bottom: "29px", // Moves slightly up
        left: "38%",
        transform: "translateX(-50%)",
        zIndex: 1000,
        width: "70%",
        maxWidth: "280px", // More compact width
        boxShadow: "0px 2px 6px rgba(0, 0, 0, 0.2)", // Lighter shadow
      }}
    >
      <label
        className="block mb-1 font-bold text-white"
        style={{ fontSize: "10px"}}
      >
        Report a Hazard:
      </label>

      {/* Custom Select */}
      <CustomSelect
        value={hazardType}
        onChange={setHazardType}
        options={hazardOptions}
        placeholder="Select Hazard"
        style={{
          fontSize: "9px",
          padding: "3px",
          width: "100%",
          maxWidth: "180px",
        }}
      />

      {/* Autocomplete Location Input */}
      <div className="mb-1" style={{ marginTop: "4px" }}>
        <Autocomplete onLoad={handleLoad} onPlaceChanged={handlePlaceChanged}>
          <input
            type="text"
            placeholder="Enter hazard location"
            className="border p-1 w-full rounded"
            style={{
              backgroundColor: "rgba(255, 255, 255, 0.7)",
              color: "#000",
              border: "1px solid #ccc",
              fontSize: "9px",
              padding: "3px",
              width: "100%",
              maxWidth: "180px",
              
            }}
          />
        </Autocomplete>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        className="mt-1 bg-red-500 text-white w-full rounded-lg"
        style={{
          fontSize: "9px",
          padding: "3px",
          maxWidth: "140px",
          textAlign: "center",
          display: "block",
          margin: "0 auto",
        }}
      >
        Report Hazard
      </button>
    </form>
  );
};

export default HazardForm;
