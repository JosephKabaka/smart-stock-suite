import React, { useState, useEffect } from 'react';
import { Typography, Grid, Box, Paper, TextField, MenuItem, Button, Alert, CircularProgress } from '@mui/material';
import axios from 'axios';
import StatCard from '../components/StatCard';

export default function Dashboard() {
  // 1. States for Data
  const [stats, setStats] = useState({ warehouseStock: 0, soldToday: 0, workerBoxes: 0 });
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // 2. States for the Dispatch Form
  const [formData, setFormData] = useState({ employeeId: '', boxes: '' });
  const [status, setStatus] = useState({ type: '', msg: '', context: '' });
  //States for the add product form 
  const [prodBoxes, setProdBoxes] = useState('');
  //State for worker return form 
  const [returnForm, setReturnForm] = useState({ employeeId: '', boxesReturned: '', amountCollected: '' });

  // Helper for Authorization Header
  const getAuthHeader = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
  });

  // 3. Fetch Data on Page Load
  const fetchDashboardData = async () => {
    try {
      // Updated link to match new multi-tenant route
      const response = await axios.get('http://localhost:3000/api/inventory', getAuthHeader());

      const { stats, employees } = response.data;

      setStats(stats);
      setEmployees(employees);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching data:", error);
      setStatus({ 
        type: 'error', 
        msg: 'Could not connect to the server. Please check if you are logged in.',
        context: 'main'
      });
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Handle the dispatch products/workers
  const handleDispatchSubmit = async (e) => {
    e.preventDefault();
    setStatus({ type: 'info', msg: 'Processing dispatch...', context: 'dispatch' });

    try {
      // Updated link
      await axios.post('http://localhost:3000/api/transactions/dispatch', formData, getAuthHeader());
      
      setStatus({ type: 'success', msg: 'Dispatch successful!', context: 'dispatch' });
      setFormData({ employeeId: '', boxes: '' });
      
      fetchDashboardData(); // Refresh the data
      
      setTimeout(() => setStatus({ type: '', msg: '', context: '' }), 4000);

    } catch (error) {
    // 1. Log the full response to the console so you can see exactly what the server sent
    console.error("Full Error Object:", error.response);

    let errorMessage = "An unexpected error occurred.";

    // 2. Check for Permission Denied (403) specifically
    if (error.response?.status === 403) {
      errorMessage = "Permission Denied: Only Admins can dispatch workers.";
    } 
    // 3. Check for specific server message in various common formats
    else if (error.response?.data) {
      errorMessage = 
        error.response.data.message || 
        error.response.data.msg || 
        (typeof error.response.data === 'string' ? error.response.data : "Worker is already out!");
    }

    setStatus({ 
      type: 'error', 
      msg: errorMessage, 
      context: 'dispatch' 
    });
  }
  };

  //Handle the adding products
  const handleProductionSubmit = async (e) => {
    e.preventDefault();
    setStatus({ type: 'info', msg: 'Updating warehouse stock...', context: 'production' });
    try {
      // Updated link
      await axios.post('http://localhost:3000/api/inventory/add', { boxes: prodBoxes }, getAuthHeader());
      setProdBoxes('');
      setStatus({ type: 'success', msg: 'Stock updated!', context: 'production' });

      fetchDashboardData();
      setTimeout(() => setStatus({ type: '', msg: '' }), 3000);
    } catch (error) {
    // Log for debugging
    console.error("Production Error:", error.response);

    let errorMessage = "Failed to update stock.";

    // 1. Check if the user is not an Admin (403)
    if (error.response?.status === 403) {
      errorMessage = "Permission Denied: Only Admins can add stock to the warehouse.";
    } 
    // 2. Try to extract a specific message from the server
    else if (error.response?.data) {
      errorMessage = 
        error.response.data.message || 
        error.response.data.msg || 
        (typeof error.response.data === 'string' ? error.response.data : errorMessage);
    }

    setStatus({ 
      type: 'error', 
      msg: errorMessage, 
      context: 'production' 
    });
  }
  };

  //handle return worker 
  const handleReturnSubmit = async (e) => {
    e.preventDefault();
    setStatus({ type: 'info', msg: 'Processing return...', context: 'return' });

    try {
      // Updated link
      await axios.post('http://localhost:3000/api/transactions/return', returnForm, getAuthHeader());
      setReturnForm({ employeeId: '', boxesReturned: '', amountCollected: '' }); // Reset
      setStatus({ type: 'success', msg: 'Worker settled and stock updated!', context: 'return' });

      fetchDashboardData(); // Refresh dashboard stats
      
      setTimeout(() => setStatus({ type: '', msg: '' }), 3000);
    } catch (error) {
    // Log for debugging
    console.error("Return Error:", error.response);

    let errorMessage = "Failed to settle worker.";

    // 1. Check if the user is not an Admin (403)
    if (error.response?.status === 403) {
      errorMessage = "Permission Denied: Only Admins can settle worker returns.";
    } 
    // 2. Try to extract a specific message from the server
    else if (error.response?.data) {
      errorMessage = 
        error.response.data.message || 
        error.response.data.msg || 
        (typeof error.response.data === 'string' ? error.response.data : errorMessage);
    }

    setStatus({ 
      type: 'error', 
      msg: errorMessage, 
      context: 'return' 
    });
  }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 4, fontWeight: 'bold' }}>Manager Dashboard</Typography>

      {/* Stats Cards using Dynamic Data */}
      <Grid container spacing={3}>
        <Grid item xs={12} sm={4}>
          <StatCard title="Warehouse Stock" value={stats.warehouseStock} color="#2196f3" />
        </Grid>
        <Grid item xs={12} sm={4}>
          <StatCard title="Sold Today" value={stats.soldToday} color="#4caf50" />
        </Grid>
        <Grid item xs={12} sm={4}>
          <StatCard title="Boxes with Workers" value={stats.workerBoxes} color="#f44336" />
        </Grid>
      </Grid>

      {/* Dispatch Form Section */}
      <Paper elevation={1} sx={{ mt: 4, p: 4, borderRadius: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <Typography variant="h6" sx={{ mb: 3, color: 'text.secondary' }}>Dispatch Worker (Morning)</Typography>
        
        {status.msg && status.context === 'dispatch' && (
          <Alert severity={status.type} sx={{ mb: 2 }}>{status.msg}</Alert>
        )}

        <Box component="form" onSubmit={handleDispatchSubmit} sx={{ 
          width: { xs: '100%', md: '50%' }, 
          display: 'flex', 
          flexDirection: 'column',
          gap: 2 
        }}>
          <Grid container spacing={2} direction="column">
            <Grid item>
              <TextField
                select
                fullWidth
                name="employeeId"
                label="Select Employee"
                value={formData.employeeId}
                onChange={handleChange}
                required
              >
                {employees.map((emp) => (
                  <MenuItem key={emp.id} value={emp.id}>
                    {emp.name}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            
            <Grid item>
              <TextField
                fullWidth
                name="boxes"
                label="Number of Boxes"
                type="number"
                value={formData.boxes}
                onChange={handleChange}
                required
                slotProps={{
                  htmlInput: {
                    min: 0,
                  },
                }}
              />
            </Grid>
            
            <Grid item sx={{ mt: 1 }}>
              <Button type="submit" fullWidth variant="contained" size="large">
                Dispatch
              </Button>
            </Grid>
          </Grid>
        </Box>
      </Paper>

      {/* production form html */}
      <Paper 
        elevation={1} 
        sx={{ 
          mt: 4, p: 4, borderRadius: 2, display: 'flex', 
          flexDirection: 'column', alignItems: 'center', 
          borderLeft: '6px solid #4caf50' 
        }}
      >
        <Typography variant="h6" sx={{ mb: 3, fontWeight: 'bold', color: '#2e7d32' }}>Factory Production Entry</Typography>
        {status.msg && status.context === 'production' && (
          <Alert severity={status.type} sx={{ mb: 2 }}>{status.msg}</Alert>
        )}
        <Box component="form" onSubmit={handleProductionSubmit} sx={{ width: { xs: '100%', md: '50%' }, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Grid container spacing={2} direction="column">
            <Grid item>
              <TextField 
                fullWidth label="Boxes Manufactured" type="number" 
                value={prodBoxes} 
                onChange={(e) => setProdBoxes(e.target.value)} 
                required slotProps={{ htmlInput: { min: 1 } }} 
              />
            </Grid>
            <Grid item sx={{ mt: 1 }}>
              <Button type="submit" fullWidth variant="contained" color="success" size="large" sx={{ py: 1.5 }}>
                Update Stock
              </Button>
            </Grid>
          </Grid>
        </Box>
      </Paper>

      {/* WORKER RETURN FORM (EVENING) */}
      <Paper 
        elevation={1} 
        sx={{ 
          mt: 4, p: 4, borderRadius: 2, display: 'flex', 
          flexDirection: 'column', alignItems: 'center', 
          borderLeft: '6px solid #ff9800' 
        }}
      >
        <Typography variant="h6" sx={{ mb: 3, fontWeight: 'bold', color: '#ed6c02' }}>
          Worker Return (Evening Settlement)
        </Typography>

        {status.msg && status.context === 'return' && (
          <Alert severity={status.type} sx={{ mb: 2, width: '100%' }}>{status.msg}</Alert>
        )}

        <Box 
          component="form" 
          onSubmit={handleReturnSubmit} 
          sx={{ width: { xs: '100%', md: '50%' }, display: 'flex', flexDirection: 'column', gap: 2 }}
        >
          <TextField
            select fullWidth label="Select Worker"
            value={returnForm.employeeId}
            onChange={(e) => setReturnForm({...returnForm, employeeId: e.target.value})}
            required
          >
            {employees.map((emp) => (
              <MenuItem key={emp.id} value={emp.id}>{emp.name}</MenuItem>
            ))}
          </TextField>

          <TextField
            fullWidth label="Boxes Returned (Unsold)"
            type="number"
            value={returnForm.boxesReturned}
            onChange={(e) => setReturnForm({...returnForm, boxesReturned: e.target.value})}
            required
            slotProps={{ htmlInput: { min: 0 } }}
          />

          <TextField
            fullWidth label="Amount Collected (KSh)"
            type="number"
            value={returnForm.amountCollected}
            onChange={(e) => setReturnForm({...returnForm, amountCollected: e.target.value})}
            required
            slotProps={{ htmlInput: { min: 0 } }}
          />

          <Button 
            type="submit" 
            fullWidth 
            variant="contained" 
            color="warning" 
            size="large" 
            sx={{ py: 1.5, fontWeight: 'bold' }}
          >
            Close Day & Settle
          </Button>
        </Box>
      </Paper>
    </Box>
  );
}