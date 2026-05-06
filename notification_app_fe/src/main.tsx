import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
const API_TOKEN = import.meta.env.VITE_ACCESS_TOKEN;

import { configureLogger, Log } from 'loggin_middleware'

// Configure it explicitly for Vite environment if needed, or stick to defaults
// We'll point it to our dummy server on port 3000
configureLogger({ testServerUrl: "http://20.207.122.201/evaluation-service/logs", token: API_TOKEN })

// Log application startup
Log("frontend", "info", "main", "Frontend application started").catch(console.error);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
