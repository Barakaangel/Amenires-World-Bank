import React from 'react';
import { Container, Typography } from '@mui/material';

function SecurityPage() {
  return (
    <Container>
      <Typography variant="h4" gutterBottom>
        Security Settings
      </Typography>
      <Typography variant="body1">
        Manage your security preferences and two-factor authentication.
      </Typography>
    </Container>
  );
}

export default SecurityPage;
