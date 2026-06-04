import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import 'react-day-picker/dist/style.css';
import './styles.css';
import App from './App.js';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
