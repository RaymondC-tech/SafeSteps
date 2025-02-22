import React, { useState } from "react";

function HazardCard() {
  const [hazardType, setHazardType] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Selected hazard:", hazardType);
    // TODO: Send hazardType to your backend or handle it however you need.
  };

  return (
    <div
      style={{
        border: "1px solid #ccc",
        borderRadius: "8px",
        width: "300px",
        padding: "16px",
        margin: "-12px auto",
        boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
      }}
    >
      <h2 style={{ marginBottom: "8px" }}>Report a Hazard</h2>
      <form onSubmit={handleSubmit}>
        <label
          htmlFor="hazard"
          style={{ display: "block", marginBottom: "4px" }}
        >
          Select a hazard type:
        </label>
        <select
          id="hazard"
          value={hazardType}
          onChange={(e) => setHazardType(e.target.value)}
          style={{
            width: "100%",
            padding: "8px",
            marginBottom: "12px",
            borderRadius: "4px",
          }}
        >
          <option value="">-- Please choose an option --</option>
          <option value="Slippery">Slippery</option>
          <option value="Blockage">Blockage</option>
          <option value="Other">Other</option>
        </select>
        <button
          type="submit"
          style={{
            padding: "8px 16px",
            borderRadius: "4px",
            cursor: "pointer",
            backgroundColor: "#007BFF",
            color: "#fff",
            border: "none",
          }}
        >
          Submit
        </button>
      </form>
    </div>
  );
}

export default HazardCard;
