/**
 * Application Entry Point.
 * Mounts the main React component tree (<App />) inside the HTML template's root DOM element.
 * StrictMode is enabled during development to catch potential react-lifecycle bugs.
 */

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
