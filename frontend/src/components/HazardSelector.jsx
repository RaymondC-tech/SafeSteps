import React, { useState, useRef, useEffect } from "react";
import { Autocomplete } from "@react-google-maps/api";

// Define your hazard options.
const hazardOptions = [
  { label: "Icy", value: "Slippery" },
  { label: "High Snow Level", value: "Blockage" },
  { label: "Other", value: "Other" },
  // Add more options here if needed.
];

// A custom select component that displays a scrollable list of options.
const CustomSelect = ({ value, onChange, options, placeholder }) => {
  const [open, setOpen] = useState(false);
  const selectRef = useRef(null);

  // Close the dropdown if user clicks outside.
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
    <div ref={selectRef} className="relative w-full">
      <div
        onClick={() => setOpen(!open)}
        style={{
          border: "1px solid #ccc",
          padding: "5px",
          cursor: "pointer",
          background: "#fff",
          fontSize: "12px",
          userSelect: "none",
          width: "100%",
          maxWidth: "200px", // Smaller width
          borderRadius: "5px",
          //   marginBottom: "8px",
        }}
      >
        {value
          ? options.find((opt) => opt.value === value)?.label
          : placeholder}
      </div>
      {open && (
        <div
          style={{
            position: "absolute",
            border: "1px solid #ccc",
            padding: "5px",
            cursor: "pointer",
            background: "#fff",
            fontSize: "12px",
            userSelect: "none",
            width: "100%",
            maxWidth: "200px", // Smaller width
            borderRadius: "5px",
          }}
        >
          {options.map((option, index) => (
            <div
              key={index}
              onClick={() => handleOptionClick(option.value)}
              style={{
                padding: "5 px",
                // borderBottom: "1px solid #eee",
                cursor: "pointer",
                marginBottom: "5px",
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
      radius: 50, // 50-meter buffer; adjust as needed
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
        width: "60%",
        maxWidth: "280px", // More compact width
        boxShadow: "0px 2px 6px rgba(0, 0, 0, 0.2)", // Lighter shadow
        marginLeft: "-10px",
        marginBottom: "-14px",
        height: "20 %",
      }}
    >
      <label
        className="block mb-1 font-bold text-white"
        style={{ fontSize: "15px" }}
      >
        Report a Hazard:
      </label>
      <CustomSelect
        value={hazardType}
        onChange={setHazardType}
        options={hazardOptions}
        placeholder="Select Hazard"
        style={
          {
            //   fontSize: "12px",
            //   padding: "3px",
            //   width: "100%",
            //   maxWidth: "180px",
          }
        }
      />
      <div className="mb-1" style={{ marginTop: "4px" }}>
        <Autocomplete
          onLoad={handleLoad}
          onPlaceChanged={handlePlaceChanged}
          options={{ types: ["establishment"] }}
        >
          <input
            type="text"
            placeholder="Enter hazard location"
            className="border p-2 w-full rounded"
            style={{
              backgroundColor: "rgba(255, 255, 255, 0.7)",
              color: "#000",
              border: "1px solid #ccc",
              fontSize: "12px",
              padding: "5px",
              width: "100%",
              maxWidth: "200px",
            }}
          />
        </Autocomplete>
      </div>
      <button
        type="submit"
        className="mt-1 bg-red-500 text-white w-full rounded-lg"
        style={{
          fontSize: "12px",
          padding: "5px",
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