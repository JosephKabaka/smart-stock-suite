import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  CircularProgress,
  Divider
} from '@mui/material';
import HistoryIcon from '@mui/icons-material/History';
import API from '../api';

export default function StockLogsPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  // 1. FETCH LOGS FROM BACKEND
  const fetchLogs = async () => {
    try {
      setLoading(true);
      // Updated to use the API instance (automatically includes Auth header)
      const response = await API.get('/api/transactions/logs');
      
      setLogs(response.data);
    } catch (error) {
      console.error("Error fetching stock logs:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  // 2. STATUS COLOR LOGIC
  const getStatusChip = (status) => {
    const isClosed = status?.toLowerCase() === 'closed';
    return (
      <Chip 
        label={status?.toUpperCase()} 
        size="small"
        sx={{
          fontWeight: 'bold',
          width: '80px',
          backgroundColor: isClosed ? 'rgba(40, 167, 69, 0.1)' : 'rgba(255, 193, 7, 0.1)',
          color: isClosed ? '#28a745' : '#ffc107',
          border: `1px solid ${isClosed ? '#28a745' : '#ffc107'}`
        }} 
      />
    );
  };

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: '1100px', margin: '0 auto' }}>
      
      {/* HEADER SECTION */}
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <HistoryIcon sx={{ fontSize: 32, color: 'primary.main' }} />
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
            Stocks Movement Logs
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Historical record of dispatched, returned, and sold items.
          </Typography>
        </Box>
      </Box>

      <Divider sx={{ mb: 4 }} />

      {/* TABLE SECTION */}
      <Box
        sx={{
          maxWidth: {
            xs: '290px',  
            sm: "650px", 
            md: "100%"    
          }
        }}>
        <TableContainer 
          component={Paper} 
          elevation={3}
          sx={{ 
            borderRadius: 3,
            overflowX: 'auto', // Mobile swipe support
            width: '100%',
            '&::-webkit-scrollbar': { height: '8px' },
            '&::-webkit-scrollbar-thumb': { backgroundColor: '#ccc', borderRadius: '4px' }
          }}
        >
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 8 }}>
              <CircularProgress />
            </Box>
          ) : (
            <Table sx={{ minWidth: 900 }} aria-label="stock logs table">
              <TableHead sx={{ backgroundColor: '#f5f7f9' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold' }}>Date</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Worker</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 'bold' }}>Dispatched</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 'bold' }}>Returned</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 'bold' }}>Sold</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold' }}>Cash (KES)</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 'bold' }}>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {logs.map((log) => (
                  <TableRow key={log.id} hover>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>
                      {new Date(log.date).toLocaleDateString()}
                    </TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>{log.worker_name}</TableCell>
                    <TableCell align="center">{log.boxes_dispatched}</TableCell>
                    <TableCell align="center">{log.boxes_returned}</TableCell>
                    <TableCell align="center" sx={{ color: 'primary.main', fontWeight: 'bold' }}>
                      {log.boxes_dispatched - log.boxes_returned}
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 'bold', color: '#2e7d32' }}>
                      {Number(log.cash_collected).toLocaleString()}
                    </TableCell>
                    <TableCell align="center">
                      {getStatusChip(log.status)}
                    </TableCell>
                  </TableRow>
                ))}
                {logs.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 5, color: 'text.secondary' }}>
                      No stock movements found for your business.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </TableContainer>
      </Box>
    </Box>
  );
}