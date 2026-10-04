import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { loadTestDataFromUrl } from './lib/testData.js'

// Dev-only: ?testdata loads the calculation test set (see docs/calculation-test.md).
// import.meta.env.DEV is false in production builds, so this call and the test data are dropped.
if (import.meta.env.DEV) loadTestDataFromUrl()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
