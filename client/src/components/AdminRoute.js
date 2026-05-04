import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { Box, Typography } from '@mui/material';

function AdminRoute() {
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (user.role !== 'admin' && user.role !== 'super_admin') {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <Typography variant="h6" color="error">
          Access Denied. Admin privileges required.
        </Typography>
      </Box>
    );
  }

  return <Outlet />;
}

export default AdminRoute;
