import { createRoot } from 'react-dom/client'
import React from 'react';
import './index.css'
import App from './App.jsx'
import { BrowserRouter } from 'react-router-dom'
import InterceptorProvider from './contexts/InterceptorProvider.js';
import { AuthProvider } from './contexts/AuthContext.jsx';



createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <BrowserRouter>
            <AuthProvider>
                <InterceptorProvider>
                    <App />
                </InterceptorProvider>
            </AuthProvider>
        </BrowserRouter>
    </React.StrictMode>
);
