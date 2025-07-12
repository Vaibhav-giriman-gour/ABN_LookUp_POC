// frontend/src/App.jsx
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import AbnSearchPage from './components/AbnSearchPage';
import AbnDetailPage from './components/AbnDetailPage';
import Navbar from './components/Navbar';

function App() {
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center py-0">
      <Navbar />
      <header className=" py-8">
        <h1 className="text-4xl font-bold text-blue-800">ABN Lookup POC</h1>
      </header>
      <Routes>
        <Route path="/" element={<AbnSearchPage />} />
        <Route path="/abns/:abn" element={<AbnDetailPage />} />
      </Routes>
    </div>
  );
}

export default App;