import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  Grid,
  Alert,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Divider
} from '@mui/material';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import API from '../api';

export default function EmployeesPage() {
  // 1. STATES
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newEmployee, setNewEmployee] = useState({ name: '', phone: '' });
  
  // Split status into two parts: Form and Table
  const [formStatus, setFormStatus] = useState({ type: '', msg: '' });
  const [tableStatus, setTableStatus] = useState({ type: '', msg: '' });

  // 2. FETCH DATA
  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const response = await API.get('/api/employees/performance');
      setEmployees(response.data);
    } catch (error) {
      console.error("Error fetching employees:", error);
      if (error.response?.status === 401) {
        setTableStatus({ type: 'error', msg: 'Session expired. Please log in again.' });
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  // 3. ADD EMPLOYEE HANDLER
  const handleAddEmployee = async (e) => {
    e.preventDefault();
    try {
      setFormStatus({ type: 'info', msg: 'Registering...' });
      await API.post('/api/employees/add', newEmployee);
      
      setNewEmployee({ name: '', phone: '' });
      setFormStatus({ type: 'success', msg: 'Employee registered successfully!' });
      fetchEmployees();
      setTimeout(() => setFormStatus({ type: '', msg: '' }), 3000);
    } catch (error) {
      let errorMsg = 'Failed to add employee.';
      if (error.response?.status === 403) {
        errorMsg = "Impossible: You are not an admin and cannot register employees.";
      } else if (error.response?.data?.msg) {
        errorMsg = error.response.data.msg;
      }
      
      setFormStatus({ type: 'error', msg: errorMsg });
      setTimeout(() => setFormStatus({ type: '', msg: '' }), 4000);
    }
  };

  // 4. TOGGLE STATUS HANDLER
  const handleToggleStatus = async (id, currentIsActive) => {
    try {
      await API.patch(`/api/employees/toggle/${id}`, {
        is_active: !currentIsActive
      });
      setTableStatus({ type: 'success', msg: 'Status updated successfully!' });
      fetchEmployees();
      setTimeout(() => setTableStatus({ type: '', msg: '' }), 3000);
    } catch (error) {
      console.error("Toggle error:", error);
      
      let errorMsg = 'An error occurred while updating status.';
      
      if (error.response?.status === 403) {
        errorMsg = "Impossible: You are not an admin and cannot activate/deactivate staff.";
      } else if (error.response?.data?.msg) {
        errorMsg = error.response.data.msg;
      }

      setTableStatus({ type: 'error', msg: errorMsg });
      setTimeout(() => setTableStatus({ type: '', msg: '' }), 4000);
    }
  };

  return (
    <Box sx={{
      width:'100%',
      maxWidth: '900px', margin: '0 auto' }}>
      
      {/* SECTION 1: ADD EMPLOYEE FORM */}
      <Typography variant="h5" sx={{ fontWeight: 'bold', color: 'text.primary', marginBottom:'10px' }}>
          Employee Directory & Performance
        </Typography>
      <Paper elevation={3} sx={{ p: { xs: 3, md: 5 }, borderRadius: 3, mb: 5 }}>
        <Typography variant="h6" sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1, fontWeight: 'bold' }}>
          <PersonAddIcon color="primary" /> Add New Staff
        </Typography>

        {/* SHOW ONLY FORM STATUS HERE */}
        {formStatus.msg && (
          <Alert severity={formStatus.type} sx={{ mb: 3 }}>
            {formStatus.msg}
          </Alert>
        )}

        <Box component="form" onSubmit={handleAddEmployee}>
          <Grid container spacing={3} direction="column">
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Full Name"
                variant="outlined"
                value={newEmployee.name}
                onChange={(e) => setNewEmployee({ ...newEmployee, name: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Phone Number"
                variant="outlined"
                value={newEmployee.phone}
                onChange={(e) => setNewEmployee({ ...newEmployee, phone: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                sx={{ py: 1.5, fontWeight: 'bold', fontSize: '1rem' }}
              >
                Register Employee
              </Button>
            </Grid>
          </Grid>
        </Box>
      </Paper>

      <Divider sx={{ mb: 5 }} />

      {/* SECTION 2: PERFORMANCE TABLE */}
      <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold', color: 'text.secondary', textAlign: 'center' }}>
        Performance Overview (30 Days)
      </Typography>

      {/* SHOW ONLY TABLE STATUS HERE */}
      {tableStatus.msg && (
        <Alert severity={tableStatus.type} sx={{ mb: 3 }}>
          {tableStatus.msg}
        </Alert>
      )}

      <Box
        sx={{
          maxWidth: {
             xs: '290px',  
             sm: "650px", 
             md: "100%"    
          }
        }}
      >
        <TableContainer 
          component={Paper} 
          elevation={2}
          sx={{ 
            borderRadius: 2, 
            overflowX: 'auto',
            width: '100%',
            '&::-webkit-scrollbar': { height: '8px' },
            '&::-webkit-scrollbar-thumb': { backgroundColor: '#bbb', borderRadius: '4px' }
          }}
        >
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
              <CircularProgress />
            </Box>
          ) : (
            <Table sx={{ minWidth:'1110px' }} aria-label="employee table">
              <TableHead sx={{ backgroundColor: '#f8f9fa' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold' }}>Name</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 'bold' }}>Boxes Sold</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Phone</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold' }}>Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {employees.map((worker) => (
                  <TableRow key={worker.id} hover>
                    <TableCell sx={{ fontWeight: 'bold', whiteSpace: 'nowrap' }}>
                      {worker.name}
                    </TableCell>
                    
                    <TableCell>
                      <Box sx={{
                        display: 'inline-block',
                        px: 1.5, py: 0.5, borderRadius: 1,
                        fontSize: '0.75rem', fontWeight: 'bold',
                        color: worker.is_active ? '#39FF14' : '#f44336',
                        border: `1px solid ${worker.is_active ? '#39FF14' : '#f44336'}`,
                        backgroundColor: worker.is_active ? 'rgba(57, 255, 20, 0.05)' : 'rgba(244, 67, 54, 0.05)',
                        whiteSpace: 'nowrap'
                      }}>
                        {worker.is_active ? '● ACTIVE' : '○ INACTIVE'}
                      </Box>
                    </TableCell>

                    <TableCell align="center" sx={{ fontWeight: 'bold' }}>
                      {worker.total_sold_30_days || 0}
                    </TableCell>

                    <TableCell sx={{ whiteSpace: 'nowrap' }}>
                      <a href={`tel:${worker.phone}`} style={{ textDecoration: 'none', color: '#1976d2', fontWeight: 500 }}>
                        {worker.phone}
                      </a>
                    </TableCell>

                    <TableCell align="right">
                      <Button
                        size="small"
                        variant="outlined"
                        color={worker.is_active ? 'warning' : 'success'}
                        onClick={() => handleToggleStatus(worker.id, worker.is_active)}
                        sx={{ whiteSpace: 'nowrap', fontWeight: 'bold', minWidth: '110px' }}
                      >
                        {worker.is_active ? 'Deactivate' : 'Reactivate'}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </TableContainer>
      </Box>
    </Box>
  );
}