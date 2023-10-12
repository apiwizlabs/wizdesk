import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { BrowserRouter } from "react-router-dom";
import { GoogleOAuthProvider } from "@react-oauth/google"
import { Store } from "./app/store";
import { Provider } from "react-redux";
import config from './config';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
     <GoogleOAuthProvider 
      clientId={config.GOOGLE_OAUTH_CLIENT_ID} 
      
      onScriptLoadError={() => {
        console.log("gsi script loaded error")
      }}
      onScriptLoadSuccess={() => {
        console.log("gsi script loaded")
      }}
    >
      <Provider store={Store}>
        <BrowserRouter>
            <App />
        </BrowserRouter>
      </Provider>
    </GoogleOAuthProvider>
  </React.StrictMode>
);
