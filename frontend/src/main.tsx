import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { ToastProvider } from './components/ui/ToastProvider'
import './styles/globals.css'

if ('serviceWorker' in navigator) {
  if (import.meta.env.PROD) {
    // Use dynamic import with proper typing for PWA
    import('virtual:pwa-register').then((module) => {
      if (module && typeof module.registerSW === 'function') {
        module.registerSW({ immediate: true })
      }
    }).catch(() => {
      // Fallback: register service worker manually if PWA module fails
      navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch(() => {})
    })
  } else {
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      registrations.forEach((r) => r.unregister())
    })
    caches.keys().then((keys) => keys.forEach((k) => caches.delete(k)))
  }
}

const rootEl = document.getElementById('root')!
createRoot(rootEl).render(
  <React.StrictMode>
    <ToastProvider>
      <App />
    </ToastProvider>
  </React.StrictMode>
)