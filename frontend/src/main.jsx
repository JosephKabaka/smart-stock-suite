import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import App from './App';
import theme from './theme'; 
import { AuthProvider } from './context/AuthContext'; // Import the Auth Brain

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      {/* AuthProvider must be inside BrowserRouter to use the 'navigate' function */}
      <AuthProvider>
        <ThemeProvider theme={theme}>
          <CssBaseline /> 
          <App />
        </ThemeProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);