import React from "react";

const Modal = ({ onClose }) => {
  return (
    <div style={modalStyles.overlay} onClick={onClose}>
      <div style={modalStyles.container} onClick={(e) => e.stopPropagation()}>
        <h2 style={modalStyles.title}>Sign Up / Log In</h2>
        <form>
          <input type="text" placeholder="Email" style={modalStyles.input} />
          <input type="password" placeholder="Password" style={modalStyles.input} />
          <div style={modalStyles.buttonContainer}>
            <button type="submit" style={modalStyles.button}>Log In</button>
            <button type="button" style={modalStyles.button} onClick={onClose}>Sign Up</button>
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
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  container: {
    backgroundColor: "white",
    padding: "30px",
    borderRadius: "12px",
    boxShadow: "0 4px 20px rgba(0, 0, 0, 0.2)",
    width: "90%",
    maxWidth: "350px",
    textAlign: "center",
  },
  title: {
    fontSize: "24px",
    fontWeight: "600",
    marginBottom: "20px",
    color: "#333",
  },
  input: {
    display: "block",
    margin: "10px auto",
    padding: "12px",
    width: "90%",
    borderRadius: "6px",
    border: "1px solid #ccc",
    fontSize: "16px",
    transition: "border-color 0.3s",
    outline: "none",
  },
  buttonContainer: {
    display: "flex",
    justifyContent: "space-between",
    marginTop: "20px",
  },
  button: {
    padding: "10px 15px",
    borderRadius: "6px",
    border: "none",
    backgroundColor: "#007BFF",
    color: "white",
    cursor: "pointer",
    fontSize: "16px",
    transition: "background-color 0.3s, transform 0.2s",
    flex: "1",
    margin: "0 5px",
  },
};

export default Modal; 