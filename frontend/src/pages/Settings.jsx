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
  IconButton,
  MenuItem
} from '@mui/material';
import BusinessIcon from '@mui/icons-material/Business';
import LockIcon from '@mui/icons-material/Lock';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import SaveIcon from '@mui/icons-material/Save';
import API from '../api';
import { AuthContext } from '../context/AuthContext';

export default function Settings() {
  // Pulling 'updateUser' from context to refresh the UI globally
  const { user, updateUser } = useContext(AuthContext);
  
  // States for Business Info
  const [businessName, setBusinessName] = useState(user?.businessName || '');
  const [productType, setProductType] = useState(user?.productType || 'Bakery');
  
  // States for Password Change
  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState({ type: '', msg: '' });
  const [loading, setLoading] = useState(false);

  const productCategories = [
    'Bakery',
    'Boxes',
    'Packets',
    'Bottle',
    'Gas Cylinders',
    'General Retail',
    'Dairy/Milk'
  ];

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus({ type: '', msg: '' });

    try {
      await API.put('/api/business/update-profile', { businessName, productType });
     
      // CRITICAL: This updates the Sidebar and AuthContext state instantly
      updateUser({ businessName, productType });
      
      setStatus({ type: 'success', msg: 'Business profile updated successfully!' });
    } catch (err) {
      setStatus({ type: 'error', msg: err.response?.data?.msg || 'Failed to update profile.' });
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    setStatus({ type: '', msg: '' });

    if (passwords.newPassword !== passwords.confirmPassword) {
      return setStatus({ type: 'error', msg: 'New passwords do not match.' });
    }

    setLoading(true);
    try {
      // Matches the endpoint in your controller (changePassword)
      await API.put('/api/auth/changePassword', { 
        currentPassword: passwords.currentPassword, 
        newPassword: passwords.newPassword 
      });

      setStatus({ type: 'success', msg: 'Password changed successfully!' });
      // Clear the fields for security
      setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      setStatus({ type: 'error', msg: err.response?.data?.msg || 'Current password incorrect.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 3 }}>Settings</Typography>

      {status.msg && (
        <Alert 
          severity={status.type} 
          sx={{ mb: 3 }} 
          onClose={() => setStatus({type:'', msg:''})}
        >
          {status.msg}
        </Alert>
      )}

      <Grid container spacing={4}>
        {/* Business Information Section */}
        <Grid item xs={12}>
          <Paper elevation={2} sx={{ p: 4, borderRadius: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <BusinessIcon color="primary" /> Business Profile
            </Typography>
            <Divider sx={{ mb: 3 }} />
            <Box component="form" onSubmit={handleProfileUpdate}>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Business Name"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    select
                    fullWidth
                    label="Product Type"
                    value={productType}
                    onChange={(e) => setProductType(e.target.value)}
                  >
                    {productCategories.map((option) => (
                      <MenuItem key={option} value={option}>{option}</MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid item xs={12}>
                  <Button 
                    variant="contained" 
                    type="submit" 
                    startIcon={<SaveIcon />} 
                    disabled={loading}
                    sx={{ fontWeight: 'bold' }}
                  >
                    {loading ? 'Saving...' : 'Update Profile'}
                  </Button>
                </Grid>
              </Grid>
            </Box>
          </Paper>
        </Grid>

        {/* Security / Password Section */}
        <Grid item xs={12}>
          <Paper elevation={2} sx={{ p: 4, borderRadius: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <LockIcon color="primary" /> Security
            </Typography>
            <Divider sx={{ mb: 3 }} />
            <Box component="form" onSubmit={handlePasswordUpdate}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Current Password"
                    type={showPassword ? 'text' : 'password'}
                    value={passwords.currentPassword}
                    onChange={(e) => setPasswords({...passwords, currentPassword: e.target.value})}
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="New Password"
                    type={showPassword ? 'text' : 'password'}
                    value={passwords.newPassword}
                    onChange={(e) => setPasswords({...passwords, newPassword: e.target.value})}
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Confirm New Password"
                    type={showPassword ? 'text' : 'password'}
                    value={passwords.confirmPassword}
                    onChange={(e) => setPasswords({...passwords, confirmPassword: e.target.value})}
                    required
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton onClick={() => setShowPassword(!showPassword)}>
                            {showPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Button 
                    variant="contained" 
                    color="secondary" 
                    type="submit" 
                    disabled={loading}
                    sx={{ fontWeight: 'bold' }}
                  >
                    {loading ? 'Processing...' : 'Change Password'}
                  </Button>
                </Grid>
              </Grid>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
}