import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { ToastProvider } from './components/ui/ToastProvider'
import './styles/globals.css'

if ('serviceWorker' in navigator) {
  if (import.meta.env.PROD) {
    import('virtual:pwa-register').then(({ registerSW }) => {
      registerSW({ immediate: true })
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