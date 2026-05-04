import React, { useState } from 'react';
import { Container, Box, Card, CardContent, TextField, Button, Typography, Select, MenuItem, FormControl, InputLabel, Alert, Stepper, Step, StepLabel, Divider, Link } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import axios from 'axios';
import toast from 'react-hot-toast';

const steps = ['Personal Information', 'Account Details', 'Security'];

const schema = yup.object().shape({
  firstName: yup.string().required('First name is required'),
  lastName: yup.string().required('Last name is required'),
  email: yup.string().email('Invalid email').required('Email is required'),
  phone: yup.string().required('Phone number is required'),
  country: yup.string().required('Country is required'),
  continent: yup.string().required('Continent is required'),
  accountType: yup.string().required('Account type is required'),
  password: yup.string().min(12, 'Password must be at least 12 characters').required('Password is required'),
  confirmPassword: yup.string().oneOf([yup.ref('password')], 'Passwords must match').required('Confirm password is required')
});

const continents = ['Africa', 'Asia', 'Europe', 'North America', 'South America', 'Oceania', 'Antarctica'];

const accountTypes = [
  { value: 'individual', label: 'Individual', description: 'Personal banking account' },
  { value: 'business', label: 'Business', description: 'Corporate or business account' },
  { value: 'royalty', label: 'Royalty', description: 'Premium account for royal families' },
  { value: 'government', label: 'Government', description: 'Sovereign government account' },
  { value: 'country_owner', label: 'Country Owner', description: 'Elite account for nation owners' },
  { value: 'continental', label: 'Continental', description: 'Trans-continental management' }
];

