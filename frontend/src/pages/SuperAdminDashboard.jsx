import React, { useState, useContext } from 'react';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  Grid,
  Alert,
  Container,
  Divider,
  InputAdornment,
  MenuItem,
  AppBar,
  Toolbar,
  IconButton
} from '@mui/material';
import BusinessIcon from '@mui/icons-material/Business';
import EmailIcon from '@mui/icons-material/Email';
import LockIcon from '@mui/icons-material/Lock';
import CategoryIcon from '@mui/icons-material/Category';
import LogoutIcon from '@mui/icons-material/Logout';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function SuperAdminDashboard() {
  const { logout, user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    businessName: '',
    email: '',
    password: '',
    productType: 'Bakery' // Default value
  });

  const [status, setStatus] = useState({ type: '', msg: '' });
  const [loading, setLoading] = useState(false);

  // Common product categories for your clients
  const productCategories = [
    'Bakery',
    'Boxes',
    'Pakets',
    'Bottle',
    'Gas Cylinders',
    'General Retail',
    'Dairy/Milk'
  ];

  const handleLogout = () => {
    logout();
    navigate('/superadmin-login');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus({ type: 'info', msg: 'Provisioning new business environment...' });

    try {
      const token = localStorage.getItem('token');
      await axios.post(
        'http://localhost:3000/api/auth/register-business',
        formData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setStatus({
        type: 'success',
        msg: `Successfully created ${formData.businessName}! Admin credentials sent to ${formData.email}.`
      });

      // Reset form
      setFormData({ businessName: '', email: '', password: '', productType: 'Bakery' });
      
      // Clear success message after 5 seconds
      setTimeout(() => setStatus({ type: '', msg: '' }), 5000);

    } catch (error) {
      console.error("Registration error:", error);
      const errorMsg = error.response?.data?.msg || 'Failed to register business. Ensure email is unique.';
      setStatus({ type: 'error', msg: errorMsg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ bgcolor: '#f4f6f8', minHeight: '100vh' }}>
      {/* Top Admin Bar */}
      <AppBar position="static" sx={{ bgcolor: '#2c3e50', mb: 4 }}>
        <Toolbar>
          <AdminPanelSettingsIcon sx={{ mr: 2 }} />
          <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 'bold' }}>
           Cloud Administration
          </Typography>
          <Typography variant="body2" sx={{ mr: 3, opacity: 0.8 }}>
            Logged in as: {user?.email}
          </Typography>
          <Button 
            color="inherit" 
            startIcon={<LogoutIcon />} 
            onClick={handleLogout}
            sx={{ textTransform: 'none' }}
          >
            Logout
          </Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg">
        <Grid container spacing={4}>
          {/* Main Form Section */}
          <Grid item xs={12} md={8}>
            <Paper elevation={3} sx={{ p: 4, borderRadius: 3 }}>
              <Typography variant="h5" sx={{ mb: 1, fontWeight: 'bold' }}>
                Onboard New Client
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
                This will create a new isolated database tenant and an administrator account.
              </Typography>

              {status.msg && (
                <Alert severity={status.type} sx={{ mb: 3 }}>
                  {status.msg}
                </Alert>
              )}

              <Box component="form" onSubmit={handleSubmit}>
                <Grid container spacing={3}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Business Name"
                      required
                      value={formData.businessName}
                      onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <BusinessIcon color="action" />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <TextField
                      select
                      fullWidth
                      label="Product Type"
                      required
                      value={formData.productType}
                      onChange={(e) => setFormData({ ...formData, productType: e.target.value })}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <CategoryIcon color="action" />
                          </InputAdornment>
                        ),
                      }}
                    >
                      {productCategories.map((option) => (
                        <MenuItem key={option} value={option}>
                          {option}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>

                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      type="email"
                      label="Client Admin Email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <EmailIcon color="action" />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      type="password"
                      label="Initial Admin Password"
                      required
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <LockIcon color="action" />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <Button
                      type="submit"
                      fullWidth
                      variant="contained"
                      size="large"
                      disabled={loading}
                      sx={{ 
                        py: 2, 
                        fontWeight: 'bold', 
                        fontSize: '1rem',
                        bgcolor: '#2c3e50',
                        '&:hover': { bgcolor: '#1a252f' }
                      }}
                    >
                      {loading ? 'Deploying...' : 'Initialize Business Tenant'}
                    </Button>
                  </Grid>
                </Grid>
              </Box>
            </Paper>
          </Grid>

          {/* Sidebar Stats/Info */}
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 3, borderRadius: 3, bgcolor: '#fff', borderLeft: '5px solid #2c3e50' }}>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                System Status
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Box sx={{ mb: 2 }}>
                <Typography variant="caption" display="block" color="text.secondary">
                  API ENDPOINT
                </Typography>
                <Typography variant="body2" sx={{ fontFamily: 'monospace', bgcolor: '#eee', p: 0.5 }}>
                  /api/auth/register-business
                </Typography>
              </Box>
              <Box sx={{ mb: 2 }}>
                <Typography variant="caption" display="block" color="text.secondary">
                  SECURITY LEVEL
                </Typography>
                <Typography variant="body2" color="error.main" sx={{ fontWeight: 'bold' }}>
                  Tier 1 - Master Authorization
                </Typography>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}