// frontend/src/main.jsx (for Vite)
import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux'; // Import Provider
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'; 
import App from './App.jsx'; 
import { store } from './store'; 
import './index.css'; 

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Provider store={store}> {/* Wrap App with Provider */}
      <Router> {/* Wrap App with Router */}
        <App />
      </Router>
    </Provider>
  </React.StrictMode>,
);