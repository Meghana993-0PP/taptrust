/**
 * TapTrust Frontend — Entry Point
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Global reset — remove default browser margins/padding
const style = document.createElement('style');
style.textContent = '*, *::before, *::after { box-sizing: border-box; } body, html { margin: 0; padding: 0; width: 100%; height: 100%; }';
document.head.appendChild(style);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
