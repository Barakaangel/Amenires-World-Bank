import React from 'react';
import { Container, Box, Typography, Button, Grid, Card, CardContent, Chip, Divider } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { AccountBalance, Security, Speed, Public, Business, VerifiedUser } from '@mui/icons-material';

function HomePage() {
  const navigate = useNavigate();

  const features = [
    {
      icon: <Security fontSize="large" color="primary" />,
      title: 'Military-Grade Security',
      description: 'AES-256-GCM encryption, quantum-resistant algorithms, and multi-factor authentication protect your assets.'
    },
    {
      icon: <Speed fontSize="large" color="primary" />,
      title: 'Instant Transactions',
      description: 'Real-time processing with 99.999% uptime across our global network of Tier-IV data centers.'
    },
    {
      icon: <Public fontSize="large" color="primary" />,
      title: 'Global Coverage',
      description: 'Operational in 195 countries across 7 continents with 7 data centers and 3 orbital satellites.'
    },
    {
      icon: <Business fontSize="large" color="primary" />,
      title: 'All Account Types',
      description: 'Support for individuals, businesses, royalty, governments, and country owners.'
    },
    {
      icon: <VerifiedUser fontSize="large" color="primary" />,
      title: 'Regulatory Compliance',
      description: 'Fully compliant with Basel III/IV, FATF, GDPR, PCI DSS, SOC 2 Type II, and ISO 27001 standards.'
    },
    {
      icon: <AccountBalance fontSize="large" color="primary" />,
      title: 'Multi-Currency Support',
      description: 'USD, EUR, GBP, JPY, CNY, CHF, BTC, ETH, and GOLD with real-time exchange rates.'
    }
  ];

  const accountTypes = [
    { type: 'Individual', description: 'Personal banking with full financial services' },
    { type: 'Business', description: 'Corporate accounts with enhanced features' },
    { type: 'Royalty', description: 'Premium services for royal families' },
    { type: 'Government', description: 'Sovereign accounts for nations' },
    { type: 'Country Owner', description: 'Elite accounts for nation owners' },
    { type: 'Continental', description: 'Trans-continental financial management' }
  ];

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f5f5f5' }}>
      {/* Hero Section */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, #1a237e 0%, #0d47a1 50%, #1976d2 100%)',
          color: 'white',
          py: 12,
          px: 3
        }}
      >
        <Container maxWidth="lg">
          <Typography
            variant="h1"
            gutterBottom
            sx={{
              fontSize: { xs: '2rem', md: '3.5rem' },
              fontWeight: 800,
              textAlign: 'center'
            }}
          >
            Amenires World Bank
          </Typography>
          <Typography
            variant="h4"
            gutterBottom
            sx={{
              fontSize: { xs: '1.25rem', md: '1.75rem' },
              fontWeight: 400,
              textAlign: 'center',
              mb: 4,
              opacity: 0.9
            }}
          >
            The Strongest & Most Secure Banking System on Earth
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap', mt: 4 }}>
            <Button
              variant="contained"
              size="large"
              onClick={() => navigate('/register')}
              sx={{
                bgcolor: '#ffd700',
                color: '#000',
                '&:hover': { bgcolor: '#ffea00' },
                px: 4,
                py: 2,
                fontSize: '1.1rem'
              }}
            >
              Open Account Now
            </Button>
            <Button
              variant="outlined"
              size="large"
              onClick={() => navigate('/login')}
              sx={{
                borderColor: 'white',
                color: 'white',
                '&:hover': { borderColor: '#ffd700', color: '#ffd700' },
                px: 4,
                py: 2,
                fontSize: '1.1rem'
              }}
            >
              Sign In
            </Button>
          </Box>
        </Container>
      </Box>

      {/* Stats Section */}
      <Container maxWidth="lg" sx={{ py: 8, mt: -8 }}>
        <Card sx={{ bgcolor: 'white', boxShadow: 6 }}>
          <CardContent>
            <Grid container spacing={4}>
              <Grid item xs={12} sm={6} md={3}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h3" color="primary" fontWeight="bold">
                    195
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    Countries
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h3" color="primary" fontWeight="bold">
                    90T
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    AI Superintelligences
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h3" color="primary" fontWeight="bold">
                    99.999%
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    Uptime
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h3" color="primary" fontWeight="bold">
                    AES-256
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    Encryption
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Container>

      {/* Features Section */}
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Typography variant="h3" align="center" gutterBottom sx={{ mb: 6 }}>
          World-Class Features
        </Typography>
        <Grid container spacing={4}>
          {features.map((feature, index) => (
            <Grid item xs={12} md={6} key={index}>
              <Card sx={{ height: '100%', transition: 'transform 0.3s', '&:hover': { transform: 'translateY(-4px)' } }}>
                <CardContent>
                  <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                    {feature.icon}
                    <Typography variant="h6" fontWeight="bold">
                      {feature.title}
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    {feature.description}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* Account Types Section */}
      <Box sx={{ bgcolor: '#e3f2fd', py: 12 }}>
        <Container maxWidth="lg">
          <Typography variant="h3" align="center" gutterBottom sx={{ mb: 6 }}>
            Account Types
          </Typography>
          <Grid container spacing={3}>
            {accountTypes.map((account, index) => (
              <Grid item xs={12} sm={6} md={4} key={index}>
                <Card sx={{ height: '100%' }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom color="primary" fontWeight="bold">
                      {account.type}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {account.description}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* Security Section */}
      <Container maxWidth="lg" sx={{ py: 12 }}>
        <Typography variant="h3" align="center" gutterBottom sx={{ mb: 6 }}>
          Unmatched Security
        </Typography>
        <Grid container spacing={3}>
          {[
            'Two-Factor Authentication (2FA)',
            'Biometric Verification',
            'Advanced Fraud Detection AI',
            'Real-time Transaction Monitoring',
            'Quantum-Resistant Cryptography',
            'Hardware Security Modules (HSM)',
            'Zero-Trust Architecture',
            'Continuous Security Audits'
          ].map((security, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <Chip
                label={security}
                color="primary"
                variant="outlined"
                sx={{ width: '100%', py: 2 }}
              />
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* CTA Section */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, #1a237e 0%, #0d47a1 100%)',
          color: 'white',
          py: 12,
          px: 3
        }}
      >
        <Container maxWidth="lg" sx={{ textAlign: 'center' }}>
          <Typography variant="h3" gutterBottom sx={{ mb: 4 }}>
            Ready to Experience the Future of Banking?
          </Typography>
          <Typography variant="h6" gutterBottom sx={{ mb: 6, opacity: 0.9 }}>
            Join millions of customers worldwide who trust Amenires World Bank
          </Typography>
          <Button
            variant="contained"
            size="large"
            onClick={() => navigate('/register')}
            sx={{
              bgcolor: '#ffd700',
              color: '#000',
              '&:hover': { bgcolor: '#ffea00' },
              px: 6,
              py: 2,
              fontSize: '1.2rem'
            }}
          >
            Get Started Today
          </Button>
        </Container>
      </Box>

      {/* Footer */}
      <Box sx={{ bgcolor: '#1a237e', color: 'white', py: 6, px: 3 }}>
        <Container maxWidth="lg">
          <Grid container spacing={4}>
            <Grid item xs={12} md={4}>
              <Typography variant="h6" gutterBottom>
                Amenires World Bank
              </Typography>
              <Typography variant="body2" color="white" opacity={0.7}>
                The strongest and most secure banking system on Earth.
              </Typography>
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography variant="h6" gutterBottom>
                Quick Links
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Typography variant="body2" color="white" opacity={0.7}>About Us</Typography>
                <Typography variant="body2" color="white" opacity={0.7}>Services</Typography>
                <Typography variant="body2" color="white" opacity={0.7}>Security</Typography>
                <Typography variant="body2" color="white" opacity={0.7}>Contact</Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography variant="h6" gutterBottom>
                Legal
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Typography variant="body2" color="white" opacity={0.7}>Terms of Service</Typography>
                <Typography variant="body2" color="white" opacity={0.7}>Privacy Policy</Typography>
                <Typography variant="body2" color="white" opacity={0.7}>Cookie Policy</Typography>
              </Box>
            </Grid>
          </Grid>
          <Divider sx={{ my: 4, borderColor: 'rgba(255,255,255,0.1)' }} />
          <Typography variant="body2" color="white" opacity={0.5} align="center">
            © 2024 Amenires World Bank. All rights reserved. Protected by 90 trillion AI superintelligences.
          </Typography>
        </Container>
      </Box>
    </Box>
  );
}

export default HomePage;
