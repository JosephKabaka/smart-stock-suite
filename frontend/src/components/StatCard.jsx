import { Card, Box, Typography } from '@mui/material';

export default function StatCard({ title, value, color }) {
  return (
    <Card 
      elevation={2} 
      sx={{ 
        display: 'flex', 
        borderRadius: 2,
        overflow: 'hidden', // Ensures the border doesn't overlap corners
        height: '140px'
      }}
    >
      {/* The Colored Left Border Strip */}
      <Box sx={{ width: 6, backgroundColor: color }} />
      
      <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 500 }}>
          {title}
        </Typography>
        <Typography variant="h3" sx={{ mt: 1, fontWeight: 'bold' }}>
          {value}
        </Typography>
      </Box>
    </Card>
  );
}