import React, { useState, useRef, useEffect } from "react";
import { Autocomplete } from "@react-google-maps/api";

// Define your hazard options.
const hazardOptions = [
  { label: "Icy", value: "Slippery" },
  { label: "Blockage", value: "Blockage" },
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
        className="border p-2 cursor-pointer bg-white select-none"
      >
        {value
          ? options.find((opt) => opt.value === value)?.label
          : placeholder}
      </div>
      {open && (
        <div className="absolute left-0 right-0 max-h-24 overflow-y-auto border bg-white z-10">
          {options.map((option, index) => (
            <div
              key={index}
              onClick={() => handleOptionClick(option.value)}
              className="p-2 border-b cursor-pointer hover:bg-gray-100"
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
    <form onSubmit={handleSubmit} className="p-4 bg-gray-100 rounded">
      <label className="block mb-2 font-bold">Report a Hazard:</label>
      <CustomSelect
        value={hazardType}
        onChange={setHazardType}
        options={hazardOptions}
        placeholder="Select Hazard"
      />
      <div className="mb-2 mt-4">
        <Autocomplete
          onLoad={handleLoad}
          onPlaceChanged={handlePlaceChanged}
          options={{ types: ["establishment"] }}
        >
          <input
            type="text"
            placeholder="Enter hazard location"
            className="border p-2 w-full"
          />
        </Autocomplete>
      </div>
      <button type="submit" className="mt-2 bg-red-500 text-white p-2 w-full">
        Report Hazard
      </button>
    </form>
  );
};

export default HazardForm;