function RegisterPage() {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [generatedPassword, setGeneratedPassword] = useState('');
  const { register, handleSubmit, formState: { errors }, watch, setValue } = useForm({
    resolver: yupResolver(schema)
  });

  const password = watch('password');

  const generatePassword = async () => {
    try {
      const response = await axios.post('/api/auth/generate-password');
      setGeneratedPassword(response.data.data.password);
      setValue('password', response.data.data.password);
      setValue('confirmPassword', response.data.data.password);
      toast.success('Secure password generated!');
    } catch (error) {
      toast.error('Failed to generate password');
    }
  };

  const onSubmit = async (data) => {
    if (activeStep < steps.length - 1) {
      setActiveStep(activeStep + 1);
      return;
    }

    setLoading(true);
    try {
      await axios.post('/api/auth/register', data);
      toast.success('Account created successfully! Please check your email to verify.');
      navigate('/login');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    setActiveStep(activeStep - 1);
  };

  const getStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <>
            <TextField
              fullWidth
              label="First Name"
              margin="normal"
              {...register('firstName')}
              error={!!errors.firstName}
              helperText={errors.firstName?.message}
            />
            <TextField
              fullWidth
              label="Last Name"
              margin="normal"
              {...register('lastName')}
              error={!!errors.lastName}
              helperText={errors.lastName?.message}
            />
            <TextField
              fullWidth
              label="Email Address"
              type="email"
              margin="normal"
              {...register('email')}
              error={!!errors.email}
              helperText={errors.email?.message}
            />
            <TextField
              fullWidth
              label="Phone Number"
              margin="normal"
              {...register('phone')}
              error={!!errors.phone}
              helperText={errors.phone?.message}
              placeholder="+1 (555) 123-4567"
            />
            <TextField
              fullWidth
              label="Country"
              margin="normal"
              {...register('country')}
              error={!!errors.country}
              helperText={errors.country?.message}
            />
            <FormControl fullWidth margin="normal" error={!!errors.continent}>
              <InputLabel>Continent</InputLabel>
              <Select label="Continent" {...register('continent')}>
                {continents.map((c) => (
                  <MenuItem key={c} value={c}>{c}</MenuItem>
                ))}
              </Select>
              {errors.continent && <Typography variant="caption" color="error">{errors.continent.message}</Typography>}
            </FormControl>
          </>
        );
      case 1:
        return (
          <>
            <FormControl fullWidth margin="normal" error={!!errors.accountType}>
              <InputLabel>Account Type</InputLabel>
              <Select label="Account Type" {...register('accountType')}>
                {accountTypes.map((type) => (
                  <MenuItem key={type.value} value={type.value}>
                    <Box>
                      <Typography variant="body1" fontWeight="bold">{type.label}</Typography>
                      <Typography variant="caption" color="text.secondary">{type.description}</Typography>
                    </Box>
                  </MenuItem>
                ))}
              </Select>
              {errors.accountType && <Typography variant="caption" color="error">{errors.accountType.message}</Typography>}
            </FormControl>

            {watch('accountType') === 'business' && (
              <>
                <TextField
                  fullWidth
                  label="Business Name"
                  margin="normal"
                  {...register('businessName')}
                />
                <FormControl fullWidth margin="normal">
                  <InputLabel>Business Type</InputLabel>
                  <Select label="Business Type" {...register('businessType')}>
                    <MenuItem value="corporation">Corporation</MenuItem>
                    <MenuItem value="llc">LLC</MenuItem>
                    <MenuItem value="partnership">Partnership</MenuItem>
                    <MenuItem value="sole_proprietorship">Sole Proprietorship</MenuItem>
                    <MenuItem value="ngo">NGO</MenuItem>
                    <MenuItem value="non_profit">Non-Profit</MenuItem>
                  </Select>
                </FormControl>
              </>
            )}

            {watch('accountType') === 'royalty' && (
              <>
                <TextField
                  fullWidth
                  label="Title"
                  margin="normal"
                  {...register('title')}
                  placeholder="e.g., King, Queen, Prince"
                />
                <TextField
                  fullWidth
                  label="Royal House"
                  margin="normal"
                  {...register('royalHouse')}
                  placeholder="e.g., House of Windsor"
                />
              </>
            )}

            {watch('accountType') === 'government' && (
              <TextField
                fullWidth
                label="Government Position"
                margin="normal"
                {...register('governmentPosition')}
                placeholder="e.g., Minister, Governor"
              />
            )}

            {watch('accountType') === 'country_owner' && (
              <TextField
                fullWidth
                label="Country Owned"
                margin="normal"
                {...register('countryOwned')}
                placeholder="e.g., United States"
              />
            )}
          </>
        );
      case 2:
        return (
          <>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start', mb: 2 }}>
              <TextField
                fullWidth
                label="Password"
                type="password"
                margin="normal"
                {...register('password')}
                error={!!errors.password}
                helperText={errors.password?.message}
              />
              <Button
                variant="outlined"
                onClick={generatePassword}
                sx={{ mt: 1, height: 56 }}
              >
                Generate
              </Button>
            </Box>
            {generatedPassword && (
              <Alert severity="success" sx={{ mb: 2 }}>
                Generated secure password: <strong>{generatedPassword}</strong>
              </Alert>
            )}
            <TextField
              fullWidth
              label="Confirm Password"
              type="password"
              margin="normal"
              {...register('confirmPassword')}
              error={!!errors.confirmPassword}
              helperText={errors.confirmPassword?.message}
            />

            <Alert severity="info" sx={{ mt: 2 }}>
              <Typography variant="body2">
                <strong>Password Requirements:</strong>
                <ul>
                  <li>Minimum 12 characters</li>
                  <li>At least one uppercase letter</li>
                  <li>At least one lowercase letter</li>
                  <li>At least one number</li>
                  <li>At least one special character</li>
                </ul>
              </Typography>
            </Alert>

            <Alert severity="warning" sx={{ mt: 2 }}>
              <Typography variant="body2">
                Your password will be encrypted using AES-256-GCM and stored securely.
              </Typography>
            </Alert>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', bgcolor: '#f5f5f5', py: 4 }}>
      <Container maxWidth="md">
        <Card sx={{ boxShadow: 6 }}>
          <CardContent sx={{ p: 4 }}>
            <Typography variant="h4" align="center" gutterBottom color="primary" fontWeight="bold">
              Create Account
            </Typography>
            <Typography variant="body1" align="center" color="text.secondary" gutterBottom sx={{ mb: 4 }}>
              Join Amenires World Bank - The Future of Banking
            </Typography>

            <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
              {steps.map((label) => (
                <Step key={label}>
                  <StepLabel>{label}</StepLabel>
                </Step>
              ))}
            </Stepper>

            <form onSubmit={handleSubmit(onSubmit)}>
              {getStepContent(activeStep)}

              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
                {activeStep > 0 && (
                  <Button onClick={handleBack} variant="outlined">
                    Back
                  </Button>
                )}
                <Box sx={{ ml: 'auto' }}>
                  <Button
                    type="submit"
                    variant="contained"
                    disabled={loading}
                    sx={{ minWidth: 120 }}
                  >
                    {loading ? 'Creating...' : activeStep === steps.length - 1 ? 'Create Account' : 'Next'}
                  </Button>
                </Box>
              </Box>
            </form>

            <Divider sx={{ my: 3 }} />

            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                Already have an account?{' '}
                <Link
                  component="button"
                  variant="body2"
                  onClick={() => navigate('/login')}
                  sx={{ fontWeight: 600, cursor: 'pointer' }}
                >
                  Sign In
                </Link>
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
}

export default RegisterPage;
