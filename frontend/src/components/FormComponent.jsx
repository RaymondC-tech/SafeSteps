import React, { useState } from "react";

const FormComponent = ({ setAvoidSlippery }) => {
  const [slippery, setSlippery] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setAvoidSlippery(slippery);
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 bg-gray-100 rounded-lg shadow-md flex flex-col">
      <div className="flex space-x-2 mb-2">
        <input type="text" className="w-full p-2 border rounded" value="Toronto, ON" disabled />
        <input type="text" className="w-full p-2 border rounded" value="Downtown Toronto, ON" disabled />
      </div>

      <label className="flex items-center mb-2">
        <input type="checkbox" className="mr-2" onChange={() => setSlippery(!slippery)} />
        Mark a road as slippery
      </label>

      <button type="submit" className="w-full bg-blue-500 text-white p-2 rounded">Submit</button>
    </form>
  );
};

export default FormComponent;