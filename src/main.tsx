import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

localStorage.clear() // Clear localStorage for development/testing purposes
sessionStorage.clear() // Clear sessionStorage for development/testing purposes

createRoot(document.getElementById('root')!).render(
    <App />
)
