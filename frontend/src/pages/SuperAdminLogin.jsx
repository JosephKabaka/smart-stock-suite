import React, { useState, useContext } from 'react';
import { 
  Box, 
  TextField, 
  Button, 
  Typography, 
  Paper, 
  Container, 
  Alert, 
  Link,
  CircularProgress,
  Avatar
} from '@mui/material';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import API from '../api';
import { AuthContext } from '../context/AuthContext';
import { useNavigate, Link as RouterLink } from 'react-router-dom';

const SuperAdminLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useContext(AuthContext); // Re-using your existing login logic
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      // Using the API instance for the superadmin specific route
      const res = await API.post('/api/auth/superadmin/login', { email, password });
      
      // Store the superadmin user and token
      login(res.data.user, res.data.token);
      
      // Redirect to the special SuperAdmin Dashboard
      navigate('/super-dashboard'); 
    } catch (err) {
      setError(err.response?.data?.msg || 'Access Denied: Invalid SuperAdmin credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container component="main" maxWidth="xs">
      <Box
        sx={{
          marginTop: 12,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Paper 
          elevation={10} 
          sx={{ 
            p: 4, 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center',
            borderRadius: 3,
            width: '100%',
            borderTop: '5px solid #2c3e50' // Dark "Security" accent
          }}
        >
          <Avatar sx={{ m: 1, bgcolor: '#2c3e50', width: 56, height: 56 }}>
            <AdminPanelSettingsIcon fontSize="large" />
          </Avatar>
          
          <Typography component="h1" variant="h5" sx={{ fontWeight: 'bold', mt: 1 }}>
            Master Control
          </Typography>
          
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            System-Wide Administration Only
          </Typography>

          {error && (
            <Alert severity="error" variant="filled" sx={{ width: '100%', mb: 2 }}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%' }}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="SuperAdmin Email"
              name="email"
              autoComplete="email"
              autoFocus
              color="secondary"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Secret Key / Password"
              type="password"
              id="password"
              autoComplete="current-password"
              color="secondary"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            
            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={loading}
              sx={{ 
                mt: 3, 
                mb: 2, 
                py: 1.5, 
                fontWeight: 'bold',
                backgroundColor: '#2c3e50',
                '&:hover': { backgroundColor: '#1a252f' }
              }}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : 'Authorize Access'}
            </Button>

            <Box sx={{ mt: 2, textAlign: 'center' }}>
              <Link 
                component={RouterLink} 
                to="/login" 
                variant="body2" 
                sx={{ 
                  color: 'text.secondary',
                  textDecoration: 'none',
                  '&:hover': { textDecoration: 'underline' } 
                }}
              >
                Return to Business Login
              </Link>
            </Box>
          </Box>
        </Paper>
        
        <Typography variant="caption" color="text.secondary" align="center" sx={{ mt: 4 }}>
          Security Level: Tier 1 Administration
        </Typography>
      </Box>
    </Container>
  );
};

export default SuperAdminLogin;