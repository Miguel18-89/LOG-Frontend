import { createRoot } from 'react-dom/client';
import React from 'react';
import App from './App.jsx';
import { BrowserRouter } from 'react-router-dom';
import InterceptorProvider from './contexts/InterceptorProvider.js';
import { AuthProvider } from './contexts/AuthContext.jsx';

import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

const theme = createTheme(); // ⚠️ Isso cria todas as funções internas (pxToRem, shadows, spacing, etc.)

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <AuthProvider>
          <InterceptorProvider>
            <App />
          </InterceptorProvider>
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  </React.StrictMode>
);
