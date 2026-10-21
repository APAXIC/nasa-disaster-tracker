import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

document.title = 'EONET Tracker'
const favicon = document.querySelector("link[rel='icon']") || document.createElement('link')
favicon.rel = 'icon'
favicon.type = 'image/png'
favicon.href = '/nasa-logo.png'
if (!favicon.parentNode) document.head.appendChild(favicon)

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
