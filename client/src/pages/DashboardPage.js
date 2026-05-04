import React, { useState } from 'react';
import { Container, Box, Grid, Card, CardContent, Typography, Button, Chip, CircularProgress } from '@mui/material';
import { useQuery } from 'react-query';
import axios from 'axios';
import { AccountBalance, AccountBalanceWallet, TrendingUp, Security, ArrowForward, Notifications } from '@mui/icons-material';

function DashboardPage() {
  const { data: accountsData, isLoading } = useQuery('accounts', async () => {
    const response = await axios.get('/api/accounts', {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    });
    return response.data.data;
  });

  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const accountTypeLabels = {
    individual: 'Individual',
    business: 'Business',
    royalty: 'Royalty',
    government: 'Government',
    country_owner: 'Country Owner',
    continental: 'Continental'
  };

  const accountTypeColors = {
    individual: 'primary',
    business: 'success',
    royalty: 'secondary',
    government: 'info',
    country_owner: 'warning',
    continental: 'error'
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  const { accounts, summary } = accountsData || { accounts: [], summary: {} };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f5f5f5', py: 4 }}>
      <Container maxWidth="xl">
        {/* Welcome Section */}
        <Card sx={{ mb: 4, background: 'linear-gradient(135deg, #1a237e 0%, #0d47a1 100%)', color: 'white' }}>
          <CardContent sx={{ p: 4 }}>
            <Typography variant="h4" gutterBottom>
              Welcome back, {user.firstName}!
            </Typography>
            <Typography variant="h6" sx={{ opacity: 0.9 }}>
              {accountTypeLabels[user.accountType]} Account
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
              <Chip label={user.email} icon={<Notifications />} />
              <Chip label={user.country} />
            </Box>
          </CardContent>
        </Card>

        {/* Summary Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <AccountBalance color="primary" fontSize="large" />
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Total Accounts
                    </Typography>
                    <Typography variant="h4" fontWeight="bold">
                      {summary.totalAccounts || 0}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <AccountBalanceWallet color="primary" fontSize="large" />
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Total Balance
                    </Typography>
                    <Typography variant="h4" fontWeight="bold">
                      ${(summary.totalBalance || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <TrendingUp color="success" fontSize="large" />
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Available Balance
                    </Typography>
                    <Typography variant="h4" fontWeight="bold">
                      ${(summary.totalAvailableBalance || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Security color="warning" fontSize="large" />
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Security Score
                    </Typography>
                    <Typography variant="h4" fontWeight="bold">
                      {user.twoFactorEnabled ? '98%' : '75%'}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Quick Actions */}
        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom fontWeight="bold">
              Quick Actions
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={6} md={3}>
                <Button
                  fullWidth
                  variant="contained"
                  startIcon={<TrendingUp />}
                  href="/transfer"
                  sx={{ py: 2 }}
                >
                  Transfer
                </Button>
              </Grid>
              <Grid item xs={6} md={3}>
                <Button
                  fullWidth
                  variant="outlined"
                  href="/accounts"
                  sx={{ py: 2 }}
                >
                  Accounts
                </Button>
              </Grid>
              <Grid item xs={6} md={3}>
                <Button
                  fullWidth
                  variant="outlined"
                  href="/transactions"
                  sx={{ py: 2 }}
                >
                  Transactions
                </Button>
              </Grid>
              <Grid item xs={6} md={3}>
                <Button
                  fullWidth
                  variant="outlined"
                  href="/security"
                  sx={{ py: 2 }}
                >
                  Security
                </Button>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Accounts List */}
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6" fontWeight="bold">
                Your Accounts
              </Typography>
              <Button endIcon={<ArrowForward />} href="/accounts">
                View All
              </Button>
            </Box>
            {accounts.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 6 }}>
                <Typography variant="body1" color="text.secondary">
                  You don't have any accounts yet. Create your first account to get started!
                </Typography>
                <Button variant="contained" href="/accounts" sx={{ mt: 2 }}>
                  Create Account
                </Button>
              </Box>
            ) : (
              <Grid container spacing={2}>
                {accounts.map((account) => (
                  <Grid item xs={12} md={6} key={account.accountNumber}>
                    <Card variant="outlined">
                      <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 2 }}>
                          <Box>
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                              {account.accountType.toUpperCase()}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ fontFamily: 'monospace' }}>
                              {account.accountNumber}
                            </Typography>
                          </Box>
                          <Chip
                            label={account.status.toUpperCase()}
                            color={account.status === 'active' ? 'success' : 'warning'}
                            size="small"
                          />
                        </Box>
                        <Typography variant="h5" fontWeight="bold" color="primary" gutterBottom>
                          ${parseFloat(account.balance.toString()).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Available: ${parseFloat(account.availableBalance.toString()).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </Typography>
                        <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                          <Chip label={account.currency} size="small" />
                          <Chip label={`${(account.interestRate * 100).toFixed(2)}% APY`} size="small" />
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}
          </CardContent>
        </Card>

        {/* Security Banner */}
        {!user.twoFactorEnabled && (
          <Card sx={{ mt: 4, bgcolor: '#fff3e0' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Security color="warning" fontSize="large" />
                <Box sx={{ flex: 1 }}>
                  <Typography variant="h6" fontWeight="bold" color="text.primary">
                    Enhance Your Security
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Enable two-factor authentication to protect your account from unauthorized access.
                  </Typography>
                </Box>
                <Button variant="contained" color="primary" href="/security">
                  Enable 2FA
                </Button>
              </Box>
            </CardContent>
          </Card>
        )}
      </Container>
    </Box>
  );
}

export default DashboardPage;
