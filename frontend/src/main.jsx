// Plik: src/main.jsx
// Punkt wejścia aplikacji React

import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import './index.css'

// Renderowanie aplikacji w elemencie o id="root" z index.html
// Użycie BrowserRouter do obsługi routingu w aplikacji
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
)