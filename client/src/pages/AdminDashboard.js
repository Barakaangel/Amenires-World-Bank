import React from 'react';
import { Container, Typography, Box, Grid, Card, CardContent } from '@mui/material';
import { useQuery } from 'react-query';
import axios from 'axios';

function AdminDashboardPage() {
  const { data: dashboardData, isLoading } = useQuery('adminDashboard', async () => {
    const response = await axios.get('/api/admin/dashboard', {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    });
    return response.data.data;
  });

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <Typography>Loading...</Typography>
      </Box>
    );
  }

  return (
    <Container maxWidth="xl">
      <Typography variant="h4" gutterBottom>
        Admin Dashboard
      </Typography>

      <Grid container spacing={3} sx={{ mt: 2 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="text.secondary">
                Total Users
              </Typography>
              <Typography variant="h4">
                {dashboardData?.users?.total || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="text.secondary">
                Active Accounts
              </Typography>
              <Typography variant="h4">
                {dashboardData?.accounts?.active || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="text.secondary">
                Total Transactions
              </Typography>
              <Typography variant="h4">
                {dashboardData?.transactions?.total || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="text-secondary">
                Today's Transactions
              </Typography>
              <Typography variant="h4">
                {dashboardData?.transactions?.today || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Card sx={{ mt: 4 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            System Status
          </Typography>
          <Typography variant="body2">
            AI Superintelligences: {dashboardData?.system?.aiSuperintelligences}
          </Typography>
          <Typography variant="body2">
            Data Centers: {dashboardData?.system?.dataCenters}
          </Typography>
          <Typography variant="body2">
            Backup Sites: {dashboardData?.system?.backupSites}
          </Typography>
          <Typography variant="body2">
            Orbital Nodes: {dashboardData?.system?.orbitalNodes}
          </Typography>
        </CardContent>
      </Card>
    </Container>
  );
}

export default AdminDashboardPage;
