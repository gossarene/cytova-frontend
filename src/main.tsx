import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { hydrateAuth } from '@/lib/auth/store'
import { hydratePlatformAuth } from '@/lib/auth/platform-store'
import { App } from './App'
import './index.css'

// Hydrate auth state from localStorage before first render
hydrateAuth()
hydratePlatformAuth()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
