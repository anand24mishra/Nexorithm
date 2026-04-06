import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'
import { Auth0Provider } from "@auth0/auth0-react";

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Auth0Provider
      domain="dev-sx00dg2irldmos1g.us.auth0.com"
      clientId="vi6d4gsXwpxwLx0v1yUQijA0rvtYUYxM"
      authorizationParams={{ redirect_uri: window.location.origin }}
    >
      <App />
    </Auth0Provider>
    
  </StrictMode>,
)
