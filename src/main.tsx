import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router'
import './index.css'
import App from './App.tsx'

if (typeof window !== 'undefined') {
  window.addEventListener(
    'error',
    event => {
      if (
        typeof event.message === 'string' &&
        (event.message.includes('ResizeObserver loop completed with undelivered notifications') ||
          event.message.includes('ResizeObserver loop limit exceeded'))
      ) {
        event.stopImmediatePropagation()
        event.preventDefault()
      }
    },
    true
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
