import React, { useState } from "react";

const FormComponent = ({ setHazardLocation }) => {
  const [address, setAddress] = useState("");
  const [condition, setCondition] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Prepare data to send to the backend
    const hazardData = {
      address,
      condition,
    };

    // Send data to the backend to store in MongoDB
    const response = await fetch('/api/report-hazard', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(hazardData),
    });

    if (response.ok) {
      const data = await response.json();
      // Set the hazard location for the map marker
      setHazardLocation({ lat: data.lat, lng: data.lng, condition });
      // Clear the input fields
      setAddress("");
      setCondition("");
    } else {
      console.error("Failed to report hazard");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 bg-gray-100 rounded-lg shadow-md flex flex-col">
      <input
        type="text"
        className="mb-2 p-2 border rounded"
        placeholder="Enter Address"
        value={address}
        onChange={(e) => setAddress(e.target.value)}
      />
      <select
        className="mb-2 p-2 border rounded"
        value={condition}
        onChange={(e) => setCondition(e.target.value)}
      >
        <option value="">Select Hazard</option>
        <option value="ice/slippery">Ice/Slippery</option>
        <option value="lot of snow">Lot of Snow</option>
        <option value="sidewalk ends">Sidewalk Ends</option>
        <option value="other">Other</option>
      </select>
      <button type="submit" className="w-full bg-blue-500 text-white p-2 rounded">Submit</button>
    </form>
  );
};

export default FormComponent;