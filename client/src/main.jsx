import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { GoogleOAuthProvider } from '@react-oauth/google'; // Thêm dòng này
import './index.css'
import App from './App.jsx'

// Thay thế bằng Client ID thật của bạn
const GOOGLE_CLIENT_ID = "1046989758150-13pj0q144u8lt44faf9r33ief975p9nq.apps.googleusercontent.com";

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <App />
    </GoogleOAuthProvider>
  </StrictMode>,
)