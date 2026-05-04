import React, { useState } from 'react';
import { Container, Box, Card, CardContent, TextField, Button, Typography, Alert, Link, Divider } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Lock, Email } from '@mui/icons-material';

const schema = yup.object().shape({
  email: yup.string().email('Invalid email address').required('Email is required'),
  password: yup.string().required('Password is required')
});

function LoginPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showTwoFactor, setShowTwoFactor] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: yupResolver(schema)
  });

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const response = await axios.post('/api/auth/login', data);
      
      localStorage.setItem('token', response.data.data.token);
      localStorage.setItem('refreshToken', response.data.data.refreshToken);
      localStorage.setItem('user', JSON.stringify(response.data.data.user));
      
      toast.success('Login successful!');
      
      if (response.data.data.user.role === 'admin' || response.data.data.user.role === 'super_admin') {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    } catch (error) {
      if (error.response?.data?.requireTwoFactor) {
        setShowTwoFactor(true);
        toast('Two-factor authentication code required');
      } else {
        toast.error(error.response?.data?.message || 'Login failed');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', bgcolor: '#f5f5f5', py: 4 }}>
      <Container maxWidth="sm">
        <Card sx={{ boxShadow: 6 }}>
          <CardContent sx={{ p: 4 }}>
            <Typography variant="h4" align="center" gutterBottom color="primary" fontWeight="bold">
              Welcome Back
            </Typography>
            <Typography variant="body1" align="center" color="text.secondary" gutterBottom sx={{ mb: 4 }}>
              Sign in to your Amenires World Bank account
            </Typography>

            <form onSubmit={handleSubmit(onSubmit)}>
              <TextField
                fullWidth
                label="Email Address"
                variant="outlined"
                margin="normal"
                {...register('email')}
                error={!!errors.email}
                helperText={errors.email?.message}
                InputProps={{
                  startAdornment: <Email sx={{ mr: 1, color: 'text.secondary' }} />
                }}
              />

              <TextField
                fullWidth
                label="Password"
                type="password"
                variant="outlined"
                margin="normal"
                {...register('password')}
                error={!!errors.password}
                helperText={errors.password?.message}
                InputProps={{
                  startAdornment: <Lock sx={{ mr: 1, color: 'text.secondary' }} />
                }}
              />

              {showTwoFactor && (
                <TextField
                  fullWidth
                  label="Two-Factor Authentication Code"
                  variant="outlined"
                  margin="normal"
                  {...register('twoFactorCode')}
                  placeholder="Enter 6-digit code"
                  autoFocus
                />
              )}

              <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Link
                  component="button"
                  variant="body2"
                  onClick={() => navigate('/forgot-password')}
                  sx={{ cursor: 'pointer' }}
                >
                  Forgot Password?
                </Link>
              </Box>

              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                disabled={loading}
                sx={{ mt: 3, py: 1.5 }}
              >
                {loading ? 'Signing In...' : 'Sign In'}
              </Button>
            </form>

            <Divider sx={{ my: 3 }} />

            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                Don't have an account?{' '}
                <Link
                  component="button"
                  variant="body2"
                  onClick={() => navigate('/register')}
                  sx={{ fontWeight: 600, cursor: 'pointer' }}
                >
                  Sign Up
                </Link>
              </Typography>
            </Box>

            <Alert severity="info" sx={{ mt: 3 }}>
              <Typography variant="body2">
                Protected by AES-256-GCM encryption and quantum-resistant algorithms
              </Typography>
            </Alert>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
}

export default LoginPage;
