import React from "react";

const Modal = ({ onClose }) => {
  return (
    <div style={modalStyles.overlay} onClick={onClose}>
      <div style={modalStyles.container} onClick={(e) => e.stopPropagation()}>
        <h2 style={modalStyles.title}>Sign Up / Log In</h2>
        <form>
          <input type="text" placeholder="Email" style={modalStyles.input} />
          <input
            type="password"
            placeholder="Password"
            style={modalStyles.input}
          />
          <div style={modalStyles.buttonContainer}>
            <button type="submit" style={modalStyles.button}>
              Log In
            </button>
            <button type="button" style={modalStyles.button} onClick={onClose}>
              Sign Up
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const modalStyles = {
  overlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.7)", // Darker overlay for better focus
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10000,
  },
  container: {
    backgroundColor: "white",
    padding: "40px",
    borderRadius: "12px",
    boxShadow: "0 4px 20px rgba(0, 0, 0, 0.3)", // Softer shadow
    width: "90%",
    maxWidth: "350px", // Adjusted maxWidth for a narrower modal
    textAlign: "center",
  },
  title: {
    fontSize: "26px",
    fontWeight: "700",
    marginBottom: "20px",
    color: "#333", // Darker text for better readability
  },
  input: {
    display: "block",
    margin: "10px auto",
    padding: "14px",
    width: "90%",
    borderRadius: "8px",
    border: "1px solid #ccc",
    fontSize: "16px",
    transition: "border-color 0.3s",
    outline: "none",
    boxShadow: "0 2px 5px rgba(0, 0, 0, 0.1)", // Subtle shadow for inputs
  },
  buttonContainer: {
    display: "flex",
    justifyContent: "space-between",
    marginTop: "20px",
  },
  button: {
    padding: "12px 20px",
    borderRadius: "8px",
    border: "none",
    backgroundColor: "#007BFF",
    color: "white",
    cursor: "pointer",
    fontSize: "16px",
    transition: "background-color 0.3s, transform 0.2s",
    flex: "1", // Make buttons take equal space
    margin: "0 5px", // Space between buttons
    boxShadow: "0 2px 5px rgba(0, 0, 0, 0.1)", // Subtle shadow for buttons
  },
};

export default Modal;
