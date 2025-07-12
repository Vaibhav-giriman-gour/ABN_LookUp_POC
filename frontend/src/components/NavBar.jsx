
// frontend/src/components/Navbar.jsx
import React from 'react';
import { Link } from 'react-router-dom';

function Navbar() {
  return (
    <nav className="bg-blue-600 p-4 w-full">
      <div className="container mx-auto flex justify-between items-center">
        <Link to="/" className="text-white text-2xl font-bold hover:text-blue-200">
          ABN Lookup
        </Link>
        <div className="space-x-4">
          {/* You can add more navigation links here in the future */}
          {/* <Link to="/about" className="text-white hover:text-blue-200">About</Link> */}
          {/* <Link to="/contact" className="text-white hover:text-blue-200">Contact</Link> */}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;